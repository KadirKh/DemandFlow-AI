"use client";

import React, { useEffect, useState } from "react";
import { Settings, Cpu, Database, Activity, Box } from "lucide-react";

export const ConveyorAnimation: React.FC = () => {
  const [tickerLogs, setTickerLogs] = useState<string[]>([
    "SYS.INIT: OK",
    "NET.PORT.08: ACTIVE",
    "AI.MODEL.REGRESS: STABLE"
  ]);
  const [packagesPassed, setPackagesPassed] = useState(1248);

  useEffect(() => {
    const logs = [
      "SKU-4912 DETECTED - ROUTING TO W1",
      "REORDER POINT TRIGGERED FOR SKU-8802",
      "ML DEMAND ACCURACY UPDATE: 94.2%",
      "OPTIMIZING DISPATCH CHANNEL 4",
      "PULLING INVENTORY TELEMETRY FROM SITE B",
      "SYSTEM RATIO: 1.18 [OPTIMAL]",
      "SAFETY STOCK CRITICAL: SKU-1102"
    ];

    const interval = setInterval(() => {
      // Add a random log to our ticker
      const randomLog = logs[Math.floor(Math.random() * logs.length)];
      const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
      
      setTickerLogs((prev) => {
        const updated = [...prev, `[${timestamp}] ${randomLog}`];
        if (updated.length > 5) updated.shift();
        return updated;
      });

      // Increment package counter
      setPackagesPassed((prev) => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Outer physical console chassis box */}
      <div className="bg-[var(--color-md-surface-container)] p-5 rounded-2xl shadow-[var(--shadow-card)] border border-[rgba(255,255,255,0.4)] relative">
        {/* Bolt detailing */}
        <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-[var(--color-md-outline)] opacity-20 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]" />
        <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[var(--color-md-outline)] opacity-20 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]" />
        <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-[var(--color-md-outline)] opacity-20 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]" />
        <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[var(--color-md-outline)] opacity-20 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]" />

        {/* Panel Labels (stamped label feel) */}
        <div className="flex justify-between items-center mb-3 select-none">
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase font-bold tracking-widest text-[var(--color-md-on-surface-variant)]">
            <Cpu className="w-3.5 h-3.5 text-[var(--color-md-primary)] animate-pulse" />
            <span>Manufacturing Flow Monitor v1.0</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Pulsing Status LED */}
            <span className="w-2 h-2 rounded-full bg-green-500 text-green-500 animate-led shadow-[var(--shadow-glow-green)]" />
            <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-green-600">SYS_RUNNING</span>
          </div>
        </div>

        {/* Simulated CRT Monitor Well */}
        <div className="crt-screen rounded-lg p-4 h-64 relative flex flex-col justify-between border-2 border-[var(--color-md-outline)]">
          {/* CRT scanlines overlay inside style */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.05)_0%,transparent_80%)] pointer-events-none" />

          {/* Top Section: Mechanical gears & laser cogs */}
          <div className="flex justify-between items-start z-20">
            {/* Turning Cogs */}
            <div className="flex gap-2 bg-black/40 p-2 rounded border border-green-950/40">
              <svg className="w-8 h-8 text-green-500 animate-gear-spin opacity-80" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 35c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm0 24c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z" />
                <path d="M92 46h-7.3c-.6-3-1.8-5.7-3.5-8.2l5.2-5.2c1.2-1.2 1.2-3.1 0-4.2l-5.6-5.6c-1.2-1.2-3.1-1.2-4.2 0l-5.2 5.2c-2.5-1.7-5.2-2.9-8.2-3.5V12c0-1.7-1.3-3-3-3h-8c-1.7 0-3 1.3-3 3v7.3c-3 .6-5.7 1.8-8.2 3.5l-5.2-5.2c-1.2-1.2-3.1-1.2-4.2 0l-5.6 5.6c-1.2 1.2-1.2 3.1 0 4.2l5.2 5.2c-1.7 2.5-2.9 5.2-3.5 8.2H8c-1.7 0-3 1.3-3 3v8c0 1.7 1.3 3 3 3h7.3c.6 3 1.8 5.7 3.5 8.2l-5.2 5.2c-1.2 1.2-1.2 3.1 0 4.2l5.6 5.6c1.2 1.2 3.1 1.2 4.2 0l5.2-5.2c2.5 1.7 5.2 2.9 8.2 3.5V88c0 1.7 1.3 3 3 3h8c1.7 0 3-1.3 3-3v-7.3c3-.6 5.7-1.8 8.2-3.5l5.2 5.2c1.2 1.2 3.1 1.2 4.2 0l5.6-5.6c1.2-1.2 1.2-3.1 0-4.2l-5.2-5.2c1.7-2.5 2.9-5.2 3.5-8.2H92c1.7 0 3-1.3 3-3v-8c0-1.7-1.3-3-3-3z" />
              </svg>
              <svg className="w-5 h-5 text-green-500 animate-gear-spin-reverse opacity-60 mt-2" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 35c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm0 24c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z" />
                <path d="M92 46h-7.3c-.6-3-1.8-5.7-3.5-8.2l5.2-5.2c1.2-1.2 1.2-3.1 0-4.2l-5.6-5.6c-1.2-1.2-3.1-1.2-4.2 0l-5.2 5.2c-2.5-1.7-5.2-2.9-8.2-3.5V12c0-1.7-1.3-3-3-3h-8c-1.7 0-3 1.3-3 3v7.3c-3 .6-5.7 1.8-8.2 3.5l-5.2-5.2c-1.2-1.2-3.1-1.2-4.2 0l-5.6 5.6c-1.2 1.2-1.2 3.1 0 4.2l5.2 5.2c-1.7 2.5-2.9 5.2-3.5 8.2H8c-1.7 0-3 1.3-3 3v8c0 1.7 1.3 3 3 3h7.3c.6 3 1.8 5.7 3.5 8.2l-5.2 5.2c-1.2 1.2-1.2 3.1 0 4.2l5.6 5.6c1.2 1.2 3.1 1.2 4.2 0l5.2-5.2c2.5 1.7 5.2 2.9 8.2 3.5V88c0 1.7 1.3 3 3 3h8c1.7 0 3-1.3 3-3v-7.3c3-.6 5.7-1.8 8.2-3.5l5.2 5.2c1.2 1.2 3.1 1.2 4.2 0l5.6-5.6c1.2-1.2 1.2-3.1 0-4.2l-5.2-5.2c1.7-2.5 2.9-5.2 3.5-8.2H92c1.7 0 3-1.3 3-3v-8c0-1.7-1.3-3-3-3z" />
              </svg>
            </div>

            {/* Live Stats display box */}
            <div className="text-right font-mono text-[9px] text-green-400 bg-black/40 p-2 rounded border border-green-950/40 select-none">
              <div>DISPATCHED: {packagesPassed}</div>
              <div>THROUGHPUT: 42 u/m</div>
              <div>TEMP: 32.4°C [OK]</div>
            </div>
          </div>

          {/* Middle Section: Robotic arm & Conveyor Belt animation */}
          <div className="relative h-20 w-full z-10 border-b border-green-900/30">
            {/* Orange Robotic Sorting Arm */}
            <div className="absolute top-0 right-1/4 w-12 h-14 origin-top pointer-events-none select-none z-20">
              {/* Arm Joint Structure */}
              <svg className="w-full h-full text-[var(--color-md-primary)]" viewBox="0 0 100 120" fill="currentColor">
                {/* Mount */}
                <rect x="35" y="0" width="30" height="20" rx="3" className="text-gray-700" />
                {/* Arm segment 1 */}
                <line x1="50" y1="20" x2="35" y2="70" stroke="currentColor" strokeWidth="8" />
                <circle cx="50" cy="20" r="8" className="text-gray-800" />
                {/* Joint */}
                <circle cx="35" cy="70" r="6" className="text-gray-800" />
                {/* Arm segment 2 */}
                <line x1="35" y1="70" x2="60" y2="100" stroke="currentColor" strokeWidth="6" />
                <circle cx="60" cy="100" r="4" className="text-gray-800" />
                {/* Scanner nozzle */}
                <polygon points="55,100 65,100 60,110" className="text-red-500" />
              </svg>
              
              {/* Pulsing red laser scan sweep */}
              <div className="absolute top-[35px] left-[16px] w-[8px] h-[55px] bg-gradient-to-b from-red-600/40 to-transparent blur-[1px] animate-laser origin-top" />
            </div>

            {/* Conveyor track */}
            <div className="absolute bottom-1.5 left-0 w-full h-2.5 bg-green-950/60 rounded-full border border-green-900/50 overflow-hidden flex items-center">
              <div className="w-[200%] h-1 flex gap-1.5 animate-conveyor shrink-0">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1 bg-green-700/60 rounded-full" />
                ))}
              </div>
            </div>

            {/* Crate boxes sliding along conveyor */}
            <div className="absolute bottom-4 left-0 w-full h-8 overflow-hidden pointer-events-none select-none">
              <div className="flex gap-24 items-end pl-8 w-[200%] animate-conveyor">
                {/* Box 1 */}
                <div className="w-8 h-7 bg-amber-800/10 border border-green-800/60 rounded-sm p-0.5 flex flex-col justify-between shrink-0 relative shadow-[0_0_8px_rgba(34,197,94,0.15)]">
                  <div className="w-full h-1 bg-green-800/30 rounded-xs" />
                  <div className="flex gap-0.5 items-end justify-center">
                    <Box className="w-4.5 h-4.5 text-green-500/80" />
                  </div>
                  <span className="font-mono text-[5px] text-green-500/50 absolute top-2 right-1 scale-75">W1</span>
                </div>

                {/* Box 2 */}
                <div className="w-8 h-7 bg-amber-800/10 border border-green-800/60 rounded-sm p-0.5 flex flex-col justify-between shrink-0 relative shadow-[0_0_8px_rgba(34,197,94,0.15)]">
                  <div className="w-full h-1 bg-green-800/30 rounded-xs" />
                  <div className="flex gap-0.5 items-end justify-center">
                    <Box className="w-4.5 h-4.5 text-green-500/80" />
                  </div>
                  <span className="font-mono text-[5px] text-green-500/50 absolute top-2 right-1 scale-75">W2</span>
                </div>

                {/* Box 3 */}
                <div className="w-8 h-7 bg-amber-800/10 border border-green-800/60 rounded-sm p-0.5 flex flex-col justify-between shrink-0 relative shadow-[0_0_8px_rgba(34,197,94,0.15)]">
                  <div className="w-full h-1 bg-green-800/30 rounded-xs" />
                  <div className="flex gap-0.5 items-end justify-center">
                    <Box className="w-4.5 h-4.5 text-green-500/80" />
                  </div>
                  <span className="font-mono text-[5px] text-green-500/50 absolute top-2 right-1 scale-75">W3</span>
                </div>

                {/* Box 4 */}
                <div className="w-8 h-7 bg-amber-800/10 border border-green-800/60 rounded-sm p-0.5 flex flex-col justify-between shrink-0 relative shadow-[0_0_8px_rgba(34,197,94,0.15)]">
                  <div className="w-full h-1 bg-green-800/30 rounded-xs" />
                  <div className="flex gap-0.5 items-end justify-center">
                    <Box className="w-4.5 h-4.5 text-green-500/80" />
                  </div>
                  <span className="font-mono text-[5px] text-green-500/50 absolute top-2 right-1 scale-75">W1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Monospace Telemetry Ticker */}
          <div className="w-full bg-black/60 rounded p-1.5 border border-green-950/60 font-mono text-[8px] text-green-400 select-none z-10 flex flex-col gap-0.5 h-16 overflow-hidden">
            {tickerLogs.map((log, index) => (
              <div key={index} className="truncate tracking-wider opacity-85">
                <span className="text-green-600 font-bold">&gt;&gt;</span> {log}
              </div>
            ))}
          </div>
        </div>

        {/* Small physical switches decoration beneath screen */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-[rgba(255,255,255,0.1)] select-none">
          <div className="flex gap-2">
            <div className="w-5 h-2.5 rounded-sm bg-[var(--color-md-outline)] shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)] flex items-center justify-center">
              <div className="w-2.5 h-1 bg-[var(--color-md-surface-container)] rounded-xs" />
            </div>
            <div className="w-5 h-2.5 rounded-sm bg-[var(--color-md-outline)] shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)] flex items-center justify-start pl-0.5">
              <div className="w-2.5 h-1 bg-[var(--color-md-primary)] rounded-xs" />
            </div>
          </div>
          <div className="flex gap-2 text-[8px] font-mono font-bold uppercase text-[var(--color-md-on-surface-variant)]">
            <span className="flex items-center gap-1"><Database size={10} /> LINK_A: ON</span>
            <span className="flex items-center gap-1"><Activity size={10} /> SCAN_B: OK</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ConveyorAnimation;
