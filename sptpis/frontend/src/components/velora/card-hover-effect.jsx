import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const HoverCards = ({
  items = [],
  columns = 4,
  className = '',
  cardClassName = '',
  layoutId = 'hoverCardsBackground'
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const getColClass = (cols) => {
    switch (cols) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 sm:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 5: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
      case 6: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
      case 4:
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    }
  };

  return (
    <div className={`grid ${getColClass(columns)} gap-4 py-2 ${className}`}>
      {items.map((item, idx) => {
        const Wrapper = item.href ? 'a' : item.onClick ? 'button' : 'div';
        const wrapperProps = item.href
          ? { href: item.href }
          : item.onClick
          ? { type: 'button', onClick: item.onClick }
          : {};

        return (
          <Wrapper
            key={item.title || item.label || idx}
            {...wrapperProps}
            className="relative group block p-2 h-full w-full text-left outline-none cursor-pointer"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  className="absolute inset-0 h-full w-full bg-slate-800/80 rounded-3xl block -z-0 border border-brand-500/40 shadow-[0_0_25px_rgba(56,189,248,0.2)]"
                  layoutId={layoutId}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15 }
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.1 }
                  }}
                />
              )}
            </AnimatePresence>

            <Card className={cardClassName}>
              <div className="flex justify-between items-start mb-3 relative z-10">
                {item.icon && (
                  <CardIcon color={item.color}>
                    {item.icon}
                  </CardIcon>
                )}
                {item.trend && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950/80 text-emerald-400 shadow-inner">
                    {item.trend}
                  </span>
                )}
                {item.badge && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950/80 text-brand-300 shadow-inner">
                    {item.badge}
                  </span>
                )}
              </div>

              {item.value && (
                <div className="text-2xl font-black text-white tracking-tight mb-1 relative z-10 font-mono">
                  {item.value}
                </div>
              )}

              <CardTitle>{item.title || item.label}</CardTitle>
              
              {item.description && (
                <CardDescription>{item.description}</CardDescription>
              )}
            </Card>
          </Wrapper>
        );
      })}
    </div>
  );
};

export const HoverCardGrid = ({
  children,
  className = '',
  layoutId = 'hoverCardGridBackground'
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const childrenArray = React.Children.toArray(children);

  return (
    <div className={`relative ${className}`}>
      {childrenArray.map((child, idx) => (
        <div
          key={child.key || idx}
          className="relative group p-1.5 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-slate-800/80 rounded-3xl block -z-0 border border-brand-500/40 shadow-[0_0_25px_rgba(56,189,248,0.2)]"
                layoutId={layoutId}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 }
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.1 }
                }}
              />
            )}
          </AnimatePresence>
          <div className="relative z-10 h-full w-full">
            {child}
          </div>
        </div>
      ))}
    </div>
  );
};

export const Card = ({ className = '', children }) => {
  return (
    <div
      className={`rounded-2xl h-full w-full p-4 overflow-hidden bg-slate-900/90 border border-slate-800/90 relative z-10 transition-all duration-300 group-hover:border-slate-700/80 group-hover:shadow-2xl shadow-lg flex flex-col justify-between ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export const CardTitle = ({ className = '', children }) => {
  return (
    <h4 className={`text-slate-100 font-bold tracking-wide text-sm truncate ${className}`}>
      {children}
    </h4>
  );
};

export const CardDescription = ({ className = '', children }) => {
  return (
    <p className={`text-slate-400 tracking-wide leading-relaxed text-xs mt-1 line-clamp-2 ${className}`}>
      {children}
    </p>
  );
};

export const CardIcon = ({ color = 'text-brand-400', children }) => {
  return (
    <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
      <div className={color}>{children}</div>
    </div>
  );
};

export default {
  HoverCards,
  HoverCardGrid,
  Card,
  CardTitle,
  CardDescription,
  CardIcon
};
