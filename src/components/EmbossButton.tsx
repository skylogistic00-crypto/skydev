import React from "react";
import { cn } from "@/lib/utils";

interface EmbossButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "danger";
  size?: "sm" | "md" | "lg";
}

const EmbossButton = ({ 
  children, 
  variant = "primary", 
  size = "md",
  className,
  ...props 
}: EmbossButtonProps) => {
  const baseStyles = `
    relative
    font-semibold
    rounded-xl
    transition-all
    duration-200
    ease-in-out
    cursor-pointer
    select-none
    overflow-hidden
    
    /* Emboss effect - outer shadow */
    shadow-[0_8px_16px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)]
    
    /* Hover effect */
    hover:shadow-[0_12px_24px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15)]
    hover:-translate-y-0.5
    
    /* Active/Pressed effect */
    active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.15)]
    active:translate-y-0.5
    active:scale-[0.98]
    
    /* Disabled state */
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:translate-y-0
    disabled:active:translate-y-0
    disabled:active:scale-100
  `;

  const variantStyles = {
    primary: `
      bg-gradient-to-br from-blue-500 to-blue-600
      text-white
      border-t-2 border-l-2 border-blue-400
      border-b-2 border-r-2 border-blue-700
      hover:from-blue-600 hover:to-blue-700
      active:from-blue-700 active:to-blue-800
    `,
    secondary: `
      bg-gradient-to-br from-slate-400 to-slate-500
      text-white
      border-t-2 border-l-2 border-slate-300
      border-b-2 border-r-2 border-slate-600
      hover:from-slate-500 hover:to-slate-600
      active:from-slate-600 active:to-slate-700
    `,
    success: `
      bg-gradient-to-br from-green-500 to-green-600
      text-white
      border-t-2 border-l-2 border-green-400
      border-b-2 border-r-2 border-green-700
      hover:from-green-600 hover:to-green-700
      active:from-green-700 active:to-green-800
    `,
    danger: `
      bg-gradient-to-br from-red-500 to-red-600
      text-white
      border-t-2 border-l-2 border-red-400
      border-b-2 border-r-2 border-red-700
      hover:from-red-600 hover:to-red-700
      active:from-red-700 active:to-red-800
    `,
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {/* Inner highlight for emboss effect */}
      <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-xl" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

export default EmbossButton;
