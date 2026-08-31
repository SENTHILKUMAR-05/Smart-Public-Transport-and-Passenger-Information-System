import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
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

      {/* Floating AI Chat Assistant (On every page as requested) */}
      <ChatbotModal />

      {/* Slide-over Notifications Drawer */}
      <NotificationDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
      />
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
