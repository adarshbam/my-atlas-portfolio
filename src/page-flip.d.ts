// page-flip 2.0.7 ships source types but omits a types entry in its package.
// This adapter declares only the public API consumed by our React integration.
declare module "page-flip" {
  interface Settings {
    width: number;
    height: number;
    size: "fixed" | "stretch";
    usePortrait: boolean;
    showCover: boolean;
    startPage: number;
    flippingTime: number;
    drawShadow: boolean;
    maxShadowOpacity: number;
    autoSize: boolean;
    mobileScrollSupport: boolean;
    clickEventForward: boolean;
    useMouseEvents: boolean;
    swipeDistance: number;
    showPageCorners: boolean;
    disableFlipByClick: boolean;
  }
  export class PageFlip {
    constructor(element: HTMLElement, settings: Partial<Settings>);
    on(event: "init", callback: () => void): this;
    on(
      event: "flip" | "changeState",
      callback: (event: { data: number | string }) => void,
    ): this;
    loadFromHTML(pages: HTMLElement[]): void;
    getCurrentPageIndex(): number;
    getState(): "read" | "flipping" | "user_fold" | "fold_corner";
    getSettings(): Settings;
    getPage(index: number): {
      getDensity(): "soft" | "hard";
      setDrawingDensity(density: "soft" | "hard"): void;
    };
    getBoundsRect(): {
      left: number;
      top: number;
      width: number;
      height: number;
      pageWidth: number;
    };
    getFlipController(): {
      showCorner(point: { x: number; y: number }): void;
      getCalculation(): {
        getFlippingProgress(): number;
        getDirection(): number;
      } | null;
    };
    getRender(): {
      startAnimation(
        frames: (() => void)[],
        duration: number,
        onEnd: () => void,
      ): void;
      finishAnimation(): void;
    };
    startUserTouch(point: { x: number; y: number }): void;
    userMove(point: { x: number; y: number }, isTouch: boolean): void;
    userStop(point: { x: number; y: number }, isSwipe?: boolean): void;
    flip(page: number, corner?: "top" | "bottom"): void;
    destroy(): void;
  }
}
