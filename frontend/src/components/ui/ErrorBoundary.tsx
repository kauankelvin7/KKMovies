/* KKMovies — Error Boundary & Error Message */
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  handleRetry = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <AlertTriangle className="w-12 h-12 text-kf-accent mb-4" />
          <h2 className="text-xl font-semibold mb-2">Algo deu errado</h2>
          <p className="text-kf-text-secondary mb-6 max-w-md">
            Ocorreu um erro inesperado. Tente novamente.
          </p>
          <button onClick={this.handleRetry} className="btn-primary">
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* Inline error message for API failures */
export const ErrorMessage: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Erro ao carregar dados.',
  onRetry,
}) => (
  <div role="alert" className="min-h-[60vh] flex flex-col items-center justify-center pt-32 pb-16 px-4 text-center">
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6"><AlertTriangle className="w-8 h-8 text-violet-300" /></div>
    <h1 className="text-2xl font-medium mb-3">Vamos tentar mais uma vez?</h1>
    <p className="text-kf-text-secondary mb-6 max-w-md text-sm leading-relaxed">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary text-sm px-4 py-2">
        <RefreshCw className="w-4 h-4 mr-1 inline" />
        Tentar novamente
      </button>
    )}
  </div>
);
