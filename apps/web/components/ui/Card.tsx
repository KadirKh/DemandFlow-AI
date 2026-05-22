import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  hasScrews?: boolean;
  hasVents?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  hasScrews = true,
  hasVents = true,
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-[var(--color-md-surface-container)] rounded-xl p-6 shadow-[var(--shadow-card)] border border-[rgba(255,255,255,0.4)] dark:border-[rgba(255,255,255,0.03)] relative overflow-hidden transition-all duration-150 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
        interactive
          ? "hover:shadow-[var(--shadow-floating)] hover:-translate-y-1 cursor-pointer active:translate-y-0 active:shadow-[var(--shadow-card)]"
          : ""
      } ${className}`}
      {...props}
    >
      {/* Metallic Corner Screws (Skeuomorphic realism) */}
      {hasScrews && (
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
          {/* Top-Left */}
          <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-[var(--color-md-outline)] opacity-30 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] flex items-center justify-center">
            <div className="w-[8px] h-[1px] bg-[var(--color-md-background)] transform rotate-45" />
          </div>
          {/* Top-Right */}
          <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-[var(--color-md-outline)] opacity-30 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] flex items-center justify-center">
            <div className="w-[8px] h-[1px] bg-[var(--color-md-background)] transform -rotate-45" />
          </div>
          {/* Bottom-Left */}
          <div className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full bg-[var(--color-md-outline)] opacity-30 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] flex items-center justify-center">
            <div className="w-[8px] h-[1px] bg-[var(--color-md-background)] transform -rotate-45" />
          </div>
          {/* Bottom-Right */}
          <div className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full bg-[var(--color-md-outline)] opacity-30 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] flex items-center justify-center">
            <div className="w-[8px] h-[1px] bg-[var(--color-md-background)] transform rotate-45" />
          </div>
        </div>
      )}

      {/* Heat Ventilation Grills (Top Right) */}
      {hasVents && (
        <div className="absolute top-3.5 right-8 flex gap-1 pointer-events-none select-none opacity-20" aria-hidden="true">
          <div className="w-1 h-3 rounded-full bg-[var(--color-md-outline)] shadow-[inset_1px_1px_1px_rgba(0,0,0,0.2)]" />
          <div className="w-1 h-3 rounded-full bg-[var(--color-md-outline)] shadow-[inset_1px_1px_1px_rgba(0,0,0,0.2)]" />
          <div className="w-1 h-3 rounded-full bg-[var(--color-md-outline)] shadow-[inset_1px_1px_1px_rgba(0,0,0,0.2)]" />
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        {children}
      </div>
    </div>
  );
};
export default Card;

