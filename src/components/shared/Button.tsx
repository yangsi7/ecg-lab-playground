/**
 * src/components/shared/Button.tsx
 * 
 * A reusable button component with different variants and sizes
 */

import React, { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50';
  
  // Variant styles
  const variantStyles: Record<Variant, string> = {
    default: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50',
    ghost: 'bg-transparent hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  
  // Size styles
  const sizeStyles: Record<Size, string> = {
    sm: 'h-8 px-3 text-xs rounded',
    md: 'h-10 px-4 text-sm rounded-md',
    lg: 'h-12 px-6 text-base rounded-md'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
} 