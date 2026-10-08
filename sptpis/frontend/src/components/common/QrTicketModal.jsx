import React from 'react';
import { X, Printer, Bus, Copy, Check, Ticket } from 'lucide-react';
import DynamicQrGenerator from './DynamicQrGenerator';

const QrTicketModal = ({ ticket, onClose, onBackToDashboard }) => {
  const [copied, setCopied] = React.useState(false);

  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyOtp = () => {
    const otp = ticket.otp || ticket.verification_otp || '789012';
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pnr = ticket.pnr || ticket.booking_reference || ticket.qr_code_token || 'TNSTC-BK-882142';
  const otp = ticket.otp || ticket.verification_otp || '789012';
  const fromCity = ticket.boarding_stop || ticket.leg?.from || 'Dharmapuri Bus Stand';
  const toCity = ticket.destination_stop || ticket.leg?.to || 'Salem Bus Stand';
  const travelDate = ticket.travel_date || ticket.date || new Date().toISOString().split('T')[0];
  const busReg = ticket.registration_number || ticket.leg?.bus || 'TN-29-N-1542';
  const seats = ticket.seat_number || (ticket.seats ? (Array.isArray(ticket.seats) ? ticket.seats.join(', ') : ticket.seats) : 'S15');
  const passengerName = ticket.passenger_name || ticket.user_name || 'S. KARTHIK';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Compact BookMyShow Style Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 p-3.5 sm:p-4 text-white relative flex justify-between items-center shadow-lg shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-1.5 py-0.5 rounded text-amber-200 border border-white/20">Official E-Pass</span>
                <span className="text-[9px] font-bold text-emerald-300 flex items-center gap-1">● Confirmed</span>
              </div>
              <h2 className="font-black text-base text-white tracking-tight leading-tight">TNSTC / SETC Digital Pass</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Container so entire modal fits on 100% zoom screens */}
        <div className="p-3.5 sm:p-5 space-y-3 overflow-y-auto custom-scrollbar">

          {/* Route Overview */}
          <div className="bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 flex justify-between items-center shadow-inner">
            <div className="space-y-0.5 max-w-[45%]">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Boarding Point</span>
              <p className="text-xs font-black text-white truncate">{fromCity}</p>
            </div>
            <div className="flex flex-col items-center px-1">
              <Bus className="w-4 h-4 text-rose-500 animate-bounce" />
              <div className="w-8 h-[2px] bg-gradient-to-r from-rose-500 to-amber-500 my-0.5"></div>
            </div>
            <div className="space-y-0.5 text-right max-w-[45%]">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Destination</span>
              <p className="text-xs font-black text-white truncate">{toCity}</p>
            </div>
          </div>

          {/* Ticket Key Specs Grid */}
          <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center">
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase">Date</span>
              <span className="text-[11px] font-black text-white">{travelDate}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase">Seats</span>
              <span className="text-[11px] font-black text-rose-400">{seats}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase">Bus No.</span>
              <span className="text-[11px] font-mono font-bold text-emerald-400">{busReg}</span>
            </div>
          </div>

          {/* Compact OTP Verification */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-xl p-2 sm:p-2.5 text-center relative shadow-md flex items-center justify-between px-3">
            <div>
              <span className="text-[9px] uppercase font-mono font-extrabold tracking-widest text-emerald-400 block text-left">Verification OTP</span>
              <span className="text-xl font-mono font-black text-white tracking-[0.25em]">{otp}</span>
            </div>
            <button
              onClick={handleCopyOtp}
              className="text-[10px] text-emerald-300 hover:text-white flex items-center gap-1 font-bold bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Dynamic QR Generator (Compact Size 160) */}
          <DynamicQrGenerator
            data={ticket}
            size={160}
            pnr={pnr}
            passengerName={passengerName}
            route={`${fromCity} ➔ ${toCity}`}
            subtitle="Official Conductor Boarding Token"
          />

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-rose-400" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => {
                onClose();
                if (onBackToDashboard) onBackToDashboard();
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QrTicketModal;
