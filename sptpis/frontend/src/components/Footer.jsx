import React from 'react';
import { Bus, ShieldCheck } from 'lucide-react';

const Footer = ({ setActiveTab }) => {
  return (
    <footer className="w-full bg-slate-950/80 backdrop-blur-md border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Branding & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-500 p-[1px]">
             <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
                <Bus className="w-4 h-4 text-emerald-400" />
             </div>
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-wide">TNSTC SPTPIS</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1.5 mt-0.5">
               <ShieldCheck className="w-3 h-3 text-emerald-500" /> Govt. Approved System
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-500 font-medium">
          © 2026 Tamil Nadu State Transport Corporation • Command Center
        </div>

        {/* Quick Actions / Links */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
           <button onClick={() => setActiveTab('passenger')} className="hover:text-brand-400 transition-colors">Passenger Panel</button>
           <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
           <button onClick={() => setActiveTab('admin')} className="hover:text-brand-400 transition-colors">Admin Console</button>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;
