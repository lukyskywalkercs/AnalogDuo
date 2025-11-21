import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 rounded-full font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-white text-black hover:bg-gray-200 shadow-lg",
    secondary: "bg-gray-800 text-white hover:bg-gray-700",
    outline: "border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm",
    ghost: "text-white hover:bg-white/10",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};