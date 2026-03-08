import { useEffect, useRef } from 'react';

export function useAnimationFrame(callback: (deltaTime: number) => void, enabled = true) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback, enabled]);
}

export function useFPSMonitor() {
  const fpsRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useAnimationFrame(() => {
    frameCountRef.current++;
    const currentTime = performance.now();
    const elapsed = currentTime - lastTimeRef.current;

    if (elapsed >= 1000) {
      fpsRef.current = Math.round((frameCountRef.current * 1000) / elapsed);
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }
  });

  return fpsRef.current;
}