import React from 'react';
import { X, Check, Info, AlertTriangle, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastComponentProps {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  onDismiss?: (id: string) => void;
}

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success':
      return <Check className="h-4 w-4 text-green-400" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-400" />;
  }
};

const getToastClasses = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return 'bg-green-500/10 border-green-500/20 text-green-300';
    case 'error':
      return 'bg-red-500/10 border-red-500/20 text-red-300';
    case 'warning':
      return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300';
    case 'info':
    default:
      return 'bg-blue-500/10 border-blue-500/20 text-blue-300';
  }
};

export const Toast: React.FC<ToastComponentProps> = ({
  id,
  title,
  description,
  type = 'info',
  onDismiss,
}) => {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 shadow-md ${getToastClasses(
        type
      )}`}
      role="alert"
    >
      <div className="mt-0.5">
        <ToastIcon type={type} />
      </div>
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        {description && <p className="mt-1 text-sm opacity-80">{description}</p>}
      </div>
      <button
        onClick={() => onDismiss?.(id)}
        className="text-gray-400 hover:text-white"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{
  toasts: ToastComponentProps[];
  onDismiss?: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};