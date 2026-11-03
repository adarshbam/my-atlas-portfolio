import { useLayoutEffect, type RefObject } from "react";

/** Measure in sheet-local coordinates, never the engine's transformed viewport. */
function alignRoute(route: HTMLElement) {
  const svg = route.querySelector<SVGSVGElement>("svg");
  const path = svg?.querySelector("path");
  if (!svg || !path || !route.clientWidth) return;
  const nodes = [...route.querySelectorAll<HTMLElement>(".atlas-node")];
  const points = nodes.map((node) => {
    let x = node.offsetWidth / 2;
    let y = node.offsetHeight / 2;
    let element: HTMLElement | null = node;
    while (element && element !== route) {
      x += element.offsetLeft;
      y += element.offsetTop;
      element = element.offsetParent as HTMLElement | null;
    }
    return { x, y };
  });
  if (points.length !== 4) return;
  svg.setAttribute("viewBox", `0 0 ${route.clientWidth} ${route.clientHeight}`);
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    // Vertical tangents keep the line beside, rather than through, each label.
    const middle = (a.y + b.y) / 2;
    d += ` C${a.x} ${middle} ${b.x} ${middle} ${b.x} ${b.y}`;
  }
  if (path.getAttribute("d") !== d) path.setAttribute("d", d);
}

/** Native pages are DOM clones: observe each copy without rebuilding the engine. */
export function useAtlasRouteLayout(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const routes = new Set<HTMLElement>();
    const resize = new ResizeObserver(() => routes.forEach(alignRoute));
    const sync = () => {
      for (const route of routes) {
        if (!element.contains(route)) {
          resize.unobserve(route);
          route.querySelectorAll(".atlas-stop").forEach((stop) => resize.unobserve(stop));
          routes.delete(route);
        }
      }
      element.querySelectorAll<HTMLElement>(".atlas-route").forEach((route) => {
        if (!routes.has(route)) {
          routes.add(route);
          resize.observe(route);
          route.querySelectorAll(".atlas-stop").forEach((stop) => resize.observe(stop));
        }
        alignRoute(route);
      });
    };
    const mutations = new MutationObserver(sync);
    mutations.observe(element, { childList: true, subtree: true });
    sync();
    let disposed = false;
    void document.fonts.ready.then(() => { if (!disposed) sync(); });
    return () => {
      disposed = true;
      mutations.disconnect();
      resize.disconnect();
    };
  }, [root]);
}
