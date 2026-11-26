import type { PortfolioVideo, PortfolioVideoId } from "../src/data/portfolio-videos";
export function attachInspector(root: Document, videos?: Partial<Record<PortfolioVideoId, PortfolioVideo | null>>, attachVault?: (video: HTMLVideoElement, id: string) => () => void): () => void;
