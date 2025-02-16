import { Component, ErrorInfo, ReactNode } from 'react';

    interface Props {
        children: ReactNode;
    }

    interface State {
        hasError: boolean;
    }

    export class GenericErrorBoundary extends Component<Props, State> {
        state = { hasError: false };

        static getDerivedStateFromError(_: Error): State {
            return { hasError: true };
        }

        componentDidCatch(error: Error, info: ErrorInfo) {
            console.error('Component Crash:', error, info);
        }

        render() {
            if (this.state.hasError) {
                return (
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                        <h3 className="font-bold">Something went wrong.</h3>
                        <p>An unexpected error occurred. Please refresh the page or try again later.</p>
                    </div>
                );
            }
            return this.props.children;
        }
    }
