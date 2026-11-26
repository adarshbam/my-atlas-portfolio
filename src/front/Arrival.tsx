import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { professionalStory } from "@/data/portfolio";
import "@/trailer/tokens.css";
import "./front.css";

/*
 * The arrival at the book (docs/FRONT-PAGE-TRAILER-2026-11-22.md, scene 7).
 * A short track whose pinned block holds a painted desk and the real book.
 * Scrolling through it pushes the camera in: the book grows from a small object on
 * the desk to its ordinary closed-cover view. The lamp-lit desk stays under it: the book
 * is used where it lies (the user's decision, 23 November 2026). At the end the book itself
 * is not transformed: it is the book exactly as it was before.
 */

const DESK = "/front/desk";

/** The arrival's scroll geometry. `range` is the scroll the arrival takes; 0 when there is none. */
function geometry(node: HTMLElement) {
  const pin = node.firstElementChild as HTMLElement;
  // The block is at least one small-viewport height. On a phone whose bars have slid away
  // the window is taller than that, and the page ends before a block-sized range would.
  const held = Math.max(pin.offsetHeight, innerHeight);
  const top = node.getBoundingClientRect().top + scrollY;
  return { pin, top, range: node.offsetHeight - held };
}

/**
 * Scroll position at which the arrival is complete: the last position at which the
 * pinned block's top is still at the top of the screen. A block taller than the screen
 * (a short window) scrolls on from there to show its lower part.
 */
export function arrivalEnd() {
  const node = document.getElementById("book-arrival");
  if (!node?.firstElementChild) return 0;
  // Still mode has no pin: the desk block comes first and the book follows it.
  if (node.dataset.mode === "still") {
    const book = node.querySelector<HTMLElement>(".atlas-arrival-book") ?? node;
    return Math.max(0, book.getBoundingClientRect().top + scrollY);
  }
  const { top, range } = geometry(node);
  return Math.max(0, top + range);
}

/** Set while an Arrival is mounted: recomputes the arrival now, not on the next frame. */
let syncArrival: (() => void) | undefined;

/**
 * Brings the arrival up to date with the scroll position now. For code that has just moved
 * the page and must know, before the next frame, whether the reader is at the book.
 */
export function settleArrival() {
  syncArrival?.();
}

/**
 * Takes the reader to the book and keeps them there while the page is still settling,
 * until they touch anything. Two things move the page after the first scroll: layout above
 * (fonts, a phone's viewport), and the browser's own attempt to scroll to `#book` once that
 * element exists, which lands short because the book sits in a pinned block.
 */
export function goToBook() {
  const jump = () => {
    scrollTo({ top: arrivalEnd(), behavior: "instant" });
    // No frame of the small book on the desk between the jump and the next scroll event.
    syncArrival?.();
  };
  // After the first jump it only ever pulls the page down to the book. Past that point the
  // reader (or the book's own code) is scrolling on to the lower part of a tall block.
  const settle = () => {
    if (scrollY < arrivalEnd() - 1) jump();
  };
  jump();
  const observer = new ResizeObserver(settle);
  observer.observe(document.documentElement);
  const arrival = document.getElementById("book-arrival");
  if (arrival) observer.observe(arrival);
  addEventListener("scroll", settle, { passive: true });
  // Back or Forward within those seconds is the reader moving on: it is not pulled down again.
  const events = ["wheel", "touchstart", "pointerdown", "keydown", "popstate"] as const;
  const stop = () => {
    observer.disconnect();
    removeEventListener("scroll", settle);
    clearTimeout(timer);
    for (const name of events) removeEventListener(name, stop);
  };
  const timer = setTimeout(stop, 4000);
  for (const name of events) addEventListener(name, stop, { passive: true, once: true });
}

/**
 * Puts keyboard focus on the atlas, so the next Tab starts inside the book and not back in
 * the run. The book's code may still be loading: wait for it, however long it takes, unless
 * the reader does something else first.
 */
export function focusAtlas() {
  const arrival = document.getElementById("book-arrival");
  if (!arrival) return;
  const attempt = () => {
    const atlas = arrival.querySelector<HTMLElement>(".atlas");
    atlas?.focus({ preventScroll: true });
    return atlas !== null;
  };
  if (attempt()) return;
  const events = ["pointerdown", "keydown"] as const;
  const stop = () => {
    observer.disconnect();
    for (const name of events) removeEventListener(name, stop);
  };
  const observer = new MutationObserver(() => {
    if (attempt()) stop();
  });
  observer.observe(arrival, { childList: true, subtree: true });
  for (const name of events) addEventListener(name, stop, { passive: true, once: true });
}

