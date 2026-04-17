'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimate } from 'framer-motion';
import { LOGO_LETTERS, LOGO_PURPLE, LOGO_BG } from './Logo';

const SESSION_KEY = 'cardlet_boot_played';

export function BootSplash() {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [done, setDone] = useState(false);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setDone(true);
      return;
    }

    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sessionStorage.setItem(SESSION_KEY, '1');
    setShouldRender(true);
  }, []);

  useEffect(() => {
    if (!shouldRender) return;
    let cancelled = false;

    async function run() {
      try {
        if (reducedMotionRef.current) {
          if (containerRef.current) {
            await animate(containerRef.current, { opacity: 0 }, { duration: 0.15 });
          }
          if (!cancelled) setDone(true);
          return;
        }

        await animate(
          scope.current,
          { rotate: 0 },
          { duration: 0.69, ease: [0.22, 1, 0.36, 1] }
        );
        if (cancelled) return;

        await animate(
          scope.current,
          {
            scale: 0.32,
            x: 'calc(-50vw + 72px)',
            y: 'calc(-50vh + 44px)',
          },
          { duration: 0.5, ease: [0.65, 0.02, 0.2, 1] }
        );
        if (cancelled) return;

        const morphPromises: Promise<unknown>[] = [];
        for (let i = 1; i < LOGO_LETTERS.length; i++) {
          morphPromises.push(
            animate(
              `[data-letter-idx="${i}"]`,
              {
                x: `-${(i * 0.62).toFixed(2)}em`,
                color: LOGO_PURPLE,
              },
              { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
            ) as unknown as Promise<unknown>
          );
        }
        await Promise.all(morphPromises);
        if (cancelled) return;

        if (containerRef.current) {
          await animate(containerRef.current, { opacity: 0 }, { duration: 0.28 });
        }
        if (!cancelled) setDone(true);
      } catch {
        if (!cancelled) setDone(true);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [shouldRender, animate, scope]);

  if (!mounted || done) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden
      role="presentation"
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundColor: LOGO_BG,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        ref={scope}
        initial={{ rotate: 180, scale: 1, x: 0, y: 0 }}
        className="flex items-center font-sans font-bold"
        style={{
          fontSize: 'clamp(3.5rem, 13vw, 8rem)',
          letterSpacing: '-0.035em',
          color: '#ffffff',
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      >
        {LOGO_LETTERS.map((letter, i) => (
          <motion.span
            key={i}
            data-letter-idx={i}
            initial={{ x: 0 }}
            style={{
              display: 'inline-block',
              color: '#ffffff',
              willChange: 'transform, color',
              zIndex: LOGO_LETTERS.length - i,
            }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
