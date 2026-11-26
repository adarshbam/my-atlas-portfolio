import { startTransition, useEffect, type RefObject } from "react";

/*
 * Scroll engine shared by the story trailer and the atlas run.
 * One tall track holds one sticky stage. Native scroll position is the playhead:
 * the scroll callback writes each scene's 0..1 values as CSS custom properties on
 * that scene, and CSS derives transform, opacity, clip-path and stroke-dashoffset
 * from them. Nothing intercepts wheel or touch input.
 */

export type Segment = readonly [name: string, start: number, end: number];
export type SceneDef = {
  id: string;
  label: string;
  /** Scroll length in viewport heights. */
  units: number;
  /** Length the segment and beat fractions are measured against; defaults to `units`. */
  span?: number;
  segments: readonly Segment[];
  /** Fractions at which the caption line advances. */
  beats: readonly number[];
  /** Where a tick or hash link lands inside the scene. */
  rest: number;
};
export type PlacedScene = SceneDef & { index: number; start: number };
export type SceneLayout = { scenes: readonly PlacedScene[]; total: number; /** How far each scene starts before the one before it ends. */ overlap: number };

/** Viewport heights during which one scene leaves while the next arrives. */
export const OVERLAP = 0.2;

/** Scene start positions, with each scene beginning OVERLAP before the previous one ends. */
export function layoutScenes(scenes: readonly SceneDef[], overlap = OVERLAP): SceneLayout {
  let cursor = 0;
  const placed = scenes.map((scene, index) => {
    const start = index === 0 ? 0 : cursor - overlap;
    cursor = start + scene.units;
    return { ...scene, index, start };
  });
  return { scenes: placed, total: cursor, overlap };
}

export const segment = (value: number, start: number, end: number) => Math.min(1, Math.max(0, (value - start) / (end - start)));

export const put = (node: HTMLElement, name: string, value: number) => node.style.setProperty(name, value.toFixed(4));
export const mark = (node: HTMLElement, key: string, value: string) => {
  if (node.dataset[key] !== value) node.dataset[key] = value;
};

export type SceneFrame = {
  /** Position along the track, in viewport heights. */
  position: number;
  /** 0..1 through the whole track. */
  progress: number;
  stage: HTMLElement;
  /** Scene elements in layout order; null when a scene is not rendered. */
  nodes: readonly (HTMLElement | null)[];
};

/**
 * Drives every `[data-scene]` inside `stage` from the scroll position of `track`.
 * Per scene: `--t --in --out`, each segment variable, `data-state` and `data-beat`.
 * On the stage: `--travel` and `data-current`. On `[data-tick]` links: `aria-current`.
 */
