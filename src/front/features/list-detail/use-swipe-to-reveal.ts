import { useCallback, useEffect, useRef } from "react";

const DIRECTION_LOCK_THRESHOLD = 10;
const REVEAL_THRESHOLD = 60;
const REVEAL_WIDTH = 80;
const VELOCITY_THRESHOLD = 0.5;

interface UseSwipeToRevealOptions {
  isRevealed: boolean;
  onReveal: (revealed: boolean) => void;
  disabled?: boolean;
}

export function useSwipeToReveal({
  isRevealed,
  onReveal,
  disabled,
}: UseSwipeToRevealOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const directionRef = useRef<"horizontal" | "vertical" | null>(null);
  const currentXRef = useRef(REVEAL_WIDTH);
  const rafRef = useRef(0);

  const prefersReducedMotion = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const applyTransform = useCallback((x: number, animate: boolean) => {
    const el = actionRef.current;
    if (!el) return;
    el.style.transition =
      animate && !prefersReducedMotion.current
        ? "transform 0.3s ease-out"
        : "none";
    el.style.transform = `translateX(${x}px)`;
  }, []);

  const snapTo = useCallback(
    (revealed: boolean) => {
      const targetX = revealed ? 0 : REVEAL_WIDTH;
      applyTransform(targetX, true);
      currentXRef.current = targetX;
      onReveal(revealed);
    },
    [applyTransform, onReveal],
  );

  // Sync with external isRevealed prop
  useEffect(() => {
    const targetX = isRevealed ? 0 : REVEAL_WIDTH;
    if (currentXRef.current !== targetX) {
      applyTransform(targetX, true);
      currentXRef.current = targetX;
    }
  }, [isRevealed, applyTransform]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      startTimeRef.current = Date.now();
      directionRef.current = null;
      cancelAnimationFrame(rafRef.current);
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;

      // Direction lock
      if (directionRef.current === null) {
        const totalDelta = Math.abs(deltaX) + Math.abs(deltaY);
        if (totalDelta < DIRECTION_LOCK_THRESHOLD) return;
        directionRef.current =
          Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      }

      if (directionRef.current !== "horizontal") return;

      e.preventDefault();

      rafRef.current = requestAnimationFrame(() => {
        // Action button: REVEAL_WIDTH = off-screen, 0 = fully visible
        const baseX = isRevealed ? 0 : REVEAL_WIDTH;
        const rawX = baseX - deltaX;
        const clampedX = Math.max(0, Math.min(REVEAL_WIDTH, rawX));
        const el = actionRef.current;
        if (!el) return;
        el.style.transition = "none";
        el.style.transform = `translateX(${clampedX}px)`;
      });
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (directionRef.current !== "horizontal") return;

      cancelAnimationFrame(rafRef.current);

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startXRef.current;
      const elapsed = Date.now() - startTimeRef.current;
      const velocity = elapsed > 0 ? deltaX / elapsed : 0;

      if (isRevealed) {
        // Currently revealed: swipe right to close, or stay open
        const shouldClose =
          deltaX > REVEAL_THRESHOLD || velocity > VELOCITY_THRESHOLD;
        snapTo(!shouldClose);
      } else {
        // Currently closed: swipe left to reveal
        const shouldReveal =
          deltaX < -REVEAL_THRESHOLD || velocity < -VELOCITY_THRESHOLD;
        snapTo(shouldReveal);
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [disabled, isRevealed, snapTo]);

  return { containerRef, actionRef };
}
