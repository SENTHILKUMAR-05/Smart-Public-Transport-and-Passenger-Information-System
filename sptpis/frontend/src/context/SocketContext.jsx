import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveBuses, setLiveBuses] = useState({}); // bus_id -> bus live state
  const [lastOccupancyUpdate, setLastOccupancyUpdate] = useState(null);
  const [lastPassengerStatus, setLastPassengerStatus] = useState(null);
  const [lastEmergency, setLastEmergency] = useState(null);
  const [simSpeed, setSimSpeed] = useState(1);

  useEffect(() => {
    const socketInstance = io('', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket.IO] Connected to TNSTC Server:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket.IO] Disconnected');
    });

    socketInstance.on('bus_location_update', (data) => {
      setLiveBuses((prev) => ({
        ...prev,
        [data.bus_id]: {
          ...(prev[data.bus_id] || {}),
          ...data
        }
      }));
    });

    socketInstance.on('fleet_live_sync', (list) => {
      if (Array.isArray(list)) {
        const map = {};
        list.forEach((b) => {
          map[b.bus_id] = b;
        });
        setLiveBuses((prev) => ({ ...prev, ...map }));
      }
    });

    socketInstance.on('occupancy_update', (data) => {
      setLastOccupancyUpdate(data);
      setLiveBuses((prev) => {
        const existing = prev[data.bus_id];
        if (!existing) return prev;
        return {
          ...prev,
          [data.bus_id]: {
            ...existing,
            total_occupancy_count: data.total_occupancy_count,
            occupancy_percentage: data.occupancy_percentage,
            normal_passengers_count: data.normal_passengers_count
          }
        };
      });
    });

    socketInstance.on('passenger_status_change', (data) => {
      setLastPassengerStatus(data);
    });

    socketInstance.on('emergency_alert', (data) => {
      setLastEmergency(data);
    });

    socketInstance.on('sim_speed_change', (data) => {
      setSimSpeed(data.speed || 1);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        liveBuses,
        lastOccupancyUpdate,
        lastPassengerStatus,
        lastEmergency,
        simSpeed
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
