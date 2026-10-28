import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

const THEMES = {
  indigo: {
    from: 'from-indigo-950/40',
    to: 'to-slate-950',
    hoverFrom: 'from-indigo-600/30',
    hoverTo: 'to-violet-600/30',
    stroke: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.35)',
    accent: 'text-indigo-400'
  },
  emerald: {
    from: 'from-emerald-950/40',
    to: 'to-slate-950',
    hoverFrom: 'from-emerald-600/30',
    hoverTo: 'to-teal-600/30',
    stroke: '#10b981',
    glow: 'rgba(16, 185, 129, 0.35)',
    accent: 'text-emerald-400'
  },
  amber: {
    from: 'from-amber-950/40',
    to: 'to-slate-950',
    hoverFrom: 'from-amber-600/30',
    hoverTo: 'to-orange-600/30',
    stroke: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.35)',
    accent: 'text-amber-400'
  },
  rose: {
    from: 'from-rose-950/40',
    to: 'to-slate-950',
    hoverFrom: 'from-rose-600/30',
    hoverTo: 'to-red-600/30',
    stroke: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.35)',
    accent: 'text-rose-400'
  },
  sky: {
    from: 'from-sky-950/40',
    to: 'to-slate-950',
    hoverFrom: 'from-sky-600/30',
    hoverTo: 'to-blue-600/30',
    stroke: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.35)',
    accent: 'text-sky-400'
  },
  purple: {
    from: 'from-purple-950/40',
    to: 'to-slate-950',
    hoverFrom: 'from-purple-600/30',
    hoverTo: 'to-fuchsia-600/30',
    stroke: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.35)',
    accent: 'text-purple-400'
  }
};

/**
 * Universal Hover & Click Gradient Shift Card with Sheen Sweep and Neon Drawing Perimeter
 */
export function GradientShiftCard({
  children,
  className = '',
  colorTheme = 'indigo',
  strokeColor,
  hoverFrom,
  hoverTo,
  radius = 20,
  stroke = 2,
  duration = 550,
  onClick,
  as: Component = 'div',
  ...rest
}) {
  const prefersReduced = useReducedMotion();
  const theme = THEMES[colorTheme] || THEMES.indigo;
  const activeStroke = strokeColor || theme.stroke;
  const activeHoverFrom = hoverFrom || theme.hoverFrom;
  const activeHoverTo = hoverTo || theme.hoverTo;

  const ref = useRef(null);
  const [active, setActive] = useState(false);
  const [sheenKey, setSheenKey] = useState(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });

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
    const t2 = setTimeout(updateDims, 300);

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

  const handleMouseLeave = () => {
    setActive(false);
  };

  const handleClick = (e) => {
    // Retrigger sheen sweep animation on click
    setSheenKey(Date.now());
    if (onClick) onClick(e);
  };

  const inset = stroke / 2;
  const w = Math.max(0, dims.w - stroke);
  const h = Math.max(0, dims.h - stroke);
  const r = Math.min(Math.max(0, radius - inset), w / 2, h / 2);
  const perimeter = Math.max(1, Math.round(2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r));

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
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onClick={handleClick}
      className={`hcgs-card group relative overflow-hidden rounded-[20px] border border-slate-800 bg-slate-900/90 shadow-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl focus-within:-translate-y-2 cursor-pointer ${className}`}
      style={{
        boxShadow: drawn ? `0 24px 60px -20px ${activeStroke}55` : undefined,
        ...rest.style
      }}
      {...rest}
    >
      {/* 1. Global CSS for Sheen sweep & Smooth gradient shift */}
      <style>{`
        @keyframes hcgs-sweep {
          0% { transform: translateX(-130%) skewX(-14deg); opacity: 0; }
          30% { opacity: 0.75; }
          100% { transform: translateX(250%) skewX(-14deg); opacity: 0; }
        }
        .hcgs-sheen-sweep {
          animation: hcgs-sweep 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .hcgs-grad-surface {
          background-size: 220% 220%;
          background-position: 0% 50%;
          transition: background-position 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease;
        }
        .hcgs-card:hover .hcgs-grad-surface,
        .hcgs-card:focus-within .hcgs-grad-surface {
          background-position: 100% 50%;
        }
      `}</style>

      {/* 2. Idle subtle gradient layer */}
      <div
        aria-hidden="true"
        className={`hcgs-grad-surface pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.from} ${theme.to} opacity-50`}
      />

      {/* 3. Vivid shifting gradient revealed on hover / focus */}
      <div
        aria-hidden="true"
        className={`hcgs-grad-surface pointer-events-none absolute inset-0 bg-gradient-to-br ${activeHoverFrom} ${activeHoverTo} opacity-0 group-hover:opacity-100 group-focus-within:opacity-100`}
      />

      {/* 4. Radial backdrop radiance */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px -z-0 rounded-[inherit] transition-opacity duration-500"
        style={{
          background: `radial-gradient(120% 120% at 50% 0%, ${theme.glow}, transparent 70%)`,
          opacity: drawn ? 1 : 0
        }}
      />

      {/* 5. Sheen sweep beam triggered on click or hover */}
      {sheenKey > 0 && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden z-20">
          <div
            key={sheenKey}
            className="hcgs-sheen-sweep absolute inset-y-0 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </div>
      )}

      {/* 6. Self-Drawing Neon SVG Perimeter */}
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
            stroke={activeStroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: `${perimeter} ${perimeter}`,
              strokeDashoffset: drawn ? 0 : perimeter,
              opacity: drawn ? 1 : 0,
              filter: drawn
                ? `drop-shadow(0 0 6px ${activeStroke}) drop-shadow(0 0 14px ${activeStroke}cc)`
                : 'none',
              transition: prefersReduced
                ? 'none'
                : `stroke-dashoffset ${animDuration}ms cubic-bezier(0.65, 0, 0.35, 1), opacity 200ms ease, filter 250ms ease-out`
            }}
          />
        </svg>
      )}

      {/* 7. Card Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </Component>
  );
}

export default GradientShiftCard;
