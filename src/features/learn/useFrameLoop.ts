import { useEffect, useState } from "react";

/** Loop a recording on its own clock, for the small reference beside the camera. */
export function useFrameLoop(frames: readonly Float32Array[] | null, playing: boolean, speed: number, fps: number): Float32Array | null {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
    if (!frames?.length || !playing) return;
    let raf = 0;
    let started = performance.now();
    const pause = 500;
    const tick = (now: number) => {
      const duration = ((frames.length / fps) * 1000) / speed;
      const t = now - started;
      if (t > duration + pause) started = now;
      setIndex(Math.min(frames.length - 1, Math.floor((Math.min(t, duration) / duration) * frames.length)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frames, playing, speed, fps]);
  return frames?.[index] ?? null;
}
