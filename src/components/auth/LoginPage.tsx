import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/hooks';
import { useAuth } from '@/hooks/api/core/useAuth';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';

const LoginPage: React.FC = () => {
    const { user, isLoading, error } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from?.pathname || '/';

    React.useEffect(() => {
        if (user) {
            navigate(from, { replace: true });
        }
    }, [user, navigate, from]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
                <div className="max-w-md w-full space-y-8">
                    <div className="flex flex-col items-center justify-center p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
                        <h2 className="text-lg font-semibold text-red-400 mb-2">Authentication Error</h2>
                        <p className="text-sm text-red-300 text-center max-w-md">
                            {error.message}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Welcome to ECG Lab
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Please sign in to continue
                    </p>
                </div>
                
                <div className="mt-8 bg-white/5 backdrop-blur-xl p-8 rounded-xl border border-white/10">
                    <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: '#3B82F6',
                                        brandAccent: '#2563EB',
                                        inputBackground: 'rgba(255, 255, 255, 0.05)',
                                        inputText: 'white',
                                        inputPlaceholder: 'rgba(255, 255, 255, 0.5)',
                                        inputBorder: 'rgba(255, 255, 255, 0.1)',
                                        inputBorderHover: 'rgba(255, 255, 255, 0.2)',
                                        inputBorderFocus: 'rgba(59, 130, 246, 0.5)',
                                    },
                                },
                            },
                            className: {
                                container: 'text-white',
                                label: 'text-gray-300',
                                button: 'bg-blue-600 hover:bg-blue-700 text-white',
                                input: 'bg-white/5 border-white/10',
                            },
                        }}
                        theme="dark"
                        providers={['github']}
                    />
                </div>
            </div>
        </div>
    );
};

export default LoginPage; 