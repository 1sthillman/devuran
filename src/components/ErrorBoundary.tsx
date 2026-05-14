import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

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
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--void)]">
          <div className="max-w-md w-full bg-[var(--slate-surface)] border border-[var(--obsidian-rim)] rounded-3xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--error)]/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-[var(--error)]" />
            </div>
            <h1 className="font-display font-bold text-2xl text-[var(--chrome-white)] mb-3">
              Bir Hata Oluştu
            </h1>
            <p className="font-body text-[var(--muted-lead)] mb-6">
              Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
            </p>
            {this.state.error && (
              <div className="mb-6 p-4 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-left">
                <p className="font-mono text-xs text-[var(--muted-lead)] break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full h-12 rounded-full bg-[var(--liquid-chrome)] text-[var(--void)] font-heading font-medium hover:opacity-90 transition-opacity"
            >
              Anasayfaya Dön
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

