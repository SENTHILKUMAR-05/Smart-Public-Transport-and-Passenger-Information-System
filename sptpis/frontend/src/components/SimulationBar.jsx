import React, { useState } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { Play, Pause, Zap, AlertTriangle, ShieldAlert, Radio } from 'lucide-react';

const SimulationBar = () => {
  const { isConnected, simSpeed } = useSocket();
  const [loading, setLoading] = useState(false);
  const [activeSpeed, setActiveSpeed] = useState(simSpeed || 1);

  const handleSpeedChange = async (spd) => {
    try {
      setLoading(true);
      setActiveSpeed(spd);
      await axios.post('/api/simulation/speed', { speed: spd });
    } catch (e) {
      console.error('Error changing speed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateEmergency = async () => {
    try {
      await axios.post('/api/driver/emergency', {
        bus_id: 1,
        type: 'Traffic Gridlock & Delay Surge',
        location_text: 'Salem Highway NH-44',
        message: 'Simulated congestion event for demo evaluation.'
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-slate-900/95 border-b border-slate-800/80 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Socket.IO Status & Simulation Label */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-500'}`} />
            <span className="font-semibold text-slate-300">
              {isConnected ? 'Socket.IO Real-Time Sync Active' : 'Connecting to Server...'}
            </span>
          </div>

          <span className="text-slate-400 hidden sm:inline">|</span>

          <div className="hidden md:flex items-center gap-2 text-slate-300">
            <span className="font-medium text-slate-400">Autonomous Bus Simulation:</span>
            <span className="text-emerald-400 font-semibold">Live GPS & Occupancy Stream</span>
          </div>
        </div>

        {/* Right: Simulation Controls */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium hidden sm:inline">Simulation Speed:</span>
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => handleSpeedChange(spd)}
              disabled={loading}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                activeSpeed === spd
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {spd}x
            </button>
          ))}

          <button
            onClick={handleSimulateEmergency}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition font-semibold"
            title="Trigger a simulated traffic/delay event on Socket.IO"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simulate Delay Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationBar;
