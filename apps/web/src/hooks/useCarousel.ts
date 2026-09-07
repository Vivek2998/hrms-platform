import React from 'react';

export const CAROUSEL_ANIM_MS = 720;

export interface UseCarouselReturn {
  current: number;
  prev: number | null;
  direction: 'left' | 'right';
  transitioning: boolean;
  navigate: (nextIdx: number) => void;
  handlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onTouchStart: (ev: React.TouchEvent) => void;
    onTouchEnd: (ev: React.TouchEvent) => void;
    onMouseDown: (ev: React.MouseEvent) => void;
    onMouseUp: (ev: React.MouseEvent) => void;
    onWheel: (ev: React.WheelEvent) => void;
  };
}

export function useCarousel(totalItems: number, intervalMs = 8000): UseCarouselReturn {
  const [current, setCurrent] = React.useState(0);
  const [prev, setPrev] = React.useState<number | null>(null);
  const [direction, setDirection] = React.useState<'left' | 'right'>('left');
  const [transitioning, setTransitioning] = React.useState(false);
  const [paused, setPaused] = React.useState(false);

  const currentRef = React.useRef(0);
  const pausedRef = React.useRef(false);
  const totalRef = React.useRef(totalItems);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const wheelCoolRef = React.useRef(false);
  const dragStartX = React.useRef<number | null>(null);
  const transRef = React.useRef(false);

  currentRef.current = current;
  pausedRef.current = paused;
  totalRef.current = totalItems;

  const startSlide = React.useCallback((nextIdx: number, dir: 'left' | 'right', prevIdx: number) => {
    setPrev(prevIdx);
    setDirection(dir);
    setCurrent(nextIdx);
    setTransitioning(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitioning(true);
        setTimeout(() => {
          setPrev(null);
          setTransitioning(false);
          transRef.current = false;
        }, CAROUSEL_ANIM_MS + 40);
      });
    });
  }, []);

  const scheduleNext = React.useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (totalRef.current <= 1) return;
    intervalRef.current = setInterval(() => {
      if (pausedRef.current || transRef.current) return;
      transRef.current = true;
      const next = (currentRef.current + 1) % totalRef.current;
      startSlide(next, 'left', currentRef.current);
    }, intervalMs);
  }, [startSlide, intervalMs]);

  React.useEffect(() => {
    scheduleNext();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [scheduleNext, totalItems]);

  function navigate(next: number) {
    if (next === currentRef.current || transRef.current) return;
    transRef.current = true;
    startSlide(next, next > currentRef.current ? 'left' : 'right', currentRef.current);
    scheduleNext();
  }

  function onTouchStart(ev: React.TouchEvent) {
    const t = ev.touches[0];
    if (t) dragStartX.current = t.clientX;
  }
  function onTouchEnd(ev: React.TouchEvent) {
    const t = ev.changedTouches[0];
    if (!t || dragStartX.current === null) return;
    const dx = t.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) < 40) return;
    navigate(dx < 0
      ? Math.min(currentRef.current + 1, totalRef.current - 1)
      : Math.max(currentRef.current - 1, 0));
  }
  function onMouseDown(ev: React.MouseEvent) { dragStartX.current = ev.clientX; }
  function onMouseUp(ev: React.MouseEvent) {
    if (dragStartX.current === null) return;
    const dx = ev.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) < 40) return;
    navigate(dx < 0
      ? Math.min(currentRef.current + 1, totalRef.current - 1)
      : Math.max(currentRef.current - 1, 0));
  }
  function onWheel(ev: React.WheelEvent) {
    if (Math.abs(ev.deltaX) < Math.abs(ev.deltaY)) return;
    if (wheelCoolRef.current) return;
    wheelCoolRef.current = true;
    setTimeout(() => { wheelCoolRef.current = false; }, 700);
    navigate(ev.deltaX > 0
      ? Math.min(currentRef.current + 1, totalRef.current - 1)
      : Math.max(currentRef.current - 1, 0));
  }

  return {
    current,
    prev,
    direction,
    transitioning,
    navigate,
    handlers: {
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
      onTouchStart,
      onTouchEnd,
      onMouseDown,
      onMouseUp,
      onWheel,
    },
  };
}
