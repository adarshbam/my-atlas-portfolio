import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

type Dimensions = { width: number; height: number };
type Presentation = {
  scale: number;
  shift: number;
  progress: number;
  closedScale: number;
  openHeight: number;
  closedHeight: number;
  depth: number;
  bottomDepth: number;
  boardOverhang: number;
  expanded: boolean;
};

export function useBookPresentation(
  stage: RefObject<HTMLDivElement | null>,
  book: RefObject<HTMLElement | null>,
  dimensions: Dimensions | null,
  mobile: boolean,
  page: number,
  enabled = true,
) {
  const model = useRef<Presentation>({
    scale: 1,
    shift: 0,
    progress: 0,
    closedScale: 1,
    openHeight: 0,
    closedHeight: 0,
    depth: 0,
    bottomDepth: 0,
    boardOverhang: 0,
    expanded: false,
  });
  const pageRef = useRef(page);
  pageRef.current = page;
  const apply = useCallback(
    (value: number, settled = false) => {
      if (!enabled || !book.current || !stage.current || !dimensions) return;
      const state = model.current;
      const progress = Math.max(0, Math.min(1, value));
      state.progress = progress;
      state.scale = state.closedScale + (1 - state.closedScale) * progress;
      const closedOffset = ((mobile ? 0 : dimensions.width) + state.depth) / 2;
      const openOffset = mobile ? state.depth / 2 : 0;
      state.shift =
        -(closedOffset * (1 - progress) + openOffset * progress) * state.scale;
      book.current.style.transform = `translateX(calc(-50% + ${state.shift}px)) scale(${state.scale})`;
      book.current.style.setProperty("--book-openness", String(progress));
      book.current.dataset.openness = String(progress);
      book.current.dataset.presentationScale = String(state.scale);
      if (progress > 0 && (!state.expanded || settled)) {
        stage.current.style.height = `${state.openHeight}px`;
        state.expanded = true;
      } else if (settled && progress === 0) {
        stage.current.style.height = `${state.closedHeight}px`;
        state.expanded = false;
      }
    },
    [book, stage, dimensions, mobile, enabled],
  );

  useLayoutEffect(() => {
    if (!enabled) {
      book.current?.style.removeProperty("transform");
      stage.current?.style.removeProperty("height");
      return;
    }
    if (!dimensions || !stage.current || !book.current) return;
    let viewportWidth = -1;
    let viewportHeight = -1;
    let stageWidth = -1;
    const measure = () => {
      const styles = getComputedStyle(document.documentElement);
      const number = (name: string) =>
        parseFloat(styles.getPropertyValue(name));
      const currentStageWidth = stage.current!.clientWidth;
      const depth = number("--material-fore-edge-depth");
      const boardOverhang = number("--material-board-overhang");
      // Hidden/transiently collapsed surfaces keep their last usable model.
      // In particular, do not write scale(0) or an infinite type compensation.
      if (
        !Number.isFinite(currentStageWidth) ||
        currentStageWidth <= depth + boardOverhang * 2 ||
        !Number.isFinite(dimensions.width) ||
        dimensions.width <= 0 ||
        !Number.isFinite(dimensions.height) ||
        dimensions.height <= 0
      )
        return;
      if (
        viewportWidth === window.innerWidth &&
        viewportHeight === window.innerHeight &&
        stageWidth === currentStageWidth
      )
        return;
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      stageWidth = currentStageWidth;
      const gutter = number("--s4");
      const top = stage.current!.getBoundingClientRect().top + window.scrollY;
      const available = Math.max(
        number("--s32") * 3,
        Math.min(
          number("--cover-max-height"),
          window.innerHeight - top - gutter * 2,
        ),
      );
      const state = model.current;
      state.depth = depth;
      state.bottomDepth = number("--material-bottom-depth");
      state.boardOverhang = boardOverhang;
      const widthFit = Math.min(
        1,
        stage.current!.clientWidth /
          (dimensions.width + state.depth + state.boardOverhang * 2),
      );
      // Short phone windows scroll instead of squeezing readable cover type.
      const readableScale = mobile
        ? Math.min(widthFit, number("--cover-regular-width") / dimensions.width)
        : 0;
      state.closedScale = Math.max(
        readableScale,
        Math.min(
          widthFit,
          available /
            (dimensions.height + state.bottomDepth + state.boardOverhang),
        ),
      );
      const visibleWidth = Math.round(dimensions.width * state.closedScale);
      book.current!.dataset.coverSize =
        visibleWidth < number("--cover-regular-width")
          ? "compact"
          : visibleWidth < number("--cover-large-width")
            ? "regular"
            : "large";
      book.current!.style.setProperty(
        "--cover-visible-width",
        `${visibleWidth}px`,
      );
      state.openHeight =
        dimensions.height +
        state.bottomDepth +
        state.boardOverhang +
        gutter * 2;
      state.closedHeight =
        (dimensions.height + state.bottomDepth + state.boardOverhang) *
          state.closedScale +
        gutter * 2;
      book.current!.style.setProperty(
        "--cover-type-compensation",
        String(1 / state.closedScale),
      );
      apply(pageRef.current === 0 ? 0 : 1, true);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [dimensions, mobile, apply, book, stage, enabled]);

  return { apply, model };
}
