import React from 'react';
import { Bus, ShieldCheck, Heart, PhoneCall, ExternalLink } from 'lucide-react';

const Footer = ({ setActiveTab }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-sm mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bus className="w-5 h-5 text-brand-500" />
              <span className="font-bold text-white text-base">TNSTC SPTPIS</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart Public Transport and Passenger Information System focused on Tamil Nadu State Transport (TNSTC & SETC) bus services.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Government of Tamil Nadu Transport Certified</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">
              Major TNSTC Routes
            </h4>
            <ul className="space-y-2 text-xs">
              <li>• Dharmapuri → Salem → Erode → Sathyamangalam</li>
              <li>• Chennai CMBT → Villupuram → Madurai</li>
              <li>• Coimbatore → Tiruppur → Erode → Salem</li>
              <li>• Madurai → Virudhunagar → Kanyakumari</li>
              <li>• Chennai Koyambedu → Vellore → Hosur</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">
              System Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveTab('passenger')} className="hover:text-brand-400 transition">
                  • Passenger Live Dashboard & Booking
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('driver')} className="hover:text-brand-400 transition">
                  • Driver Boarding & Emergency Panel
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('admin')} className="hover:text-brand-400 transition">
                  • Admin Fleet Control & Analytics
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('ai_lab')} className="hover:text-brand-400 transition">
                  • AI Crowd & Delay Research Lab
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">
              24/7 TNSTC Support
            </h4>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <PhoneCall className="w-4 h-4" />
                <span>1800-425-4424 (Toll Free)</span>
              </div>
              <p className="text-xs text-slate-400">
                Women's Helpline: 1091 | Emergency: 112
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Research Project Submission & Placement Portfolio Ready • Aimed for AIML Publication 2026.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Tamil Nadu State Transport Corporation (TNSTC/SETC) • Smart City Initiative</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for AI & Smart City Public Transport
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
