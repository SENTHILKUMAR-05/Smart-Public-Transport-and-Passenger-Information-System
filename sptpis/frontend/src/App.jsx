import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, CheckCircle2 } from 'lucide-react';
import { NotificationProvider } from './context/NotificationContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SimulationBar from './components/SimulationBar';
import ChatbotModal from './components/ChatbotModal';
import NotificationDrawer from './components/common/NotificationDrawer';

import PassengerDashboard from './pages/PassengerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StateAdminDashboard from './pages/StateAdminDashboard';
import RegionalAdminDashboard from './pages/RegionalAdminDashboard';
import DepotAdminDashboard from './pages/DepotAdminDashboard';
import AiResearchLab from './pages/AiResearchLab';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

const AppContent = () => {
  const { user } = useAuth();
  const { lastSystemAlert } = useSocket();
  // Sync the active tab with the user's role, but allow visiting the AI Lab manually
  const [activeTab, setActiveTab] = useState(user?.role || 'passenger');
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  // Auto-switch tab if user identity changes
  React.useEffect(() => {
    if (user && user.role) setActiveTab(user.role);
  }, [user]);

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Top Navigation Bar with Quick Demo Role Switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openNotifications={() => setNotifDrawerOpen(true)}
      />

      {/* Real-Time Simulation Control Bar */}
      <SimulationBar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'passenger' && <PassengerDashboard />}
        {activeTab === 'driver' && <DriverDashboard />}
        {activeTab === 'state_admin' && <StateAdminDashboard />}
        {activeTab === 'regional_admin' && <RegionalAdminDashboard />}
        {activeTab === 'depot_admin' && <DepotAdminDashboard />}
      </main>

      {/* Smart City Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Floating AI Chat Assistant (Customer side only) */}
      {activeTab === 'passenger' && <ChatbotModal />}

      {/* Slide-over Notifications Drawer */}
      <NotificationDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
      />

      {/* Global WebSocket Sync Notifications Container */}
      <AnimatePresence>
          {lastSystemAlert && (
              <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.9 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed bottom-10 right-10 bg-slate-800 border border-brand-500/50 p-6 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.6)] z-[9999] max-w-md flex gap-4 items-start backdrop-blur-md"
              >
                  <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0 animate-pulse border border-brand-500/50">
                      <Globe className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                      <h4 className="text-white font-black mb-1">{lastSystemAlert.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">{lastSystemAlert.message}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Regional Admin</span>
                          <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Depot Admin</span>
                          <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Driver Terminals</span>
                          <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Customer Apps</span>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
