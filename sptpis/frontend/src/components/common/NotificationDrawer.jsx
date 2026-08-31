import React from 'react';
import { X, Bell, ShieldAlert, Navigation, Clock, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const NotificationDrawer = ({ isOpen, onClose }) => {
  const { notifications, markAllRead, activeToast, clearToast } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-white text-base">Smart Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-xs text-brand-400 hover:text-brand-300 transition flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications && notifications.length > 0 ? (
            notifications.map((notif) => {
              const isEmergency = notif.category === 'Emergency';
              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isEmergency
                      ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                      : notif.isRead
                      ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                      : 'bg-slate-800/80 border-slate-700 text-slate-100 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                      {notif.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notif.time}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm mt-1 text-white">
                    {notif.title}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed text-slate-300">
                    {notif.message}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No new notifications</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
          TNSTC Live Smart City Alerts System
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
