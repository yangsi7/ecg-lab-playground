import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from './toast';
import { ToastOptions } from './use-toast';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem extends ToastOptions {
  id: string;
}

export interface ToastContextType {
  toast: (props: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((props: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      id,
      title: props.title,
      description: props.description,
      type: props.type || 'info',
      duration: props.duration || 5000,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Automatically remove toast after duration
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
    }, newToast.duration);

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};