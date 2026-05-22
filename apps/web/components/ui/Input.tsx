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
    <div className="w-full flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-md-on-surface-variant px-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`h-12 w-full bg-md-surface-container-low text-md-on-background px-4 rounded-t-xl rounded-b-none border-b-2 border-md-outline focus:border-md-primary focus:outline-none transition-colors duration-200 placeholder:text-md-on-surface-variant/40 ${className}`}
        {...props}
      />
    </div>
  );
};
export default Input;
