import { useEffect, useRef, type RefObject } from "react";
import { animate } from "motion/mini";
import { soundEngine } from "./audio/sound-engine";
export function usePageMotion(
  root: RefObject<HTMLElement | null>,
  reduced: boolean,
  turning: boolean,
  ready: boolean,
  page: number,
) {
  const lastPage = useRef(0);
  useEffect(() => {
    const element = root.current;
    if (!element || !ready || turning) return;
    const fromCover = lastPage.current === 0 && page === 1;
    lastPage.current = page;
    const seen = new WeakSet<Element>(),
      controls = new Map<Element, ReturnType<typeof animate>>();
    const style = getComputedStyle(element),
      duration =
        parseFloat(
          style.getPropertyValue(
            fromCover ? "--dur-fast" : "--motion-route-duration",
          ),
        ) / 1000;
    const stagger = fromCover
      ? 0
      : parseFloat(style.getPropertyValue("--motion-route-stagger")) / 1000;
    const ease = style
      .getPropertyValue("--ease-out")
      .match(/[\d.]+/g)!
      .map(Number) as [number, number, number, number];
    let generation = 0;
    const clean = (node: Element) => {
      try {
        controls.get(node)?.stop();
      } catch {
        /* A native page can detach during cleanup. */
      }
      controls.delete(node);
      (node as HTMLElement).style.removeProperty("stroke-dasharray");
      (node as HTMLElement).style.removeProperty("stroke-dashoffset");
      (node as HTMLElement).style.removeProperty("transform");
    };
    const draw = (section: Element, force = false) => {
      if (!force && seen.has(section)) return [];
      seen.add(section);
      if (reduced || document.hidden) return [];
      const pending: Promise<unknown>[] = [];
      section
        .querySelectorAll<SVGPathElement>(".atlas-route path,.diagram-route")
        .forEach((path, index) => {
          clean(path);
          if (!path.getClientRects().length) return;
          const length = path.hasAttribute("pathLength")
            ? 1
            : path.getTotalLength();
          path.style.strokeDasharray = String(length);
          const control = animate(
            path,
            { strokeDashoffset: [length, 0] },
            { duration, delay: Math.min(index, 6) * stagger, ease },
          );
          controls.set(path, control);
          pending.push(
            Promise.resolve(control).then(() => {
              if (controls.get(path) === control) clean(path);
            }),
          );
        });
      return pending;
    };
    const find = () =>
      element
        .querySelectorAll('.library-slot .book-page[aria-hidden="false"]')
        .forEach((section) => draw(section));
    const mutations = new MutationObserver(find);
    mutations.observe(element, { childList: true, subtree: true });
    find();
    const replay = (event: MouseEvent) => {
      const button = (event.target as Element).closest("[data-trace-flow]");
      if (!button) return;
      const section = button.closest(".book-page");
      if (!section) return;
      const current = ++generation;
      Promise.all(draw(section, true)).then(() => {
        if (current === generation && !document.hidden) soundEngine.accent();
      });
    };
    const settle = () => {
      ++generation;
      controls.forEach((_, node) => clean(node));
    };
    element.addEventListener("click", replay);
    document.addEventListener("visibilitychange", settle);
    return () => {
      mutations.disconnect();
      element.removeEventListener("click", replay);
      document.removeEventListener("visibilitychange", settle);
      settle();
    };
  }, [root, reduced, turning, ready, page]);
}
