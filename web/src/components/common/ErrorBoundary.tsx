import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside Yazem Vault:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/app';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center shadow-md mb-4 select-none">
            <span className="font-extrabold text-2xl tracking-tighter">
              Y<span className="text-sky-400">.</span>
            </span>
          </div>
          <div className="max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 text-rose-500 mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              Something went wrong
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              We encountered an unexpected error while rendering this view.
              {this.state.error?.message ? ` (${this.state.error.message})` : ''}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Vault</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

