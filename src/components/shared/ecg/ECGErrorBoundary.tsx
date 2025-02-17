import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ECGErrorBoundary extends Component<Props, State> {
    state = { hasError: false };

    static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ECG Component Crash:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                    <h3 className="font-bold">ECG Display Error</h3>
                    <p>Failed to render ECG visualization. Please refresh the page.</p>
                </div>
            );
        }
        return this.props.children;
    }
}
