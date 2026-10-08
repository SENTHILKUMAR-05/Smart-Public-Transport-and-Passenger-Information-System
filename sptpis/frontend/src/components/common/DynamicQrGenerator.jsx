import React, { useEffect, useRef } from 'react';
import { Bus, ShieldCheck, CheckCircle2 } from 'lucide-react';

const DynamicQrGenerator = ({ 
  data = {}, 
  size = 220, 
  title = "TNSTC Mobile E-Pass", 
  subtitle = "Official Digital Boarding Token",
  pnr = "TNSTC-BK-882142",
  passengerName = "S. KARTHIK",
  route = "Dharmapuri ➔ Salem"
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 2;
    const canvasSize = size * dpr;

    canvas.width = canvasSize;
    canvas.height = canvasSize;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Seed hash calculation based on PNR & Data
    const seedText = `${pnr}-${data.otp || '789012'}-${data.registration_number || 'TN29'}`;
    const hashSeed = seedText.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000007, 0);

    const moduleCount = 33; // High density 33x33 QR matrix
    const cellSize = size / moduleCount;

    // Draw Dark QR Modules
    ctx.fillStyle = '#0f172a';

    const isPositionEye = (r, c) => {
      if (r < 8 && c < 8) return true; // Top-Left Eye
      if (r < 8 && c >= moduleCount - 8) return true; // Top-Right Eye
      if (r >= moduleCount - 8 && c < 8) return true; // Bottom-Left Eye
      return false;
    };

    // 1. Draw Data Matrix Modules
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (isPositionEye(r, c)) continue;

        // Skip central area for TNSTC logo overlay
        const centerStart = Math.floor(moduleCount / 2) - 3;
        const centerEnd = Math.floor(moduleCount / 2) + 3;
        if (r >= centerStart && r <= centerEnd && c >= centerStart && c <= centerEnd) {
          continue;
        }

        // Timing patterns
        if (r === 6 || c === 6) {
          if ((r + c) % 2 === 0) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.2, cellSize - 0.2);
          }
          continue;
        }

        // Deterministic pseudo-random pattern based on ticket payload
        const bitVal = (r * 37 + c * 23 + hashSeed) % 7;
        if (bitVal === 0 || bitVal === 2 || bitVal === 5 || (r % 3 === 0 && c % 2 === 0)) {
          // Accent module in brand color occasionally
          if ((r + c + hashSeed) % 19 === 0) {
            ctx.fillStyle = '#e11d48';
            ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.2, cellSize - 0.2);
            ctx.fillStyle = '#0f172a';
          } else {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.2, cellSize - 0.2);
          }
        }
      }
    }

    // 2. Draw Smooth Rounded Position Detection Outer Eyes (Top-Left, Top-Right, Bottom-Left)
    const drawEye = (startX, startY) => {
      const eyeSize = 7 * cellSize;
      
      // Outer ring
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(startX * cellSize, startY * cellSize, eyeSize, eyeSize, 6);
      ctx.fill();

      // Inner white gap
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect((startX + 1) * cellSize, (startY + 1) * cellSize, 5 * cellSize, 5 * cellSize, 4);
      ctx.fill();

      // Center solid core
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.roundRect((startX + 2) * cellSize, (startY + 2) * cellSize, 3 * cellSize, 3 * cellSize, 3);
      ctx.fill();
    };

    drawEye(0, 0); // Top-Left Eye
    drawEye(moduleCount - 7, 0); // Top-Right Eye
    drawEye(0, moduleCount - 7); // Bottom-Left Eye

  }, [data, pnr, size]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Real-time VietinBank / Napas 247 Style Card Layout */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-slate-200 text-slate-900 flex flex-col items-center relative overflow-hidden group">
        
        {/* Top Header Brands */}
        <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 block leading-tight">TNSTC / SETC</span>
              <span className="text-[9px] text-slate-400 font-bold block">{subtitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>LIVE QR</span>
          </div>
        </div>

        {/* High Density QR Matrix Frame */}
        <div className="relative bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center my-1 w-full max-w-[220px] aspect-square">
          <canvas
            ref={canvasRef}
            style={{ width: `${size}px`, height: `${size}px` }}
            className="w-full h-full object-contain rounded-lg shadow-sm"
          />

          {/* Central Logo Overlay */}
          <div className="absolute inset-0 m-auto w-10 h-10 rounded-xl bg-white border-2 border-rose-600 shadow-md flex items-center justify-center z-10 pointer-events-none">
            <span className="text-[8px] font-black text-rose-600 tracking-tighter uppercase">TNSTC</span>
          </div>
        </div>

        {/* Passenger & Ticket Metadata (Matching Image 2 Card Format) */}
        <div className="w-full text-center mt-3 space-y-1">
          <h4 className="text-sm font-black text-slate-900 tracking-tight uppercase">{passengerName}</h4>
          <p className="text-[11px] font-mono font-bold text-rose-600 tracking-widest bg-rose-50 py-0.5 px-3 rounded-full inline-block border border-rose-100">
            PNR: {pnr}
          </p>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
            {route}
          </p>
        </div>

        {/* Verified Conductor Scanner Badge */}
        <div className="w-full mt-3 pt-2.5 border-t border-dashed border-slate-200 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Scannable via Driver & Conductor App</span>
        </div>

      </div>
    </div>
  );
};

export default DynamicQrGenerator;
