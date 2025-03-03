// Re-export the useToast hook and types from toast-provider
export { useToast, type ToastContextType, type ToastOptions, type ToastType } from './toast-provider';

// This file now just re-exports the context-based implementation
// to ensure consistent behavior across the application.