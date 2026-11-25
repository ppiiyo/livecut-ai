import { Component, ErrorInfo, ReactNode } from 'react';
import { parseStoredPipelineState, serializeStateWithoutSecrets, STORAGE_KEY } from '../utils/storage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
  copiedReport: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
    errorStack: '',
    copiedReport: false
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error.message || 'Неизвестная ошибка интерфейса',
      errorStack: error.stack || ''
    };
  }

  public override componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Error captured in state for fallback details and optional bug report copy
  }

  private handleCopyReport = async () => {
    let safeStateJson = '(empty)';
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const sanitized = parseStoredPipelineState(raw);
        safeStateJson = serializeStateWithoutSecrets(sanitized);
      }
    } catch {
      safeStateJson = '(unavailable)';
    }

    const report = [
      'LiveCut Studio Error Report',
      `Time: ${new Date().toISOString()}`,
      `Message: ${this.state.errorMessage}`,
      this.state.errorStack ? `Stack:\n${this.state.errorStack}` : '',
      `SanitizedState (no secrets):\n${safeStateJson}`
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(report);
      this.setState({ copiedReport: true });
      setTimeout(() => this.setState({ copiedReport: false }), 2000);
    } catch {
      this.setState({ copiedReport: false });
    }
  };

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
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={this.handleCopyReport}
                className="flex-1 py-2 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {this.state.copiedReport ? 'Отчёт скопирован' : 'Скопировать отчёт'}
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-2 px-4 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Перезагрузить
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
