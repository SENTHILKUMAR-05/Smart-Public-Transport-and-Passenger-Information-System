import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Bus Arriving Soon',
      message: 'Bus TN-29-N-1542 (Dharmapuri -> Sathyamangalam) will reach Salem in 15 minutes.',
      category: 'Arrival',
      time: '10 mins ago',
      isRead: false
    },
    {
      id: 2,
      title: 'AI Optimal Route Recommendation',
      message: 'AI suggests Route B via bypass road to save 30 minutes due to low traffic.',
      category: 'Route Change',
      time: '1 hr ago',
      isRead: false
    },
    {
      id: 3,
      title: 'Free Women Bus Scheme Active',
      message: 'Pink Bus TN-45-N-3301 on Coimbatore-Salem route has 18 seats available.',
      category: 'Seat Update',
      time: '2 hrs ago',
      isRead: true
    }
  ]);

  const [activeToast, setActiveToast] = useState(null);
  const { lastEmergency, lastOccupancyUpdate } = useSocket() || {};

  useEffect(() => {
    if (lastEmergency) {
      const newNotif = {
        id: Date.now(),
        title: `🚨 EMERGENCY ALERT: ${lastEmergency.type}`,
        message: `Bus ${lastEmergency.registration_number || 'TNSTC Bus'} reported ${lastEmergency.type} at ${lastEmergency.location_text}. Note: ${lastEmergency.message}`,
        category: 'Emergency',
        time: 'Just now',
        isRead: false
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setActiveToast(newNotif);
    }
  }, [lastEmergency]);

  const addNotification = (title, message, category = 'General') => {
    const notif = {
      id: Date.now(),
      title,
      message,
      category,
      time: 'Just now',
      isRead: false
    };
    setNotifications((prev) => [notif, ...prev]);
    setActiveToast(notif);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearToast = () => setActiveToast(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToast,
        addNotification,
        markAllRead,
        clearToast
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