export function Arrival({
  reduced,
  mounted,
  onNear,
  children,
}: {
  reduced: boolean;
  /** Whether the book has been asked for; until then a block of the same height holds its place. */
  mounted: boolean;
  /** Called once when the reader comes within a screen and a half of the book. */
  onNear: () => void;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [painted, setPainted] = useState(true);

  // A change of the reduced-motion preference re-lays the whole page. A reader who was
  // at the book stays at the book, in the same frame as the new layout.
  const wasReduced = useRef(reduced);
  const atBook = useRef(false);
  useLayoutEffect(() => {
    if (wasReduced.current === reduced) return;
    wasReduced.current = reduced;
    if (atBook.current) goToBook();
  }, [reduced]);
  useEffect(() => {
    const note = () => {
      const node = root.current;
      atBook.current = !!node && node.getBoundingClientRect().top < innerHeight / 2;
    };
    note();
    addEventListener("scroll", note, { passive: true });
    return () => removeEventListener("scroll", note);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node || mounted) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onNear();
      },
      { rootMargin: "150% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [mounted, onNear]);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (reduced) {
      node.style.removeProperty("--arrive");
      node.dataset.arrived = "true";
      return;
    }
    const pin = node.firstElementChild as HTMLElement;
    let frame: number | undefined;
    const apply = () => {
      // The track is the pinned block's own height plus the scroll the arrival takes,
      // so a tall block (a short window) gets the same arrival as any other.
      node.style.setProperty("--arrival-pin", `${pin.offsetHeight}px`);
      const { top, range } = geometry(node);
      const progress = range <= 0 ? 1 : Math.min(1, Math.max(0, (scrollY - top) / range));
      node.style.setProperty("--arrive", progress.toFixed(4));
      const arrived = String(progress >= 0.999);
      if (node.dataset.arrived !== arrived) node.dataset.arrived = arrived;
      // The contact lines leave the tab order once they have faded out.
      const copy = String(progress < 0.66);
      if (node.dataset.copy !== copy) node.dataset.copy = copy;
    };
    const schedule = () => {
      if (frame === undefined)
        frame = requestAnimationFrame(() => {
          frame = undefined;
          apply();
        });
    };
    // A window resize or a turned phone changes where the arrival ends. A reader who had
    // arrived stays arrived. A phone's bars sliding in and out change neither the width nor
    // the block's height, so they never pull the page.
    let width = innerWidth;
    let pinHeight = pin.offsetHeight;
    const relayout = () => {
      const was = node.dataset.arrived === "true";
      apply();
      const changed = innerWidth !== width || pin.offsetHeight !== pinHeight;
      width = innerWidth;
      pinHeight = pin.offsetHeight;
      if (was && changed && node.dataset.arrived !== "true" && scrollY < arrivalEnd() - 1) {
        scrollTo({ top: arrivalEnd(), behavior: "instant" });
        apply();
      }
    };
    apply();
    syncArrival = apply;
    const resized = new ResizeObserver(relayout);
    resized.observe(pin);
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", relayout);
    return () => {
      if (syncArrival === apply) syncArrival = undefined;
      resized.disconnect();
      removeEventListener("scroll", schedule);
      removeEventListener("resize", relayout);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  // Keyboard: focusing anything in the book before the arrival is over finishes the arrival.
  const bookFocused = (event: FocusEvent<HTMLDivElement>) => {
    if (root.current?.dataset.arrived === "true" || !(event.target as HTMLElement).matches(":focus-visible")) return;
    goToBook();
  };
  // Keyboard: the desk starts under the run's last scene. Focusing one of its links brings
  // the page to where the run has lifted off and the lines are still fully showing.
  const copyFocused = (event: FocusEvent<HTMLDivElement>) => {
    const node = root.current;
    if (!node || reduced || !(event.target as HTMLElement).matches(":focus-visible")) return;
    const { top, range } = geometry(node);
    const shown = top + range * 0.45;
    if (range > 0 && scrollY < shown - 1) {
      scrollTo({ top: shown, behavior: "instant" });
      syncArrival?.();
    }
  };

  return (
    <div ref={root} className="atlas-arrival" id="book-arrival" data-mode={reduced ? "still" : "scroll"} data-arrived={reduced ? "true" : "false"} data-copy="true">
      <div className="atlas-arrival-pin">
        {/* One labelled region for the whole desk: its painting, caption and contact lines. */}
        <section className="atlas-arrival-night" aria-label="Contact">
          {/* Fetched with the book, as the reader nears the desk; never at the top of the page. */}
          {painted && (mounted || reduced) && (
            <figure className="atlas-arrival-desk">
              <picture>
                <source media="(max-width: 800px)" srcSet={`${DESK}-tall-600.webp 600w, ${DESK}-tall-1200.webp 1200w`} sizes="100vw" />
                <img
                  src={`${DESK}-1600.webp`}
                  srcSet={`${DESK}-800.webp 800w, ${DESK}-1600.webp 1600w, ${DESK}-2400.webp 2400w`}
                  sizes="100vw"
                  alt="Illustration: a writing desk seen from above, lit by one lamp"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onError={() => setPainted(false)}
                />
              </picture>
              <figcaption>Illustration</figcaption>
            </figure>
          )}
          {/* The house lights: over the painted desk, under the lines and the book; the desk
              goes darker while the book is open (front.css). */}
          <div className="atlas-arrival-dim" aria-hidden="true" />
          <div className="atlas-arrival-copy" onFocus={copyFocused}>
            <h2>The whole atlas</h2>
            <p>Every project in full, with the diagrams, decisions and references.</p>
            {/* Two rows on purpose: what a recruiter came for, then where else to look. */}
            <div className="obs-trailer-links atlas-arrival-first">
              <a href={`mailto:${professionalStory.email}`}>Email me</a>
              <a href="/adarsh-singh-resume.pdf">Résumé (PDF)</a>
            </div>
            <div className="obs-trailer-links atlas-arrival-more">
              <a href={professionalStory.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <a href={professionalStory.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href="/story" data-open-story>
                My story
              </a>
            </div>
          </div>
        </section>
        <div className="atlas-arrival-book" onFocus={bookFocused}>
          {mounted ? children : <div className="atlas-arrival-hold" />}
        </div>
      </div>
    </div>
  );
}
