import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Bus, Bell, User, ShieldAlert, Cpu, CheckCircle2,
  ChevronDown, LogOut, Radio, RefreshCw
} from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab, openNotifications }) => {
  const { user, switchDemoRole, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navItems = [];
  if (user?.role === 'passenger') navItems.push({ id: 'passenger', label: 'Passenger Portal', icon: Bus });
  if (user?.role === 'driver') navItems.push({ id: 'driver', label: 'Driver Dashboard', icon: User });
  if (['state_admin', 'regional_admin', 'depot_admin'].includes(user?.role)) navItems.push({ id: user.role, label: 'Admin Dashboard', icon: ShieldAlert });

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div
            className="flex items-center gap-3.5 cursor-pointer group"
            onClick={() => setActiveTab('passenger')}
          >
            <div className="relative">
                <div className="absolute inset-0 bg-brand-500 rounded-xl blur-md opacity-30 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 flex items-center justify-center shadow-[inset_0_1px_rgba(255,255,255,0.1)] group-hover:border-brand-500/50 transition-colors">
                  <Bus className="w-6 h-6 text-brand-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter bg-gradient-to-r from-white via-slate-300 to-brand-200 bg-clip-text text-transparent transform group-hover:translate-x-1 transition-transform duration-300">
                TNSTC Smart Transport
              </span>
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500 transform group-hover:translate-x-1 transition-transform duration-300 delay-75">
                Command Center Console
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Side: Demo Role Switcher & Notifications */}
          <div className="flex items-center gap-3">
            {/* User Profile / Logout Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 hover:border-brand-500/50 hover:bg-slate-800 transition-all group shadow-sm hover:shadow-brand-500/20"
                title="Profile & Options"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-inner relative overflow-hidden">
                    <span className="text-white font-bold text-xs uppercase relative z-10">{user?.name?.charAt(0) || 'U'}</span>
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/20"></div>
                </div>
                <div className="flex flex-col items-start pr-2">
                    <span className="text-xs font-bold text-white capitalize leading-tight group-hover:text-brand-300 transition-colors">
                        {user?.role?.replace('_', ' ') || 'User'}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                    Logged in as
                  </div>
                  <div className="px-3 py-2 text-sm text-slate-300 border-b border-slate-800">
                    {user?.name}
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 mt-1 text-sm flex items-center gap-2 text-rose-400 hover:bg-slate-800 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Secure Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={openNotifications}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              title="Smart Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center animate-bounce-slow">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${isActive ? 'text-brand-400' : 'text-slate-400'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {item.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
