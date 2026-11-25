import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Неизвестная ошибка интерфейса'
    };
  }

  public override componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Error captured in state for fallback details
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <h1 className="text-lg font-bold text-slate-900 font-display">Что-то пошло не так</h1>
            <p className="text-sm text-slate-600">
              Произошла непредвиденная ошибка при отображении интерфейса LiveCut Studio.
            </p>
            <details className="text-xs text-slate-600 bg-slate-50 rounded-md p-3">
              <summary className="cursor-pointer font-medium text-slate-800">Подробности ошибки</summary>
              <pre className="mt-2 font-mono whitespace-pre-wrap break-words text-red-700">
                {this.state.errorMessage}
              </pre>
            </details>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
