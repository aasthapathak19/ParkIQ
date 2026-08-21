import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 p-8">
          <div className="glass rounded-2xl p-10 max-w-md w-full text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
            <p className="text-neutral-400 text-sm">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              className="btn-primary mx-auto"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
