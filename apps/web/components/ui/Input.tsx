import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  className = "",
  id,
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-md-on-surface-variant)] px-1 select-none font-mono">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`h-12 w-full bg-[var(--color-md-background)] text-[var(--color-md-on-background)] px-4 rounded-md border-none font-mono text-xs shadow-[var(--shadow-recessed)] focus:outline-none focus:shadow-[inset_2px_2px_4px_#babecc,inset_-2px_-2px_4px_#ffffff,0_0_0_2px_#ff4757] transition-all duration-150 placeholder:text-[var(--color-md-on-surface-variant)]/40 ${className}`}
        {...props}
      />
    </div>
  );
};
export default Input;

