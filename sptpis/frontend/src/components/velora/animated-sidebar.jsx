import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, PinOff, LogOut, ChevronRight } from 'lucide-react';

const SidebarContext = createContext({
  open: false,
  setOpen: () => {},
  pinned: false,
  setPinned: () => {},
  animate: true
});

export const useSidebar = () => useContext(SidebarContext);

export const Sidebar = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  pinned: pinnedProp,
  setPinned: setPinnedProp,
  animate = true,
  className = ''
}) => {
  const [openInternal, setOpenInternal] = useState(false);
  const [pinnedInternal, setPinnedInternal] = useState(false);

  const open = openProp !== undefined ? openProp : openInternal;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenInternal;
  const pinned = pinnedProp !== undefined ? pinnedProp : pinnedInternal;
  const setPinned = setPinnedProp !== undefined ? setPinnedProp : setPinnedInternal;

  const isExpanded = pinned || open;

  return (
    <SidebarContext.Provider value={{ open: isExpanded, setOpen, pinned, setPinned, animate }}>
      <div className={`relative flex h-full ${className}`}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

export const SidebarBody = ({
  logo,
  title,
  subtitle,
  children,
  footer,
  showPinToggle = true,
  className = ''
}) => {
  const { open, setOpen, pinned, setPinned, animate } = useSidebar();

  return (
    <motion.aside
      onMouseEnter={() => !pinned && setOpen(true)}
      onMouseLeave={() => !pinned && setOpen(false)}
      initial={false}
      animate={{
        width: animate ? (open ? 260 : 76) : 260,
        transition: { type: 'spring', stiffness: 350, damping: 30 }
      }}
      className={`relative h-full max-h-full flex flex-col bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 shadow-[4px_0_30px_rgba(0,0,0,0.5)] z-40 select-none overflow-hidden ${className}`}
    >
      {/* 1. Top Header Section with Logo and Title (shrink-0) */}
      {(logo || title) && (
        <div className="shrink-0 h-16 flex items-center px-4 border-b border-slate-800/80 bg-slate-950/60 z-10">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            {logo}
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="ml-3 overflow-hidden whitespace-nowrap flex-1"
              >
                {typeof title === 'string' ? (
                  <div className="font-extrabold text-white text-sm tracking-wide leading-tight truncate">
                    {title}
                  </div>
                ) : (
                  title
                )}
                {subtitle && (
                  <div className="text-[11px] text-slate-400 font-medium leading-none truncate mt-0.5">
                    {subtitle}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 2. Main Scrollable Container (holds navigation links & footer so user can always scroll down to logout) */}
      <div className="flex-1 min-h-0 flex flex-col justify-between overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/80 hover:scrollbar-thumb-slate-600 scrollbar-track-slate-950/20">
        <nav className="px-3 py-2 space-y-1.5 flex-1">
          {children}
        </nav>

        {/* 3. Footer Area with Pin Lock and Logout */}
        <div className="shrink-0 mt-auto p-3 border-t border-slate-800/80 bg-slate-950/90 space-y-2 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
          {showPinToggle && (
            <button
              onClick={() => setPinned(!pinned)}
              className={`w-full flex items-center justify-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                pinned
                  ? 'bg-brand-500/15 text-brand-300 border-brand-500/30 shadow-sm shadow-brand-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-slate-800'
              }`}
              title={pinned ? 'Unpin Sidebar (Auto-collapse on leave)' : 'Pin Sidebar Open'}
            >
              {pinned ? <PinOff className="w-4 h-4 shrink-0 text-brand-400" /> : <Pin className="w-4 h-4 shrink-0" />}
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden whitespace-nowrap text-[11px] font-bold uppercase tracking-wider"
                  >
                    {pinned ? 'Pinned Open' : 'Pin Sidebar'}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}

          {footer}
        </div>
      </div>
    </motion.aside>
  );
};

export const SidebarSection = ({ title, children }) => {
  const { open } = useSidebar();

  return (
    <div className="pt-2 pb-1">
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-3 mb-1.5 truncate"
        >
          {title}
        </motion.div>
      ) : (
        <div className="w-8 h-px bg-slate-800/80 mx-auto my-2" />
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
};

export const SidebarLink = ({
  label,
  icon,
  href,
  onClick,
  active = false,
  badge = null,
  badgeColor = 'bg-brand-500/20 text-brand-300 border-brand-500/30',
  className = ''
}) => {
  const { open } = useSidebar();

  const content = (
    <>
      <div className={`w-9 h-9 flex items-center justify-center shrink-0 rounded-lg transition-transform ${
        active ? 'text-brand-400 scale-105' : 'text-slate-400 group-hover:text-white group-hover:scale-105'
      }`}>
        {icon}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap ml-2"
          >
            <span className={`text-xs font-bold tracking-wide truncate ${active ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
              {label}
            </span>
            {badge !== null && badge !== undefined && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ml-2 ${badgeColor}`}>
                {badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!open && badge !== null && badge !== undefined && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
      )}
    </>
  );

  const baseClasses = `relative group flex items-center px-2.5 py-2 rounded-xl transition-all w-full cursor-pointer ${
    active
      ? 'bg-brand-500/15 text-white border border-brand-500/30 shadow-md shadow-brand-500/10'
      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
  } ${className}`;

  if (href) {
    return (
      <a href={href} className={baseClasses} title={!open ? label : undefined}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClasses} title={!open ? label : undefined}>
      {content}
    </button>
  );
};

export const SidebarLogoutButton = ({ onClick, className = '' }) => {
  const { open } = useSidebar();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl transition-all text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 hover:text-rose-200 border border-rose-500/40 hover:border-rose-500/70 group cursor-pointer shadow-md shadow-rose-950/40 ${className}`}
      title={!open ? 'LOGOUT' : undefined}
    >
      <LogOut className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform text-rose-400" />
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18 }}
            className="font-black uppercase text-xs tracking-wider overflow-hidden whitespace-nowrap text-rose-300"
          >
            LOGOUT
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarSection,
  SidebarLogoutButton,
  useSidebar
};
