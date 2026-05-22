import React from "react";

export const GlowOverlay: React.FC = () => {
  return (
    <>
      {/* Matte micro-noise plastic texture overlay */}
      <div className="industrial-noise" aria-hidden="true" />
      
      {/* Dynamic industrial elements and grids */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none blueprint-grid">
        {/* Diffuse workshop lighting hotspot (Top Left) */}
        <div 
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/20 dark:bg-white/5 blur-[120px]"
          aria-hidden="true"
        />
        {/* Soft Braun ambient glow in center-right */}
        <div 
          className="absolute top-[30%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[var(--color-md-primary)]/3 dark:bg-[var(--color-md-primary)]/1 blur-[100px]"
          aria-hidden="true"
        />
      </div>
    </>
  );
};
export default GlowOverlay;