export function useSceneScroll({
  track,
  stage,
  layout,
  reduced,
  shape,
  onFrame,
  onReset,
}: {
  track: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLElement | null>;
  layout: SceneLayout;
  reduced: boolean;
  /** Reshapes one segment value before it is written (the story's accelerating fall). */
  shape?: (name: string, value: number) => number;
  /** Extra per-frame work for one run, after the shared values are written. */
  onFrame?: (frame: SceneFrame) => void;
  /** Undo whatever `onFrame` left behind, when the effect is torn down. */
  onReset?: (frame: Pick<SceneFrame, "stage" | "nodes">) => void;
}) {
  useEffect(() => {
    const stageNode = stage.current;
    const trackNode = track.current;
    if (reduced || !stageNode || !trackNode) return;
    const nodes = layout.scenes.map((scene) => stageNode.querySelector<HTMLElement>(`[data-scene="${scene.id}"]`));
    const ticks = Array.from(stageNode.querySelectorAll<HTMLAnchorElement>("[data-tick]"));
    let cancelled = false;
    let stop: VoidFunction | undefined;
    const apply = (progress: number) => {
      const position = progress * layout.total;
      let current = layout.scenes[0].id;
      put(stageNode, "--travel", progress);
      for (const scene of layout.scenes) {
        const node = nodes[scene.index];
        if (!node) continue;
        const local = (position - scene.start) / scene.units;
        const edge = layout.overlap / scene.units;
        if (local >= edge / 2) current = scene.id;
        const state = local < -0.01 ? "before" : local > 1.01 ? "after" : "active";
        mark(node, "state", state);
        if (state !== "active") continue;
        const measured = (position - scene.start) / (scene.span ?? scene.units);
        put(node, "--t", segment(local, 0, 1));
        put(node, "--in", scene.index === 0 ? 1 : segment(local, 0, edge));
        put(node, "--out", scene.index === layout.scenes.length - 1 ? 0 : segment(local, 1 - edge, 1));
        for (const [name, start, end] of scene.segments) {
          const value = segment(measured, start, end);
          put(node, name, shape ? shape(name, value) : value);
        }
        mark(node, "beat", String(scene.beats.filter((threshold) => measured >= threshold).length));
      }
      onFrame?.({ position, progress, stage: stageNode, nodes });
      if (stageNode.dataset.current !== current) {
        stageNode.dataset.current = current;
        for (const tick of ticks) {
          if (tick.dataset.tick === current) tick.setAttribute("aria-current", "true");
          else tick.removeAttribute("aria-current");
        }
      }
    };
    // Same progress Motion reports for offset ["start start", "end end"], measured by hand
    // so the first frame (or a deep link) is right before Motion has loaded.
    const measure = () => {
      const { top, height } = trackNode.getBoundingClientRect();
      const range = height - innerHeight;
      return range > 0 ? Math.min(1, Math.max(0, -top / range)) : 0;
    };
    let frame: number | undefined;
    const manual = () => {
      if (frame === undefined)
        frame = requestAnimationFrame(() => {
          frame = undefined;
          apply(measure());
        });
    };
    apply(measure());
    addEventListener("scroll", manual, { passive: true });
    // Motion is fetched after the opening paint, so it never delays the first image.
    let started = false;
    const start = () => {
      if (started || cancelled) return;
      started = true;
      void import("motion").then(({ scroll }) => {
        if (cancelled) return;
        removeEventListener("scroll", manual);
        stop = scroll((progress: number) => apply(progress), { target: trackNode, offset: ["start start", "end end"] });
      });
    };
    addEventListener("scroll", start, { once: true, passive: true });
    const idle = "requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 1200);
    return () => {
      cancelled = true;
      removeEventListener("scroll", manual);
      removeEventListener("scroll", start);
      if ("cancelIdleCallback" in window) cancelIdleCallback(idle as number);
      else clearTimeout(idle as ReturnType<typeof setTimeout>);
      if (frame !== undefined) cancelAnimationFrame(frame);
      stop?.();
      stageNode.style.cssText = "";
      delete stageNode.dataset.current;
      for (const tick of ticks) tick.removeAttribute("aria-current");
      nodes.forEach((node, index) => {
        if (!node) return;
        node.style.cssText = "";
        node.dataset.state = index === 0 ? "active" : "before";
        node.dataset.beat = "0";
      });
      onReset?.({ stage: stageNode, nodes });
    };
    // `shape`, `onFrame` and `onReset` are expected to be stable module-level functions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, layout]);
}

/** Attributes every scene element carries; the engine and the tests read them. */
export function sceneAttributes(layout: SceneLayout, id: string) {
  const scene = layout.scenes.find((item) => item.id === id)!;
  return {
    "data-scene": id,
    "data-state": scene.index === 0 ? "active" : "before",
    "data-beat": "0",
    "data-start": scene.start,
    "data-units": scene.units,
    "data-span": scene.span ?? scene.units,
  } as const;
}

/**
 * Mounts late content after the first paint, so it never shares the network with the opening
 * image: two frames after mounting, or, where the page names its opening image, a short beat
 * after that image has been decoded and painted. It commits as a transition: on the story page
 * that puts the later scenes' photographs in the same pass as the chapters.
 */
export function useAfterFirstPaint(set: (ready: true) => void, opening?: () => HTMLImageElement | null) {
  useEffect(() => {
    let first = 0;
    let second = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const frames = (then: () => void) => {
      first = requestAnimationFrame(() => {
        second = requestAnimationFrame(then);
      });
    };
    const commit = () => startTransition(() => set(true));
    const image = opening?.();
    if (!image) frames(commit);
    else {
      // The opening image is the page's largest paint. What mounts late must start loading
      // clearly after that paint, not in the same frame: wait for the image to be decoded,
      // then for the frame that paints it, then a short beat more (AFTER_OPENING).
      void image
        .decode()
        .catch(() => undefined)
        .then(() => {
          if (!cancelled) frames(() => (timer = setTimeout(commit, AFTER_OPENING)));
        });
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
/** How long after the opening image has painted the later images may begin to load. */
const AFTER_OPENING = 160;
