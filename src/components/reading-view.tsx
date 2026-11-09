import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { animate } from "motion/mini";
import { BookPage, VaultFigure } from "@/components/book-pages";
import { pages } from "@/data/portfolio";
import { useMediaQuery } from "@/lib/use-media-query";

type ReadingProps = {
  root: RefObject<HTMLDivElement | null>;
  initialPage: number;
  onLocation: (index: number) => void;
  onNavigate: (index: number) => void;
  reduced: boolean;
};

/** The book's semantic content in ordinary document flow, without turn handlers. */
export function ReadingView({
  root,
  initialPage,
  onLocation,
  onNavigate,
  reduced,
}: ReadingProps) {
  const entryPage = useRef(initialPage);
  const entered = useRef(false);
  const wide = useMediaQuery("(min-width: 1280px)") && !reduced;
  const previousWide = useRef(wide);
  const [evidence, setEvidence] = useState("workspace");
  const previousEvidence = useRef(evidence);
  const evidenceRoot = useRef<HTMLElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = evidenceRoot.current;
    if (!element || !wide) return;
    const duration = parseFloat(getComputedStyle(element).getPropertyValue("--dur-base")) / 1000;
    const ease = getComputedStyle(element).getPropertyValue("--ease-out").match(/[\d.]+/g)!.map(Number) as [number, number, number, number];
    const controls = Array.from(element.children, (child) => {
      const node = child as HTMLElement;
      const from = node.style.opacity ? Number(node.style.opacity) : Number(node.dataset.evidence === previousEvidence.current);
      return animate(node, { opacity: [from, Number(node.dataset.evidence === evidence)] }, { duration, ease });
    });
    previousEvidence.current = evidence;
    const cancel = () => {
      controls.forEach((control) => { try { control.stop(); } catch { /* Removed during responsive rebuild. */ } });
    };
    const stop = () => {
      cancel();
      Array.from(element.children).forEach(child => (child as HTMLElement).style.removeProperty("opacity"));
    };
    document.addEventListener("visibilitychange", stop);
    return () => { cancel(); document.removeEventListener("visibilitychange", stop); };
  }, [evidence, wide]);
  useEffect(() => {
    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      const available = document.documentElement.scrollHeight - innerHeight;
      if (progress.current) progress.current.style.transform = `scaleX(${available > 0 ? Math.min(1, Math.max(0, scrollY / available)) : 1})`;
    };
    const schedule = () => { if (frame === undefined) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => { window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); if (frame !== undefined) cancelAnimationFrame(frame); };
  }, []);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const toolbar = document.querySelector<HTMLElement>(".book-toolbar");
    const measureToolbar = () =>
      element.style.setProperty(
        "--reading-scroll-offset",
        `${toolbar?.offsetHeight ?? 0}px`,
      );
    measureToolbar();
    const resize = new ResizeObserver(measureToolbar);
    if (toolbar) resize.observe(toolbar);
    const sections = Array.from(
      element.querySelectorAll<HTMLElement>("[data-reading-page]"),
    );
    if (!entered.current || previousWide.current !== wide) {
      const restorePage = entered.current ? initialPage : entryPage.current;
      sections.find(section => Number(section.dataset.readingPage) === restorePage)?.scrollIntoView({ block: "start", behavior: "auto" });
      entered.current = true;
      previousWide.current = wide;
    }
    let frame: number | undefined;
    let disposed = false;
    const observer = new IntersectionObserver(
      () => {
        if (disposed || frame !== undefined) return;
        frame = requestAnimationFrame(() => {
          frame = undefined;
          if (disposed) return;
          const line =
            (toolbar?.getBoundingClientRect().bottom ?? 0) +
            parseFloat(
              getComputedStyle(document.documentElement).getPropertyValue(
                "--s4",
              ),
            );
          const atEnd =
            Math.ceil(scrollY + innerHeight) >=
            document.documentElement.scrollHeight - 1;
          const current = atEnd
            ? sections.at(-1)
            : sections
                .filter(
                  (section) => section.getBoundingClientRect().top <= line + 1,
                )
                .at(-1);
          if (current) {
            const pageNum = Number(current.dataset.readingPage);
            onLocation(pageNum);
            if (current.id === "reading-vault") setEvidence("workspace");
            if (current.id === "reading-vault-contributions") setEvidence("owner");
          }
        });
      },
      { rootMargin: "0px 0px -66% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => {
      disposed = true;
      observer.disconnect();
      resize.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
    // Entry position is consumed once. Ordinary scrolling updates the location
    // without scrolling the reader again or replacing their keyboard focus.
  }, [root, onLocation, wide]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    // Native button clicks include Enter/Space activation; the container itself
    // is not interactive and never adds a second keyboard stop.
    const clicked = (event: MouseEvent) => {
      const action = (event.target as Element).closest<HTMLElement>(
        "[data-turn-page-id]",
      );
      if (!action) return;
      const index = pages.findIndex(
        (page) => page.id === action.dataset.turnPageId,
      );
      if (index >= 0) onNavigate(index);
    };
    element.addEventListener("click", clicked);
    return () => element.removeEventListener("click", clicked);
  }, [root, onNavigate]);

  const section = (page: (typeof pages)[number], index: number) => (
        <section
          key={page.id}
          id={`reading-${page.id}`}
          data-reading-page={index}
          aria-label={page.title}
        >
          <BookPage page={page} />
        </section>
  );
  return (
    <div ref={root} className={`reading-document ${wide ? "reading-document--evidence" : ""}`}>
      <div className="reading-progress" aria-hidden="true"><div ref={progress} /></div>
      {pages.map((page, index) => {
        if (wide && page.id === "vault-contributions") return null;
        if (wide && page.id === "vault") {
          return (
            <div className="reading-vault-group" key="vault-evidence">
              <div className="reading-vault-narrative">{section(page, index)}{section(pages[index + 1], index + 1)}</div>
              <aside ref={evidenceRoot} className="reading-evidence" aria-label="Vault evidence">
                {(["workspace", "owner"] as const).map((image) => (
                  <div key={image} data-evidence={image} aria-hidden={evidence !== image} inert={evidence !== image}><VaultFigure image={image} />{image === "workspace" && <VaultFigure image="accounts" />}</div>
                ))}
              </aside>
            </div>
          );
        }

        return section(page, index);
      })}
    </div>
  );
}
