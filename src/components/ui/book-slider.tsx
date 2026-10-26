import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { PageFlip } from "page-flip";
import { animate } from "motion/mini";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { BookPage } from "@/components/book-pages";
import { ReadingView } from "@/components/reading-view";
import { github, opening, pages, chapters } from "@/data/portfolio";
import { adjacentPage, pageIndex, visiblePages } from "@/lib/book-navigation";
import { useBookPresentation } from "@/lib/use-book-presentation";
import { useMediaQuery } from "@/lib/use-media-query";

type Dimensions = { width: number; height: number; mobile: boolean };
type FlipEvent = { data: number | string };
type PageCorner = "top" | "bottom";
type TurnOrigin = PageCorner | "middle";
type Corner = { side: "left" | "right"; end: PageCorner };
type TurnZone = { side: Corner["side"]; end: TurnOrigin };

function CrossfadeFace({
  visible,
  column,
  children,
}: {
  visible: boolean;
  column: number;
  children: React.ReactNode;
}) {
  const node = useRef<HTMLDivElement>(null);
  const initial = useRef(visible);
  useLayoutEffect(() => {
    const control = animate(
      node.current!,
      { opacity: visible ? 1 : 0 },
      {
        duration: durationToken("--dur-crossfade") / 1000,
        ease: token("--ease-in-out")
          .match(/[\d.]+/g)!
          .map(Number) as [number, number, number, number],
      },
    );
    return () => control.stop();
  }, [visible]);
  return (
    <div
      ref={node}
      className="plain-face"
      style={{ gridColumn: column, opacity: initial.current ? 1 : 0 }}
      aria-hidden={!visible}
      inert={!visible}
    >
      {children}
    </div>
  );
}

function PageNavButton({
  quiet,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { quiet: boolean }) {
  const node = useRef<HTMLButtonElement>(null);
  const animation = useRef<{ stop(): void } | null>(null);
  const pressed = useRef(false);
  const press = (down: boolean) => {
    if (quiet || !node.current || pressed.current === down) return;
    pressed.current = down;
    animation.current?.stop();
    animation.current = animate(
      node.current,
      { transform: `scale(${down ? numberToken("--press-scale") : 1})` },
      {
        duration: durationToken("--dur-fast") / 1000,
        ease: token("--ease-out")
          .match(/[\d.]+/g)!
          .map(Number) as [number, number, number, number],
      },
    );
  };
  useEffect(() => {
    if (quiet && node.current) {
      pressed.current = false;
      animation.current?.stop();
      node.current.style.removeProperty("transform");
    }
    return () => animation.current?.stop();
  }, [quiet]);
  return (
    <button
      {...props}
      ref={node}
      onPointerDown={() => press(true)}
      onPointerUp={() => press(false)}
      onPointerLeave={() => press(false)}
      onPointerCancel={() => press(false)}
      onBlur={() => press(false)}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") press(true);
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") press(false);
      }}
    />
  );
}

function token(name: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
function numberToken(name: string) {
  return parseFloat(token(name));
}
function durationToken(name: string) {
  const value = token(name);
  // Production CSS can serialize 800ms as .8s. The engine expects milliseconds.
  return parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
}
function turnZoneAt(
  element: HTMLElement,
  x: number,
  y: number,
  page: number,
  mobile: boolean,
): TurnZone | null {
  const rect = element.getBoundingClientRect();
  const scale = rect.width / element.offsetWidth;
  const pageWidth = rect.width / (mobile ? 1 : 2);
  const edge = Math.min(
    numberToken("--turn-hit-max") * scale,
    Math.max(
      numberToken("--turn-hit-min") * scale,
      pageWidth * numberToken("--turn-hit-ratio"),
    ),
    pageWidth / 2,
  );
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)
    return null;
  const side =
    x <= rect.left + edge ? "left" : x >= rect.right - edge ? "right" : null;
  const corner = numberToken("--corner-hit-area") * scale;
  const end =
    y <= rect.top + corner
      ? "top"
      : y >= rect.bottom - corner
        ? "bottom"
        : "middle";
  if (!side) return null;
  if (adjacentPage(page, side === "right" ? 1 : -1, mobile) === page)
    return null;
  return { side, end };
}

function cornerAt(...args: Parameters<typeof turnZoneAt>): Corner | null {
  const zone = turnZoneAt(...args);
  return zone && zone.end !== "middle"
    ? { side: zone.side, end: zone.end }
    : null;
}

function setTurnDensity(engine: PageFlip, straight: boolean) {
  // Both rendering paths belong to StPageFlip: soft corners and a straight
  // native hinge for the middle edge. Restore each page's original density.
  pages.forEach((_, i) => {
    const page = engine.getPage(i);
    page.setDrawingDensity(straight ? "hard" : page.getDensity());
  });
}

