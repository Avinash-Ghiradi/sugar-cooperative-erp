import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      return (
        <div className="p-6 bg-slate-900 border border-rose-800 rounded-2xl text-slate-100 max-w-xl mx-auto my-8 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h3 className="text-base font-bold">ದೋಷ ಸಂಭವಿಸಿದೆ (Component Error)</h3>
          </div>
          <p className="text-xs text-slate-300">
            {this.state.error?.message || 'An unexpected error occurred while loading this view.'}
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again (ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ)
            </button>
            {this.props.onClose && (
              <button
                onClick={this.props.onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <X className="w-3.5 h-3.5" /> Close (ಮುಚ್ಚಿ)
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
