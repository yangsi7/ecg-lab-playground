import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  className?: string;
  showRetry?: boolean;
  compact?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component Error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { fallback, className, showRetry = false, compact = true } = this.props;

    if (this.state.hasError) {
      if (fallback) {
        return fallback;
      }

      if (compact) {
        return (
          <div className={`p-4 bg-red-500/10 border border-red-500/20 rounded-xl ${className || ''}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-400">
                  Something went wrong
                </h3>
                <p className="mt-1 text-sm text-red-300">
                  {this.state.error?.message || 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
                </p>
                {showRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="mt-2 px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-colors"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className={`min-h-[200px] flex flex-col items-center justify-center p-6 rounded-lg bg-red-500/10 border border-red-500/20 ${className || ''}`}>
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-red-400 mb-2">Something went wrong</h2>
          <p className="text-red-300/80 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {showRetry && (
            <button
              onClick={this.handleRetry}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
} 