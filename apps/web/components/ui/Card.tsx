import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-md-surface-container rounded-[24px] p-6 shadow-sm border border-md-outline/10 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
        interactive
          ? "hover:shadow-md hover:scale-[1.01] hover:bg-md-surface-container-low/50 cursor-pointer active:scale-[0.99]"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
export default Card;
