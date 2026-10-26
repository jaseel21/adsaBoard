import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    if (typeof window !== 'undefined') {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (_) {}
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.hasError && this.state.hasError) {
      if (typeof window !== 'undefined') {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        } catch (_) {}
      }
    }
  }

  handleSoftRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          ref={(el) => {
            if (el && typeof window !== 'undefined') {
              try {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } catch (_) {}
            }
          }}
          className="min-h-[75vh] w-full flex items-center justify-center p-4 xs:p-6 sm:p-8"
        >
          <div className="max-w-md w-full rounded-3xl bg-white/95 dark:bg-[#0f1715]/95 border border-red-200/80 dark:border-red-500/20 shadow-2xl backdrop-blur-xl p-6 sm:p-8 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shadow-md">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Something went wrong
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                An unexpected display error occurred while rendering this view. Your saved data is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-left overflow-x-auto text-[11px] font-mono text-rose-600 dark:text-rose-400 max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleSoftRecover}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recover View</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 font-bold text-xs transition-all active:scale-95"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={this.handleReload}
                className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline transition-colors"
              >
                Force Browser Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
