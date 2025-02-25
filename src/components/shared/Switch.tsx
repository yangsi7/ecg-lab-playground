/**
 * src/components/shared/Switch.tsx
 * 
 * A simple toggle switch component for boolean inputs
 */

import { ChangeEvent } from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
}

export function Switch({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  className = '',
  id,
  name,
  'aria-label': ariaLabel,
  ...rest
}: SwitchProps) {
  // Size mappings
  const sizeClasses = {
    sm: {
      switch: 'w-8 h-4',
      knob: 'w-3 h-3',
      translate: 'translate-x-4'
    },
    md: {
      switch: 'w-10 h-5',
      knob: 'w-4 h-4',
      translate: 'translate-x-5'
    },
    lg: {
      switch: 'w-12 h-6',
      knob: 'w-5 h-5',
      translate: 'translate-x-6'
    }
  };

  const { switch: switchClass, knob: knobClass, translate } = sizeClasses[size];

  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        id={id}
        name={name}
        aria-label={ariaLabel}
        {...rest}
      />
      <div className={`relative ${switchClass} rounded-full transition-colors duration-200 ease-in-out bg-gray-200 ${checked ? 'bg-blue-500' : ''}`}>
        <div
          className={`absolute left-0.5 top-0.5 ${knobClass} rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
            checked ? translate : 'translate-x-0'
          }`}
        ></div>
      </div>
    </label>
  );
} 