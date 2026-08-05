import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: LucideIcon;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}

export function Button({ 
  children, 
  variant = 'primary', 
  icon: Icon, 
  className = '', 
  onClick,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium spring-transition border";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700",
    ghost: "bg-transparent hover:bg-zinc-800 text-zinc-300 border-transparent",
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} strokeWidth={1.5} />}
      {children}
    </button>
  );
}

interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
  active?: boolean;
}

export function IconButton({ icon: Icon, onClick, className = '', active = false }: IconButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`p-1.5 rounded-md spring-transition flex items-center justify-center
        ${active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'} 
        ${className}`}
    >
      <Icon size={16} strokeWidth={1.5} />
    </button>
  );
}
