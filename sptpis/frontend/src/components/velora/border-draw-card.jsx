import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Universal Self-Drawing Neon Border Card & Wrapper
 * Accurately traces a vibrant electric neon perimeter around the element on hover or focus,
 * with ambient backdrop radiance and smooth elevation lift.
 */
export function BorderDrawWrapper({
  children,
  className = '',
  stroke = 2.2,
  radius = 18,
  duration = 550,
  strokeColor = '#6366f1',
  glowColor,
  as: Component = 'div',
  onClick,
  ...rest
}) {
  const prefersReduced = useReducedMotion();
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const effectiveGlow = glowColor || `${strokeColor}33`;

  const updateDims = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const w = rect.width || ref.current.offsetWidth || 0;
      const h = rect.height || ref.current.offsetHeight || 0;
      if (w > 0 && h > 0) {
        setDims(prev => (Math.abs(prev.w - w) < 0.5 && Math.abs(prev.h - h) < 0.5 ? prev : { w, h }));
      }
    }
  };

  useLayoutEffect(() => {
    updateDims();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateDims();
    const t1 = setTimeout(updateDims, 60);
    const t2 = setTimeout(updateDims, 250);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width || (el ? el.offsetWidth : 0);
          const h = entry.contentRect.height || (el ? el.offsetHeight : 0);
          if (w > 0 && h > 0) {
            setDims(prev => (Math.abs(prev.w - w) < 0.5 && Math.abs(prev.h - h) < 0.5 ? prev : { w, h }));
          }
        }
      });
      ro.observe(el);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) ro.disconnect();
    };
  }, []);

  const handleMouseEnter = () => {
    updateDims();
    setActive(true);
  };

  const handleMouseMove = () => {
    if (!active) {
      updateDims();
      setActive(true);
    }
  };

  const handleMouseLeave = () => {
    setActive(false);
  };

  const inset = stroke / 2;
  const w = Math.max(0, dims.w - stroke);
  const h = Math.max(0, dims.h - stroke);
  const r = Math.min(Math.max(0, radius - inset), w / 2, h / 2);
  const perimeter = Math.max(1, Math.round(2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r));

  // Closed continuous rounded rectangle SVG path
  const pathD = w > 0 && h > 0 ? `M ${inset + r} ${inset}
    h ${Math.max(0, w - 2 * r)}
    a ${r} ${r} 0 0 1 ${r} ${r}
    v ${Math.max(0, h - 2 * r)}
    a ${r} ${r} 0 0 1 ${-r} ${r}
    h ${-Math.max(0, w - 2 * r)}
    a ${r} ${r} 0 0 1 ${-r} ${-r}
    v ${-Math.max(0, h - 2 * r)}
    a ${r} ${r} 0 0 1 ${r} ${-r}
    z` : '';

  const drawn = active || prefersReduced;
  const animDuration = prefersReduced ? 0 : duration;

  return (
    <Component
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onClick={onClick}
      className={`group relative transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 ${className}`}
      style={{
        boxShadow: drawn ? `0 20px 50px -20px ${strokeColor}55` : undefined,
        ...rest.style
      }}
      {...rest}
    >
      {/* Soft ambient neon radiant glow revealed on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-0.5 -z-0 rounded-[inherit] transition-opacity duration-500"
        style={{
          background: `radial-gradient(120% 120% at 50% 0%, ${effectiveGlow}, transparent 70%)`,
          opacity: drawn ? 1 : 0
        }}
      />

      {/* The self-drawing SVG accent path with high-contrast electric neon glow */}
      {dims.w > 0 && dims.h > 0 && (
        <svg
          aria-hidden="true"
          width={dims.w}
          height={dims.h}
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          className="pointer-events-none absolute inset-0 z-30 overflow-visible"
          fill="none"
        >
          <path
            d={pathD}
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: `${perimeter} ${perimeter}`,
              strokeDashoffset: drawn ? 0 : perimeter,
              opacity: drawn ? 1 : 0,
              filter: drawn
                ? `drop-shadow(0 0 6px ${strokeColor}) drop-shadow(0 0 14px ${strokeColor}cc)`
                : 'none',
              transition: prefersReduced
                ? 'none'
                : `stroke-dashoffset ${animDuration}ms cubic-bezier(0.65, 0, 0.35, 1), opacity 200ms ease, filter 250ms ease-out`
            }}
          />
        </svg>
      )}

      {/* Card Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </Component>
  );
}

/**
 * Standard BorderDrawCard (for articles, guides, feature promos)
 */
export function BorderDrawCard({ card, index = 0 }) {
  return (
    <BorderDrawWrapper
      as="a"
      href={card.href}
      className="flex flex-col p-6 rounded-[20px] bg-slate-900/80 border border-slate-800/90 text-left"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 border border-slate-700/80">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          {card.kicker}
        </span>
        {card.meta && (
          <span className="text-xs font-medium text-slate-400">
            {card.meta}
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold leading-snug text-white group-hover:text-brand-300 transition-colors">
        {card.title}
      </h3>
      {card.body && (
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {card.body}
        </p>
      )}

      <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-400 group-hover:text-brand-300 transition-colors">
        Read details
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8h9" />
          <path d="M8.5 4.5 12 8l-3.5 3.5" />
        </svg>
      </span>
    </BorderDrawWrapper>
  );
}

export default {
  BorderDrawWrapper,
  BorderDrawCard
};
