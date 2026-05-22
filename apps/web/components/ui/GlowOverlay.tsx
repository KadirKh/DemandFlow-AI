import React from "react";

export const GlowOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none">
      {/* Dynamic blurred organic shapes with MD3 theme colors */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-md-secondary-container/30 blur-[100px] animate-float-slow"
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-md-primary/10 blur-[120px] animate-float-medium"
        aria-hidden="true"
      />
      <div 
        className="absolute top-[40%] right-[15%] w-[35%] h-[35%] rounded-full bg-md-tertiary/10 blur-[90px] animate-float-slow"
        aria-hidden="true"
      />
    </div>
  );
};
export default GlowOverlay;
