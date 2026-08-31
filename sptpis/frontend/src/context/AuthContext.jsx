import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tnstc_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('tnstc_token') || 'demo-jwt-token');

  const saveAuth = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('tnstc_user', JSON.stringify(userData));
    localStorage.setItem('tnstc_token', tokenStr);
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokenStr}`;
  };

  const login = async (username, password) => {
    // Temporary Hardcoded Authentication Loop
    if (username === 'state_admin' && password === 'admin') {
      const demoUser = { user_id: 3, name: 'State Admin Center', email: 'state_admin@tnstc.in', role: 'state_admin', category: 'Admin' };
      saveAuth(demoUser, 'demo-state-admin-token');
      return { success: true, user: demoUser };
    } else if (username === 'regional_admin' && password === 'admin') {
      const demoUser = { user_id: 4, name: 'Regional Admin (Salem)', email: 'regional_admin@tnstc.in', role: 'regional_admin', category: 'Admin', region_id: 1 };
      saveAuth(demoUser, 'demo-regional-admin-token');
      return { success: true, user: demoUser };
    } else if (username === 'depot_admin' && password === 'admin') {
      const demoUser = { user_id: 5, name: 'Depot Admin (Dharmapuri)', email: 'depot_admin@tnstc.in', role: 'depot_admin', category: 'Admin', depot_id: 1 };
      saveAuth(demoUser, 'demo-depot-admin-token');
      return { success: true, user: demoUser };
    } else if (username === 'driver' && password === 'driver') {
      const demoUser = { user_id: 2, name: 'K. Murugan (Driver)', email: 'driver@tnstc.in', role: 'driver', category: 'General', driver_id: 1 };
      saveAuth(demoUser, 'demo-driver-token');
      return { success: true, user: demoUser };
    } else if (username === 'passenger' && password === 'passenger') {
      const demoUser = { user_id: 1, name: 'S. Karthik', email: 'passenger@tnstc.in', role: 'passenger', category: 'General' };
      saveAuth(demoUser, 'demo-passenger-token');
      return { success: true, user: demoUser };
    }

    return { success: false, error: 'Invalid Temporary Credentials' };
  };

  const switchDemoRole = async (role) => {
    try {
      const response = await axios.post('/api/auth/demo-login', { role });
      saveAuth(response.data.user, response.data.token);
      return { success: true, user: response.data.user };
    } catch (err) {
      // Offline fallback switch
      let demoUser = {
        user_id: 1,
        name: 'S. Karthik',
        email: 'passenger@tnstc.in',
        role: 'passenger',
        category: 'General'
      };
      if (role === 'driver') {
        demoUser = {
          user_id: 2,
          name: 'K. Murugan (Driver)',
          email: 'driver@tnstc.in',
          role: 'driver',
          category: 'General',
          driver_id: 1
        };
      } else if (role === 'state_admin') {
        demoUser = { user_id: 3, name: 'State Admin Center', email: 'state_admin@tnstc.in', role: 'state_admin', category: 'Admin' };
      } else if (role === 'regional_admin') {
        demoUser = { user_id: 4, name: 'Regional Admin (Salem)', email: 'regional_admin@tnstc.in', role: 'regional_admin', category: 'Admin', region_id: 1 };
      } else if (role === 'depot_admin') {
        demoUser = { user_id: 5, name: 'Depot Admin (Dharmapuri)', email: 'depot_admin@tnstc.in', role: 'depot_admin', category: 'Admin', depot_id: 1 };
      }
      saveAuth(demoUser, 'demo-jwt-token');
      return { success: true, user: demoUser };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tnstc_user');
    localStorage.removeItem('tnstc_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
