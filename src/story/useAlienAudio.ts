import { useEffect, useRef, useState, type RefObject } from "react";

export function useAlienAudio(scene: RefObject<HTMLElement | null>) {
  const current = useRef<HTMLAudioElement | null>(null);
  const generation = useRef(0);
  const [error, setError] = useState("");
  const stop = () => {
    generation.current++;
    const audio = current.current;
    current.current = null;
    if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); }
  };
  useEffect(() => {
    const hide = () => { if (document.hidden) stop(); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stop(); });
    if (scene.current) observer.observe(scene.current);
    document.addEventListener("visibilitychange", hide);
    document.addEventListener("story:native-play", stop);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", hide); document.removeEventListener("story:native-play", stop); stop(); };
  }, [scene]);
  const play = (name: string) => {
    stop(); setError("");
    document.dispatchEvent(new Event("story:native-play"));
    document.querySelectorAll<HTMLVideoElement>(".observatory video").forEach(video => video.pause());
    const audio = new Audio(`/story/audio/aliens/${name.toLowerCase().replaceAll(" ", "-")}.mp3`);
    current.current = audio;
    audio.preload = "none";
    audio.volume = .65;
    const request = generation.current;
    const failed = () => { if (request === generation.current) setError("Sound couldn’t play. Press the watch to try again."); };
    audio.onerror = failed;
    void audio.play().catch(failed);
  };
  return { play, stop, error, clearError: () => setError("") };
}
