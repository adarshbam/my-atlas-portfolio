import { portfolioVideos, videoDuration, type PortfolioVideoId } from "@/data/portfolio-videos";

export const videoLabels: Record<PortfolioVideoId, string> = {
  introduction: "Watch my introduction",
  vault: "Watch one problem I solved",
  story: "Watch how I got here",
};

export function VideoLink({ id }: { id: PortfolioVideoId }) {
  const recording = portfolioVideos[id];
  if (!recording) return null;
  return (
    <button type="button" className="text-link portfolio-video-link" data-portfolio-video={id} aria-haspopup="dialog">
      {videoLabels[id]} · {videoDuration(recording.durationSeconds)}
    </button>
  );
}
