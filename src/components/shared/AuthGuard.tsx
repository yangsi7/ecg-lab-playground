import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/api/core/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

interface AuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    
    // TEMPORARY: Development bypass for authentication
    // This allows us to test the application without having to authenticate
    // Remove this in production
    const isDevelopment = import.meta.env.DEV;
    if (isDevelopment) {
        console.log('Development mode: Bypassing authentication');
        return <>{children}</>;
    }

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        // Redirect to login page with return URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
