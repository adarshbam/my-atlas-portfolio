import { useEffect, useSyncExternalStore } from "react";
import { soundEngine } from "./sound-engine";
export function useSound(reduced: boolean) {
  const enabled = useSyncExternalStore(
    soundEngine.subscribe,
    soundEngine.getSnapshot,
    () => false,
  );
  useEffect(() => {
    soundEngine.setReduced(reduced);
  }, [reduced]);
  useEffect(() => {
    const unlock = () => {
      if (!soundEngine.getMuted()) void soundEngine.prepare();
    };
    const visibility = () => {
      if (document.hidden) soundEngine.hide();
    };
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      document.removeEventListener("visibilitychange", visibility);
      soundEngine.hide();
    };
  }, []);
  return { muted: !enabled, toggle: soundEngine.toggle };
}
