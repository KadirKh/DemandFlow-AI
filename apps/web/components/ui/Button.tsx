import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "tonal" | "outlined" | "ghost" | "fab";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "filled",
  className = "",
  children,
  ...props
}) => {
  let baseStyles = "inline-flex items-center justify-center font-mono uppercase tracking-wider font-bold transition-all duration-150 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary/50 focus-visible:ring-offset-2 active:translate-y-[2px] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer select-none";
  
  let variantStyles = "";
  
  switch (variant) {
    case "filled":
      // Braun safety orange tactile key
      variantStyles = "bg-[var(--color-md-primary)] text-white border border-[rgba(255,255,255,0.15)] rounded-md px-6 py-3 text-xs shadow-[4px_4px_8px_rgba(255,71,87,0.3),-2px_-2px_4px_#ffffff] hover:brightness-105 active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.2)]";
      break;
    case "tonal":
      // Sunken status toggle or light gray chassis switch
      variantStyles = "bg-[var(--color-md-background)] text-[var(--color-md-on-background)] rounded-md px-6 py-3 text-xs shadow-[var(--shadow-card)] hover:bg-[var(--color-md-surface-container)] active:shadow-[var(--shadow-pressed)]";
      break;
    case "outlined":
      // Technical mounting plate outline
      variantStyles = "border border-[var(--color-md-outline)] text-[var(--color-md-on-background)] bg-transparent rounded-md px-6 py-3 text-xs shadow-[var(--shadow-card)] hover:bg-[var(--color-md-surface-container)] active:shadow-[var(--shadow-pressed)]";
      break;
    case "ghost":
      // Embedded flat label key
      variantStyles = "text-[var(--color-md-on-surface-variant)] bg-transparent rounded-md px-4 py-2.5 text-xs hover:bg-[var(--color-md-surface-container-low)] active:shadow-[var(--shadow-pressed)]";
      break;
    case "fab":
      // Big mechanical launch actuator
      variantStyles = "bg-[var(--color-md-primary)] text-white rounded-full h-14 w-14 shadow-[var(--shadow-floating)] border border-[rgba(255,255,255,0.2)] hover:scale-105 active:shadow-[var(--shadow-pressed)]";
      break;
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
export default Button;

