import { useEffect, useRef } from 'react';

const THRESHOLD_PX = 50;
const MIN_FLICK_PX = 30;
const DIRECTION_RATIO = 1.5;
const FLICK_SPEED_PX_PER_MS = 0.6;

const INTERACTIVE_SELECTOR = [
  'input', 'select', 'textarea', 'button', 'a',
  '[role="dialog"]', '[role="tablist"]', '[role="tab"]', '[role="slider"]',
  '.sheet', '.sheet-backdrop',
  '.table-scroll', '.select-row', '.inv-card', '.catalog-card', '.toggle-row',
].join(', ');

export default function useSwipeNavigation({ ref, onSwipe, enabled = true }) {
  const onSwipeRef = useRef(onSwipe);
  const gestureRef = useRef(null);

  useEffect(() => {
    onSwipeRef.current = onSwipe;
  }, [onSwipe]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return undefined;

    const handleStart = (event) => {
      if (event.target.closest(INTERACTIVE_SELECTOR)) return;
      const touch = event.touches[0];
      gestureRef.current = {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastTime: event.timeStamp,
        handled: false,
      };
    };

    const handleMove = (event) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.handled) return;
      const touch = event.touches[0];
      if (!touch || touch.identifier !== gesture.id) return;

      const dx = touch.clientX - gesture.startX;
      const dy = touch.clientY - gesture.startY;
      const elapsed = Math.max(1, event.timeStamp - gesture.lastTime);
      const speed = Math.abs(dx) / elapsed;

      if (Math.abs(dx) < THRESHOLD_PX && speed < FLICK_SPEED_PX_PER_MS) return;
      if (Math.abs(dx) < MIN_FLICK_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * DIRECTION_RATIO) return;

      gesture.handled = true;
      event.preventDefault();
      onSwipeRef.current(dx < 0 ? 'left' : 'right');
    };

    const handleEnd = () => {
      gestureRef.current = null;
    };

    element.addEventListener('touchstart', handleStart, { passive: true });
    element.addEventListener('touchmove', handleMove, { passive: false });
    element.addEventListener('touchend', handleEnd);
    element.addEventListener('touchcancel', handleEnd);
    return () => {
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchmove', handleMove);
      element.removeEventListener('touchend', handleEnd);
      element.removeEventListener('touchcancel', handleEnd);
    };
  }, [ref, enabled]);
}