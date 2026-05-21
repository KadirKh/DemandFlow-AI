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
  let baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";
  
  let variantStyles = "";
  
  switch (variant) {
    case "filled":
      variantStyles = "bg-md-primary text-md-on-primary rounded-full px-6 py-2.5 shadow-sm hover:shadow-md hover:bg-md-primary/95";
      break;
    case "tonal":
      variantStyles = "bg-md-secondary-container text-md-on-secondary-container rounded-full px-6 py-2.5 hover:bg-md-secondary-container/90";
      break;
    case "outlined":
      variantStyles = "border border-md-outline text-md-primary bg-transparent rounded-full px-6 py-2.5 hover:bg-md-primary/5";
      break;
    case "ghost":
      variantStyles = "text-md-primary bg-transparent rounded-full px-4 py-2 hover:bg-md-primary/10";
      break;
    case "fab":
      variantStyles = "bg-md-tertiary text-white rounded-2xl h-14 w-14 shadow-md hover:shadow-xl hover:bg-md-tertiary/90 hover:scale-105 active:scale-95";
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
