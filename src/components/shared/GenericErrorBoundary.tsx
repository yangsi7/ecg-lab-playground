import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * @deprecated Use ErrorBoundary instead. This component will be removed in a future version.
 * Migration guide:
 * Replace:
 *   <GenericErrorBoundary>
 * With:
 *   <ErrorBoundary showRetry compact={false}>
 */
export const GenericErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ErrorBoundary showRetry compact={false}>
            {children}
        </ErrorBoundary>
    );
}; 