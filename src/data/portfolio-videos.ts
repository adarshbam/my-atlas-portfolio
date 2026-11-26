import recordings from "./portfolio-videos.json";

export type PortfolioVideoId = "introduction" | "vault" | "story";
export type PortfolioVideo = {
  title: string;
  src: string;
  poster: string;
  captions: string;
  durationSeconds: number;
  vaultId?: string;
};

// Null means not recorded/published. Never render a placeholder watch action.
export const portfolioVideos: Record<PortfolioVideoId, PortfolioVideo | null> = recordings;

export function videoDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
