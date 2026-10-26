import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { BookPage } from "@/components/book-pages";
import { pages } from "@/data/portfolio";

type ReadingProps = {
  root: RefObject<HTMLDivElement | null>;
  initialPage: number;
  onLocation: (index: number) => void;
  onNavigate: (index: number) => void;
};

/** The book's semantic content in ordinary document flow, without turn handlers. */
export function ReadingView({
  root,
  initialPage,
  onLocation,
  onNavigate,
}: ReadingProps) {
  const entryPage = useRef(initialPage);
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
    sections[entryPage.current]?.scrollIntoView({
      block: "start",
      behavior: "auto",
    });
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
          if (current) onLocation(Number(current.dataset.readingPage));
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
  }, [root, onLocation]);

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

  return (
    <div ref={root} className="reading-document">
      {pages.map((page, index) => (
        <section
          key={page.id}
          id={`reading-${page.id}`}
          data-reading-page={index}
          aria-label={page.title}
        >
          <BookPage page={page} />
        </section>
      ))}
    </div>
  );
}