export default function Book() {
  const requestedMobile = useMediaQuery("(max-width: 767px)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const stage = useRef<HTMLDivElement>(null);
  const presentation = useRef<HTMLElement>(null);
  const source = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const flip = useRef<PageFlip | null>(null);
  const materializePages = useRef<(() => void) | null>(null);
  const current = useRef(0);
  const logical = useRef(0);
  const [logicalPage, setLogicalPage] = useState(0);
  const readingRoot = useRef<HTMLDivElement>(null);
  const lastPageFocus = useRef<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const wanted = useRef<{ page: number; corner: TurnOrigin } | null>(null);
  const firstTurnFrame = useRef<number | null>(null);
  const focusAfterPage = useRef(false);
  const pendingTarget = useRef<number | null>(null);
  const [page, setPage] = useState(0);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  // A collapsed/hidden viewport must not replace a working engine. Commit its
  // responsive mode together with usable page geometry, never independently.
  const mobile = dimensions?.mobile ?? requestedMobile;
  const [ready, setReady] = useState(false);
  const [readMode, setReadMode] = useState(false);
  const [turning, setTurning] = useState(false);
  const plain = reduced || readMode;
  const group = readMode ? [page] : visiblePages(page, mobile);
  const previous = adjacentPage(page, -1, readMode || mobile);
  const next = adjacentPage(page, 1, readMode || mobile);
  // Chapter ranges include continuation faces (for example, both references).
  const activeChapter = chapters
    .filter((chapter) => pageIndex(chapter.id)! <= logicalPage)
    .at(-1);
  const { apply: present, model: presentationModel } = useBookPresentation(
    stage,
    presentation,
    dimensions,
    mobile,
    page,
    !readMode,
  );
  useLayoutEffect(() => {
    if (plain) present(page === 0 ? 0 : 1, true);
  }, [plain, page, present]);

  useLayoutEffect(() => {
    if (!stage.current || !source.current) return;
    let disposed = false;
    let frame: number | undefined;
    let lastWidth = -1;
    let lastViewportWidth = -1;
    let fontsReady = false;
    let loadingFonts = false;
    const readableHeight = (width: number, minimum: number) => {
      const measurement = source.current!;
      measurement.style.display = "block";
      measurement.style.setProperty("--page-width", `${width}px`);
      measurement.style.setProperty("--page-height", `${minimum}px`);
      let height = minimum;
      try {
        // Measure the real typeset pages at their final width. Only the tablet
        // fallback grows; desktop keeps the monograph's reference proportions.
        for (const face of measurement.querySelectorAll<HTMLElement>(
          ".book-page:not(.page--cover):not(.page--portrait)",
        )) {
          const surfaces = [
            face,
            ...face.querySelectorAll<HTMLElement>(
              ".sheet-surface,.page-inner,.page-content",
            ),
          ];
          const previous = surfaces.map((element) =>
            element.getAttribute("style"),
          );
          for (const element of surfaces) {
            element.style.height = "auto";
            element.style.minHeight = "0";
            if (element.classList.contains("page-content"))
              element.style.flex = "0 0 auto";
          }
          height = Math.max(
            height,
            Math.ceil(face.getBoundingClientRect().height),
          );
          surfaces.forEach((element, i) => {
            if (previous[i] === null) element.removeAttribute("style");
            else element.setAttribute("style", previous[i]!);
          });
        }
      } finally {
        measurement.style.display = "";
      }
      return height;
    };
    const measure = () => {
      frame = undefined;
      if (disposed || !stage.current || !source.current) return;
      const tablet =
        !requestedMobile && window.matchMedia("(max-width: 1023px)").matches;
      // Ratio-only desktop/phone geometry is independent of font metrics. The
      // closed cover can paint without waiting for the interior numeral face.
      if (tablet && !fontsReady) {
        if (!loadingFonts) {
          loadingFonts = true;
          Promise.allSettled([
            document.fonts.load(
              `500 ${token("--text-4xl")} "Cormorant Garamond"`,
            ),
            document.fonts.load(
              `300 ${token("--text-3xl")} "Cormorant Garamond"`,
            ),
            document.fonts.load(`400 ${token("--text-base")} "EB Garamond"`),
          ]).then(() => {
            fontsReady = true;
            schedule();
          });
        }
        return;
      }
      const foreEdge = numberToken("--material-fore-edge-depth");
      const boardOverhang = numberToken("--material-board-overhang");
      const physicalWidth = requestedMobile
        ? foreEdge + boardOverhang * 2
        : (foreEdge + boardOverhang) * 2;
      const available = Math.min(
        stage.current.clientWidth - physicalWidth,
        numberToken("--book-width"),
      );
      if (!Number.isFinite(available) || available <= 0) return;
      lastWidth = stage.current.clientWidth;
      lastViewportWidth = window.innerWidth;
      const width = Math.floor(available / (requestedMobile ? 1 : 2));
      const proportionalHeight = Math.round(
        requestedMobile
          ? width / numberToken("--phone-page-ratio")
          : width / numberToken("--page-ratio"),
      );
      if (
        !Number.isFinite(width) ||
        width <= 0 ||
        !Number.isFinite(proportionalHeight) ||
        proportionalHeight <= 0
      )
        return;
      const height = tablet
        ? readableHeight(width, proportionalHeight)
        : proportionalHeight;
      if (!Number.isFinite(height) || height <= 0) return;
      source.current.style.setProperty("--page-width", `${width}px`);
      source.current.style.setProperty("--page-height", `${height}px`);
      setDimensions((old) =>
        old?.width === width &&
        old.height === height &&
        old.mobile === requestedMobile
          ? old
          : { width, height, mobile: requestedMobile },
      );
    };
    const schedule = () => {
      if (frame === undefined && !disposed)
        frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(([entry]) => {
      // Presentation changes the stage height while a cover moves. Observe its
      // width only, so native opening cannot trigger an engine rebuild. Ignore
      // scrollbar-only width deltas at a fixed window.innerWidth.
      const width = entry.contentRect.width;
      const scrollbarOnly =
        lastWidth > 0 &&
        window.innerWidth === lastViewportWidth &&
        Math.abs(width - lastWidth) <= numberToken("--s6");
      if (width !== lastWidth && !scrollbarOnly) {
        lastWidth = width;
        schedule();
      }
    });
    observer.observe(stage.current);
    measure();
    document.fonts.addEventListener("loadingdone", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      disposed = true;
      if (frame !== undefined) cancelAnimationFrame(frame);
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [requestedMobile]);

  const setVisible = useCallback(
    (index: number) => {
      const visibleIndices = visiblePages(index, mobile);
      const normalized = visibleIndices[0];
      const exact = pendingTarget.current;
      const location =
        exact !== null && visibleIndices.includes(exact)
          ? exact
          : visibleIndices.includes(logical.current)
            ? logical.current
            : normalized;
      logical.current = location;
      setLogicalPage(location);
      current.current = normalized;
      setPage(normalized);
      const active = document.activeElement;
      let transferFocus = focusAfterPage.current;
      focusAfterPage.current = false;
      slot.current
        ?.querySelectorAll<HTMLElement>("[data-page]")
        .forEach((node) => {
          const n = Number(node.dataset.page);
          const visible = visibleIndices.includes(n);
          node.inert = !visible;
          node.setAttribute("aria-hidden", String(!visible));
          if (!visible && node.contains(active)) transferFocus = true;
        });
      if (transferFocus)
        slot.current
          ?.querySelector<HTMLElement>(`[data-page="${location}"] h2`)
          ?.focus({ preventScroll: true });
    },
    [mobile],
  );

  const navigate = useCallback(
    (requested: number, corner: TurnOrigin = "bottom") => {
      requested = Math.max(0, Math.min(pages.length - 1, requested));
      if (readMode) {
        logical.current = requested;
        current.current = requested;
        setLogicalPage(requested);
        setPage(requested);
        const section = readingRoot.current?.querySelector<HTMLElement>(
          `[data-reading-page="${requested}"]`,
        );
        section?.scrollIntoView({ block: "start", behavior: "auto" });
        if (focusAfterPage.current)
          section
            ?.querySelector<HTMLElement>("h2")
            ?.focus({ preventScroll: true });
        focusAfterPage.current = false;
        setAnnouncement(
          `Page ${requested + 1} of ${pages.length}. ${pages[requested].title}.`,
        );
        return;
      }
      const target = visiblePages(requested, mobile)[0];
      if (plain) {
        focusAfterPage.current ||=
          !!document.activeElement?.closest(".plain-face");
        current.current = target;
        logical.current = requested;
        setLogicalPage(requested);
        setPage(target);
        return;
      }
      const engine = flip.current;
      if (!engine) return;
      materializePages.current?.();
      const state = engine.getState();
      if (
        firstTurnFrame.current !== null ||
        state === "flipping" ||
        state === "user_fold"
      ) {
        wanted.current = { page: requested, corner };
        return;
      }
      wanted.current = null;
      logical.current = requested;
      setLogicalPage(requested);
      if (target !== current.current) {
        const startTurn = () => {
          firstTurnFrame.current = null;
          if (flip.current !== engine) return;
          // A pointer can begin a native drag while the toolbar feedback paints.
          // Let that gesture settle before dispatching this requested chapter.
          if (
            engine.getState() === "user_fold" ||
            engine.getState() === "flipping"
          ) {
            wanted.current ??= { page: requested, corner };
            return;
          }
          // Finish a returning hover before choosing the next native page mode.
          if (engine.getFlipController().getCalculation())
            engine.getRender().finishAnimation();
          pendingTarget.current = requested;
          setTurnDensity(engine, corner === "middle");
          engine.getSettings().flippingTime = durationToken(
            current.current === 0 || target === 0
              ? "--dur-cover"
              : "--dur-slow",
          );
          // StPageFlip's corner-only guard also blocks its own portrait flipPrev()
          // coordinate. Bypass that guard only for this explicit navigation call.
          const settings = engine.getSettings(),
            cornerOnly = settings.disableFlipByClick;
          settings.disableFlipByClick = false;
          try {
            engine.flip(target, corner === "middle" ? "bottom" : corner);
          } finally {
            settings.disableFlipByClick = cornerOnly;
          }
        };
        if (current.current === 0) {
          // The first native fold can incur cold compositor/raster work. Paint
          // the selected chapter first, then start the unchanged native turn.
          // This leaves input available and retains the latest queued request.
          setTurning(true);
          firstTurnFrame.current = requestAnimationFrame(() => {
            firstTurnFrame.current = requestAnimationFrame(startTurn);
          });
        } else startTurn();
      } else if (focusAfterPage.current) {
        focusAfterPage.current = false;
        slot.current
          ?.querySelector<HTMLElement>(`[data-page="${requested}"] h2`)
          ?.focus({ preventScroll: true });
      }
    },
    [mobile, plain, readMode],
  );
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const readingNavigate = useCallback(
    (index: number) => {
      focusAfterPage.current = true;
      navigate(index);
    },
    [navigate],
  );
  useLayoutEffect(() => {
    if (plain && focusAfterPage.current) {
      // Motion commits its face styles in layout effects too. Focus on the next
      // frame, after visibility and inert state have both reached the browser.
      const frame = requestAnimationFrame(() => {
        stage.current
          ?.querySelector<HTMLElement>(
            `.plain-face[aria-hidden="false"] [data-page="${logical.current}"] h2`,
          )
          ?.focus({ preventScroll: true });
      });
      focusAfterPage.current = false;
      return () => cancelAnimationFrame(frame);
    }
  }, [plain, page, logicalPage]);

  useLayoutEffect(() => {
    if (
      !dimensions ||
      !Number.isFinite(dimensions.width) ||
      !Number.isFinite(dimensions.height) ||
      dimensions.width <= 0 ||
      dimensions.height <= 0 ||
      plain ||
      !source.current ||
      !slot.current
    ) {
      setReady(plain);
      return;
    }
    const root = document.createElement("div");
    root.className = "flip-engine";
    slot.current.append(root);
    const originals = Array.from(source.current.children);
    const deferContents = logical.current === 0;
    const copies = originals.map(
      (x, i) => x.cloneNode(!deferContents || i === 0) as HTMLElement,
    );
    root.append(...copies);
    const engine = new PageFlip(root, {
      width: dimensions.width,
      height: dimensions.height,
      size: "fixed",
      usePortrait: mobile,
      showCover: true,
      startPage: visiblePages(logical.current, mobile)[0],
      flippingTime: durationToken("--dur-slow"),
      drawShadow: true,
      maxShadowOpacity: numberToken("--curl-opacity"),
      autoSize: true,
      mobileScrollSupport: true,
      clickEventForward: true,
      useMouseEvents: false,
      swipeDistance: numberToken("--s8"),
      showPageCorners: false,
      disableFlipByClick: true,
    });
    flip.current = engine;
    const initialLogical = logical.current;
    let initialized = false;
    let contentsReady = !deferContents;
    let contentsFrame: number | undefined;
    const fillContents = () => {
      if (contentsReady) return;
      contentsReady = true;
      copies.forEach((copy, i) => {
        if (i)
          copy.append(
            ...Array.from(originals[i].childNodes, (node) =>
              node.cloneNode(true),
            ),
          );
      });
      if (initialized) setReady(true);
    };
    materializePages.current = fillContents;
    // Keep every engine-owned shell stable, but let the actual cover paint
    // before cloning interiors. Any interaction fills them synchronously.
    root.addEventListener("pointerover", fillContents, true);
    root.addEventListener("pointerdown", fillContents, true);
    let stagingFrame: number | undefined;
    let transitionStart = current.current;
    let mouseActive = false;
    const nativePoint = (x: number, y: number) => {
      const rect = root.getBoundingClientRect();
      const scale = presentationModel.current.scale;
      return { x: (x - rect.left) / scale, y: (y - rect.top) / scale };
    };
    const sampleStage = () => {
      const calculation = engine.getFlipController().getCalculation();
      if (calculation) {
        const backward = calculation.getDirection() === 1;
        const coverTurn =
          transitionStart === 0 ||
          (backward && (transitionStart === 1 || pendingTarget.current === 0));
        if (coverTurn) {
          if (presentation.current)
            presentation.current.dataset.coverTransition = "true";
          const progress = calculation.getFlippingProgress() / 100;
          present(backward ? 1 - progress : progress);
        }
      }
      stagingFrame = requestAnimationFrame(sampleStage);
    };
    let previewCorner: Corner | null = null;
    let previewTimer: ReturnType<typeof setTimeout> | undefined;
    let previewFrame: number | undefined;
    const clearPreviewTimer = () => {
      clearTimeout(previewTimer);
      previewTimer = undefined;
    };
    const clearPreviewFrame = () => {
      if (previewFrame !== undefined) cancelAnimationFrame(previewFrame);
      previewFrame = undefined;
    };
    const previewAt = (x: number, y: number, interactive: boolean) => {
      const state = engine.getState();
      if (state !== "read" && state !== "fold_corner") return;
      clearPreviewTimer();
      const corner =
        interactive || current.current === 0
          ? null
          : cornerAt(root, x, y, current.current, mobile);
      if (
        corner?.side === previewCorner?.side &&
        corner?.end === previewCorner?.end
      )
        return;
      const controller = engine.getFlipController();
      const rect = engine.getBoundsRect();
      if (previewCorner) {
        clearPreviewFrame();
        previewCorner = null;
        controller.showCorner({
          x: rect.left + rect.width / 2,
          y: rect.height / 2,
        });
      }
      if (!corner) return;
      if (controller.getCalculation()) {
        previewTimer = setTimeout(
          () => previewAt(x, y, interactive),
          durationToken("--dur-fast"),
        );
        return;
      }
      previewCorner = corner;
      const inset = numberToken("--s4");
      // Ask the native engine for one small, fixed corner preview. Pointer
      // movement cannot scrub it farther until the user presses and drags.
      // Start immediately after the native renderer updates its frame clock.
      previewFrame = requestAnimationFrame(() => {
        previewFrame = undefined;
        if (previewCorner !== corner) return;
        controller.showCorner({
          x: rect.left + (corner.side === "left" ? inset : rect.width - inset),
          y: corner.end === "top" ? inset : rect.height - inset,
        });
        const lift = numberToken("--corner-lift");
        const steps = Math.ceil(lift - inset);
        const frames = Array.from({ length: steps + 1 }, (_, i) => {
          const distance = inset + ((lift - inset) * i) / steps;
          const point = {
            x:
              rect.left +
              (corner.side === "left" ? distance : rect.width - distance),
            y: corner.end === "top" ? distance : rect.height - distance,
          };
          return () => controller.showCorner(point);
        });
        engine
          .getRender()
          .startAnimation(frames, durationToken("--dur-fast"), () => {});
      });
    };
    const hoverPreview = (event: MouseEvent) => {
      if (event.buttons !== 0) return;
      previewAt(
        event.clientX,
        event.clientY,
        !!(event.target as Element).closest('a,button,[role="region"]'),
      );
    };
    const dismissPreview = () => previewAt(0, 0, true);
    engine.on("init", () => {
      if (flip.current !== engine) return;
      initialized = true;
      pendingTarget.current = initialLogical;
      setVisible(engine.getCurrentPageIndex());
      pendingTarget.current = null;
      present(current.current === 0 ? 0 : 1, true);
      if (contentsReady) setReady(true);
      else
        contentsFrame = requestAnimationFrame(() => {
          contentsFrame = requestAnimationFrame(fillContents);
        });
    });
    engine.on("flip", (event: FlipEvent) => {
      // A retiring engine can emit its old group while the responsive mode
      // changes. Keep the exact logical destination for the replacement.
      if (
        !initialized ||
        flip.current !== engine ||
        window.matchMedia("(max-width: 767px)").matches !== mobile
      )
        return;
      setVisible(Number(event.data));
    });
    engine.on("changeState", (event: FlipEvent) => {
      setTurning(event.data === "flipping" || event.data === "user_fold");
      if (event.data === "flipping" || event.data === "user_fold") {
        if (stagingFrame === undefined) {
          transitionStart = current.current;
          presentation.current?.style.setProperty("will-change", "transform");
          stagingFrame = requestAnimationFrame(sampleStage);
        }
        clearPreviewTimer();
        clearPreviewFrame();
        previewCorner = null;
      }
      if (event.data === "read") {
        if (stagingFrame !== undefined) cancelAnimationFrame(stagingFrame);
        stagingFrame = undefined;
        presentation.current?.style.removeProperty("will-change");
        if (presentation.current)
          delete presentation.current.dataset.coverTransition;
        present(current.current === 0 ? 0 : 1, true);
        pendingTarget.current = null;
        setTurnDensity(engine, false);
        engine.getSettings().flippingTime = durationToken("--dur-slow");
      }
      if (event.data === "read" && wanted.current !== null) {
        const target = wanted.current;
        wanted.current = null;
        queueMicrotask(() => {
          if (flip.current === engine)
            navigateRef.current(target.page, target.corner);
        });
      }
    });
    let touchAction: { x: number; y: number; until: number } | null = null;
    const isCompatibilityEvent = (event: MouseEvent) =>
      touchAction !== null &&
      performance.now() < touchAction.until &&
      Math.abs(event.clientX - touchAction.x) <= numberToken("--s3") &&
      Math.abs(event.clientY - touchAction.y) <= numberToken("--s3");
    const clicked = (event: MouseEvent) => {
      if (isCompatibilityEvent(event)) {
        touchAction = null;
        return;
      }
      const button = (event.target as Element).closest<HTMLElement>(
        "[data-turn-page-id]",
      );
      if (button) {
        const target = pageIndex(button.dataset.turnPageId!);
        if (target !== undefined) {
          focusAfterPage.current = true;
          navigateRef.current(target);
        }
        return;
      }
      if (
        (event.target as Element).closest('a,button,[role="region"]') ||
        !window.getSelection()?.isCollapsed
      )
        return;
      const corner = turnZoneAt(
        root,
        event.clientX,
        event.clientY,
        current.current,
        mobile,
      );
      // Desktop corner clicks/drags already belong to the native recognizer.
      if (corner && (mobile || corner.end === "middle"))
        navigateRef.current(
          adjacentPage(
            current.current,
            corner.side === "right" ? 1 : -1,
            mobile,
          ),
          corner.end,
        );
    };
    const pointerStart = (event: MouseEvent) => {
      if (isCompatibilityEvent(event)) {
        event.stopPropagation();
        return;
      }
      const corner = cornerAt(
        root,
        event.clientX,
        event.clientY,
        current.current,
        mobile,
      );
      if (
        (event.target as Element).closest('a,button,[role="region"]') ||
        !corner
      )
        event.stopPropagation();
      else {
        clearPreviewTimer();
        if (previewFrame !== undefined) {
          clearPreviewFrame();
          previewCorner = null;
        }
        if (engine.getState() === "fold_corner")
          engine.getRender().finishAnimation();
        event.preventDefault();
        event.stopPropagation();
        mouseActive = true;
        engine.getSettings().flippingTime = durationToken(
          current.current === 0 ||
            (current.current === 1 && corner.side === "left")
            ? "--dur-cover"
            : "--dur-slow",
        );
        engine.startUserTouch(nativePoint(event.clientX, event.clientY));
      }
    };
    const pointerMove = (event: MouseEvent) => {
      if (mouseActive)
        engine.userMove(nativePoint(event.clientX, event.clientY), false);
    };
    const pointerEnd = (event: MouseEvent) => {
      if (!mouseActive) return;
      mouseActive = false;
      engine.userStop(nativePoint(event.clientX, event.clientY));
    };
    let touch: {
      x: number;
      y: number;
      maxX: number;
      maxY: number;
      corner: TurnZone | null;
      end: TurnOrigin;
    } | null = null;
    const touchStart = (event: TouchEvent) => {
      // Keep the engine's delayed touch recognizer out of native scrolling.
      event.stopPropagation();
      touchAction = null;
      touch = null;
      if (event.touches.length !== 1) return;
      if ((event.target as Element).closest('a,button,[role="region"]')) return;
      const point = event.changedTouches[0];
      const rect = root.getBoundingClientRect();
      const zone = turnZoneAt(
        root,
        point.clientX,
        point.clientY,
        current.current,
        mobile,
      );
      touch = {
        x: point.clientX,
        y: point.clientY,
        maxX: 0,
        maxY: 0,
        corner: zone,
        end:
          zone?.end ??
          (point.clientY < rect.top + rect.height / 2 ? "top" : "bottom"),
      };
    };
    const touchMove = (event: TouchEvent) => {
      if (!touch) return;
      if (event.touches.length !== 1) {
        touch = null;
        return;
      }
      const point = event.changedTouches[0];
      touch.maxX = Math.max(touch.maxX, Math.abs(point.clientX - touch.x));
      touch.maxY = Math.max(touch.maxY, Math.abs(point.clientY - touch.y));
    };
    const touchEnd = (event: TouchEvent) => {
      event.stopPropagation();
      const start = touch;
      touch = null;
      if (!start) return;
      const x = event.changedTouches[0].clientX - start.x,
        y = event.changedTouches[0].clientY - start.y;
      let direction = 0;
      const corner = turnZoneAt(
        root,
        event.changedTouches[0].clientX,
        event.changedTouches[0].clientY,
        current.current,
        mobile,
      );
      if (
        Math.abs(x) >= numberToken("--s16") &&
        Math.abs(x) > Math.max(Math.abs(y), start.maxY) * 2
      )
        direction = x < 0 ? 1 : -1;
      else if (
        start.corner &&
        corner?.side === start.corner.side &&
        corner.end === start.corner.end &&
        Math.max(Math.abs(x), Math.abs(y), start.maxX, start.maxY) <=
          numberToken("--s3")
      )
        direction = corner.side === "right" ? 1 : -1;
      if (direction) {
        touchAction = {
          x: event.changedTouches[0].clientX,
          y: event.changedTouches[0].clientY,
          until: performance.now() + durationToken("--dur-slow"),
        };
        navigateRef.current(
          adjacentPage(current.current, direction, mobile),
          start.end,
        );
      }
    };
    const touchCancel = () => {
      touch = null;
    };
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    const settleForResize = () => {
      const physicalWidth =
        numberToken("--material-fore-edge-depth") +
        numberToken("--material-board-overhang") * 2;
      if (!stage.current || stage.current.clientWidth <= physicalWidth) return;
      if (
        window.innerWidth === viewportWidth &&
        window.innerHeight === viewportHeight
      )
        return;
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      if (mouseActive) {
        mouseActive = false;
        engine.userStop({ x: 0, y: 0 }, engine.getState() === "read");
      }
      if (engine.getFlipController().getCalculation())
        engine.getRender().finishAnimation();
      present(current.current === 0 ? 0 : 1, true);
    };
    window.addEventListener("resize", settleForResize);
    root.addEventListener("click", clicked);
    root.addEventListener("mousedown", pointerStart, true);
    window.addEventListener("mousemove", pointerMove);
    window.addEventListener("mouseup", pointerEnd);
    root.addEventListener("touchstart", touchStart, {
      passive: true,
      capture: true,
    });
    root.addEventListener("touchmove", touchMove, {
      passive: true,
      capture: true,
    });
    root.addEventListener("touchend", touchEnd, {
      passive: true,
      capture: true,
    });
    root.addEventListener("touchcancel", touchCancel, true);
    engine.loadFromHTML(copies);
    if (!mobile) {
      window.addEventListener("mousemove", hoverPreview);
      window.addEventListener("blur", dismissPreview);
      root.addEventListener("mouseleave", dismissPreview);
    }
    return () => {
      if (contentsFrame !== undefined) cancelAnimationFrame(contentsFrame);
      root.removeEventListener("pointerover", fillContents, true);
      root.removeEventListener("pointerdown", fillContents, true);
      if (firstTurnFrame.current !== null) {
        cancelAnimationFrame(firstTurnFrame.current);
        firstTurnFrame.current = null;
      }
      if (materializePages.current === fillContents)
        materializePages.current = null;
      clearPreviewFrame();
      clearPreviewTimer();
      if (stagingFrame !== undefined) cancelAnimationFrame(stagingFrame);
      presentation.current?.style.removeProperty("will-change");
      if (presentation.current)
        delete presentation.current.dataset.coverTransition;
      window.removeEventListener("resize", settleForResize);
      window.removeEventListener("mousemove", pointerMove);
      window.removeEventListener("mouseup", pointerEnd);
      window.removeEventListener("mousemove", hoverPreview);
      window.removeEventListener("blur", dismissPreview);
      root.removeEventListener("mouseleave", dismissPreview);
      root.removeEventListener("click", clicked);
      root.removeEventListener("mousedown", pointerStart, true);
      root.removeEventListener("touchstart", touchStart, true);
      root.removeEventListener("touchmove", touchMove, true);
      root.removeEventListener("touchend", touchEnd, true);
      root.removeEventListener("touchcancel", touchCancel, true);
      flip.current = null;
      wanted.current = null;
      pendingTarget.current = null;
      engine.destroy();
      setReady(false);
      setTurning(false);
    };
  }, [dimensions, mobile, plain, setVisible, present, presentationModel]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        readMode ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      const target = event.target as HTMLElement;
      if (
        target.isContentEditable ||
        target.closest(
          'input,textarea,select,[role="region"],[role="slider"],[role="listbox"],[role="combobox"],[role="grid"],[role="tablist"],[role="menu"]',
        )
      )
        return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(
          adjacentPage(
            current.current,
            event.key === "ArrowRight" ? 1 : -1,
            mobile,
          ),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, mobile, readMode]);

  useEffect(() => {
    const next = readMode
      ? logical.current
      : visiblePages(logical.current, mobile)[0];
    current.current = next;
    setPage(next);
    wanted.current = null;
  }, [mobile, plain, readMode]);

  const readingLocation = useCallback((index: number) => {
    logical.current = index;
    current.current = index;
    setLogicalPage(index);
    setPage(index);
  }, []);

  useEffect(() => {
    const remember = (event: FocusEvent) => {
      const face = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-page]",
      );
      lastPageFocus.current = face ? Number(face.dataset.page) : null;
    };
    document.addEventListener("focusin", remember);
    return () => document.removeEventListener("focusin", remember);
  }, []);

  useLayoutEffect(() => {
    if (!ready || lastPageFocus.current === null) return;
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        active !== document.body &&
        active.isConnected &&
        !active.closest('[inert],[aria-hidden="true"]')
      )
        return;
      const root = readMode
        ? readingRoot.current
        : plain
          ? stage.current
          : slot.current;
      root
        ?.querySelector<HTMLElement>(`[data-page="${logical.current}"] h2`)
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, plain, readMode, mobile]);

  useEffect(() => {
    if (!readMode)
      setAnnouncement(
        !turning && ready
          ? `Page ${page + 1} of ${pages.length}. ${pages[page].title}.`
          : "",
      );
  }, [page, turning, ready, readMode]);

  useEffect(() => {
    if (readMode)
      setAnnouncement(
        `Page ${logical.current + 1} of ${pages.length}. ${pages[logical.current].title}.`,
      );
  }, [readMode]);

  const onTouchStart = useRef<{ x: number; y: number } | null>(null);

  return (
    <main className="atlas">
      <a href="#book" className="skip-link">
        Skip to portfolio
      </a>
      <header className="site-header">
        <a className="wordmark" href={github} target="_blank" rel="noreferrer">
          {opening.name}
          <span aria-hidden="true">.</span>
        </a>
        <span className="site-subtitle">{opening.title}</span>
        <nav aria-label="Profile links">
          <a href={github} target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight aria-hidden="true" />
          </a>
          <a href="/adarsh-singh-resume.pdf" download>
            Résumé <ArrowUpRight aria-hidden="true" />
          </a>
        </nav>
      </header>
      <h1 className="sr-only">Adarsh Singh — Engineering Atlas</h1>
      <div className="book-toolbar">
        <nav
          className="chapter-nav book-toolbar__chapters"
          aria-label="Portfolio chapters"
        >
          {chapters.map((chapter) => {
            const target = pageIndex(chapter.id)!;
            return (
              <button
                key={chapter.id}
                type="button"
                aria-current={
                  chapter.id === activeChapter?.id ? "page" : undefined
                }
                onClick={() => navigate(target)}
              >
                {chapter.label}
              </button>
            );
          })}
        </nav>
        <p className="turn-hint sr-only">
          {plain
            ? "A quieter way to read."
            : mobile
              ? "Tap an outer edge or swipe to turn."
              : "Click an outer edge or drag a corner."}
        </p>
        <nav className="pagination" aria-label="Page navigation">
          <PageNavButton
            quiet={plain}
            type="button"
            className="page-nav"
            aria-label="Previous page"
            disabled={previous === page}
            onClick={() =>
              navigate(adjacentPage(current.current, -1, readMode || mobile))
            }
          >
            <ArrowLeft aria-hidden="true" />
          </PageNavButton>
          <span className="page-counter" aria-hidden="true">
            {group
              .map((index) => String(index + 1).padStart(2, "0"))
              .join(" — ")}
            <span className="counter-divider">/</span>
            {String(pages.length).padStart(2, "0")}
          </span>
          <PageNavButton
            quiet={plain}
            type="button"
            className="page-nav"
            aria-label="Next page"
            disabled={next === page}
            onClick={() =>
              navigate(adjacentPage(current.current, 1, readMode || mobile))
            }
          >
            <ArrowRight aria-hidden="true" />
          </PageNavButton>
        </nav>
        <button
          className="reading-toggle"
          type="button"
          aria-pressed={readMode}
          onClick={() => {
            wanted.current = null;
            pendingTarget.current = null;
            setReadMode((v) => !v);
          }}
        >
          <BookOpen aria-hidden="true" />
          {readMode
            ? reduced
              ? "Return to pages"
              : "Return to book"
            : "Reading mode"}
        </button>
      </div>
      <div
        ref={stage}
        className={`book-stage ${readMode ? "book-stage--reading" : ""}`}
      >
        <section
          ref={presentation}
          id="book"
          aria-label="Engineering Atlas portfolio"
          className={`book-shell ${mobile ? "book-shell--single" : ""} ${plain ? "book-shell--plain" : ""} ${readMode ? "book-shell--reading" : ""}`}
          data-current-page={page}
          data-cover={page === 0}
          data-ready={ready}
          data-turning={turning}
          data-mode={readMode ? "reading" : reduced ? "reduced" : "native"}
          data-logical-page={logicalPage}
          style={
            dimensions
              ? ({
                  "--page-width": `${dimensions.width}px`,
                  "--page-height": `${dimensions.height}px`,
                } as React.CSSProperties)
              : undefined
          }
        >
          {readMode ? (
            <ReadingView
              root={readingRoot}
              initialPage={logical.current}
              onLocation={readingLocation}
              onNavigate={readingNavigate}
            />
          ) : (
            <>
              <div className="binding" aria-hidden="true" />
              <div
                className="book-block book-block--right"
                aria-hidden="true"
              />
              {!mobile && (
                <div
                  className="book-block book-block--left"
                  aria-hidden="true"
                />
              )}
              {plain && dimensions ? (
                <div
                  className="plain-spread"
                  onClick={(e) => {
                    const button = (e.target as Element).closest<HTMLElement>(
                      "[data-turn-page-id]",
                    );
                    if (button) {
                      const target = pageIndex(button.dataset.turnPageId!);
                      if (target !== undefined) {
                        focusAfterPage.current = true;
                        navigate(target);
                      }
                      return;
                    }
                    if (
                      (e.target as Element).closest(
                        'a,button,[role="region"]',
                      ) ||
                      !window.getSelection()?.isCollapsed
                    )
                      return;
                    const corner = turnZoneAt(
                      e.currentTarget,
                      e.clientX,
                      e.clientY,
                      current.current,
                      mobile,
                    );
                    if (corner)
                      navigate(
                        adjacentPage(
                          current.current,
                          corner.side === "right" ? 1 : -1,
                          mobile,
                        ),
                        corner.end,
                      );
                  }}
                  onTouchStart={(e) => {
                    if (
                      (e.target as Element).closest(
                        'a,button,[role="region"]',
                      ) ||
                      e.touches.length !== 1
                    )
                      return;
                    onTouchStart.current = {
                      x: e.changedTouches[0].clientX,
                      y: e.changedTouches[0].clientY,
                    };
                  }}
                  onTouchEnd={(e) => {
                    const start = onTouchStart.current;
                    onTouchStart.current = null;
                    if (!start) return;
                    const x = e.changedTouches[0].clientX - start.x;
                    const y = e.changedTouches[0].clientY - start.y;
                    if (
                      Math.abs(x) >= numberToken("--s12") &&
                      Math.abs(x) > Math.abs(y) * 2
                    )
                      navigate(
                        adjacentPage(current.current, x < 0 ? 1 : -1, mobile),
                      );
                  }}
                >
                  {pages.map((definition, i) => {
                    const visible = group.includes(i);
                    return (
                      <CrossfadeFace
                        key={definition.id}
                        column={mobile ? 1 : i === 0 || i % 2 === 0 ? 2 : 1}
                        visible={visible}
                      >
                        <BookPage page={definition} />
                      </CrossfadeFace>
                    );
                  })}
                </div>
              ) : null}
              <div ref={slot} className="library-slot" hidden={plain} />
              {!mobile && <div className="book-gutter" aria-hidden="true" />}
            </>
          )}
        </section>
      </div>
      <div
        ref={source}
        className="page-measure-source"
        aria-hidden="true"
        inert
      >
        {pages.map((definition) => (
          <BookPage key={definition.id} page={definition} />
        ))}
      </div>
      <p className="preview-note">
        Selected applications, employment work and engineering practice · 2026.
      </p>
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </main>
  );
}
