import { useEffect, type RefObject } from "react";

/** Enhance the rendered copies: StPageFlip pages are cloned DOM, not React instances. */
export function usePageScrollHints(
  root: RefObject<HTMLElement | null>,
  reading: boolean,
  ready: boolean,
) {
  useEffect(() => {
    const book = root.current;
    if (!book || reading || !ready) return;
    const ports = new Map<HTMLElement, { surface: HTMLElement; hint: HTMLElement }>();
    let frame: number | undefined;
    let disposed = false;

    const cue = (port: HTMLElement) => {
      const entry = ports.get(port);
      if (!entry) return;
      const more = entry.surface.hasAttribute("data-page-overflow") &&
        port.scrollHeight - port.clientHeight - port.scrollTop > 1;
      if (!more && document.activeElement === entry.hint) port.focus({ preventScroll: true });
      entry.hint.hidden = !more;
    };
    const scan = () => {
      frame = undefined;
      for (const [port] of ports) {
        if (!book.contains(port)) {
          resize.unobserve(port);
          const content = port.querySelector(".page-content");
          if (content) resize.unobserve(content);
          ports.delete(port);
        }
      }
      book.querySelectorAll<HTMLElement>(
        ".library-slot .book-page:not(.page--cover):not(.page--introduction) .page-inner, " +
        ".plain-face .book-page:not(.page--cover):not(.page--introduction) .page-inner",
      ).forEach(port => {
        const surface = port.parentElement!;
        const hint = surface.querySelector<HTMLElement>(".page-scroll-hint");
        if (!hint) return;
        if (!ports.has(port)) {
          ports.set(port, { surface, hint });
          resize.observe(port);
          const content = port.querySelector(".page-content");
          if (content) resize.observe(content);
        }
        // Compare with the full sheet, not the temporarily shorter scrollport.
        // This lets a page regain its full height when its content fits again.
        const visible = port.getClientRects().length > 0 && surface.clientHeight > 0;
        const overflow = visible && port.scrollHeight > surface.clientHeight + 1;
        surface.toggleAttribute("data-page-overflow", overflow);
        if (overflow) {
          port.tabIndex = 0;
          port.setAttribute("role", "group");
          port.setAttribute("aria-label", `${port.closest(".book-page")!.getAttribute("aria-label")} · Scrollable page`);
        } else {
          if (document.activeElement === hint || document.activeElement === port) {
            port.tabIndex = -1;
            port.focus({ preventScroll: true });
          } else port.removeAttribute("tabindex");
          port.removeAttribute("role");
          port.removeAttribute("aria-label");
        }
        cue(port);
      });
    };
    const schedule = () => {
      if (!disposed && frame === undefined) frame = requestAnimationFrame(scan);
    };
    const resize = new ResizeObserver(schedule);
    const mutation = new MutationObserver(schedule);
    mutation.observe(book, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-hidden"] });
    const scroll = (event: Event) => {
      if (event.target instanceof HTMLElement) cue(event.target);
    };
    const click = (event: MouseEvent) => {
      const button = (event.target as Element).closest<HTMLElement>(".page-scroll-hint");
      if (!button || button.hidden) return;
      const port = button.parentElement?.querySelector<HTMLElement>(".page-inner");
      if (!port || ports.get(port)?.hint !== button) return;
      event.preventDefault();
      event.stopPropagation();
      const step = parseFloat(getComputedStyle(port).getPropertyValue("--page-scroll-step"));
      port.scrollBy({ top: step, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      cue(port);
    };
    book.addEventListener("scroll", scroll, true);
    book.addEventListener("click", click, true);
    book.addEventListener("load", schedule, true);
    document.fonts.addEventListener("loadingdone", schedule);
    scan();
    return () => {
      disposed = true;
      if (frame !== undefined) cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
      book.removeEventListener("scroll", scroll, true);
      book.removeEventListener("click", click, true);
      book.removeEventListener("load", schedule, true);
      document.fonts.removeEventListener("loadingdone", schedule);
      ports.forEach(({ surface, hint }, port) => {
        surface.removeAttribute("data-page-overflow");
        hint.hidden = true;
        port.removeAttribute("tabindex");
        port.removeAttribute("role");
        port.removeAttribute("aria-label");
      });
    };
  }, [root, reading, ready]);
}
