import React from 'react';
import { X, QrCode, Download, Printer, CheckCircle2, ShieldCheck, Bus } from 'lucide-react';

const QrTicketModal = ({ ticket, onClose }) => {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-brand-600 to-emerald-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Bus className="w-6 h-6" />
            <span className="font-extrabold text-lg uppercase tracking-wide">
              TNSTC / SETC Official Ticket
            </span>
          </div>
          <p className="text-xs text-blue-100">
            Tamil Nadu State Transport Corporation • E-Ticket & QR Pass
          </p>
        </div>

        {/* Ticket Body */}
        <div className="p-6 space-y-5">
          {/* Reference & Status */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <p className="text-xs text-slate-400">Booking Reference</p>
              <p className="text-base font-bold text-white tracking-wider">
                {ticket.booking_reference || 'TNSTC-BK-882142'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{ticket.booking_status || 'Confirmed'}</span>
            </div>
          </div>

          {/* Route Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">Boarding Point</p>
              <p className="text-sm font-semibold text-white">
                {ticket.boarding_stop || 'Dharmapuri Bus Stand'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Destination</p>
              <p className="text-sm font-semibold text-white">
                {ticket.destination_stop || 'Sathyamangalam Bus Stand'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Travel Date</p>
              <p className="text-sm font-semibold text-white">
                {ticket.travel_date || new Date().toISOString().split('T')[0]}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Seat Number</p>
              <p className="text-sm font-bold text-brand-400 text-base">
                {ticket.seat_number || 'S15'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Bus Number</p>
              <p className="text-sm font-semibold text-white">
                {ticket.registration_number || 'TN-29-N-1542'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Fare</p>
              <p className="text-sm font-bold text-emerald-400 text-base">
                ₹{ticket.fare_paid || 145}
              </p>
            </div>
          </div>

          {/* QR Code & OTP Token Block */}
          <div className="flex flex-col items-center justify-center p-5 bg-slate-950 rounded-2xl border border-slate-800 text-center relative overflow-hidden">
            {/* Boarding OTP Badge */}
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2 text-center w-full">
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold block">Boarding Verification OTP</span>
              <span className="text-2xl font-mono font-black text-white tracking-[0.3em]">{ticket.otp || ticket.verification_otp || '789012'}</span>
            </div>

            <div className="p-3 bg-white rounded-xl mb-3 shadow-lg">
              {/* Responsive SVG QR Code representation */}
              <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 100 100" fill="#0f172a">
                <rect x="10" y="10" width="25" height="25" rx="2" fill="none" stroke="#0f172a" strokeWidth="6"/>
                <rect x="18" y="18" width="9" height="9" fill="#0f172a"/>
                <rect x="65" y="10" width="25" height="25" rx="2" fill="none" stroke="#0f172a" strokeWidth="6"/>
                <rect x="73" y="18" width="9" height="9" fill="#0f172a"/>
                <rect x="10" y="65" width="25" height="25" rx="2" fill="none" stroke="#0f172a" strokeWidth="6"/>
                <rect x="18" y="73" width="9" height="9" fill="#0f172a"/>
                <rect x="42" y="15" width="6" height="6" />
                <rect x="52" y="25" width="8" height="8" />
                <rect x="44" y="44" width="12" height="12" />
                <rect x="65" y="55" width="10" height="10" />
                <rect x="78" y="72" width="12" height="12" />
                <rect x="48" y="75" width="8" height="8" />
              </svg>
            </div>
            <p className="text-xs font-mono text-slate-400 tracking-wider">
              PNR / Token: <span className="text-white font-bold">{ticket.booking_reference || ticket.qr_code_token || 'TNSTC-BK-882142'}</span>
            </p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Show QR or 6-Digit OTP to Driver / Conductor</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition shadow-lg shadow-brand-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrTicketModal;
