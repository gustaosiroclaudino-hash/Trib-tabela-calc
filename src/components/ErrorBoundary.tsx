import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro não tratado:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleResetCache = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0e17',
          color: '#e2e8f0',
          fontFamily: "'Inter', sans-serif",
          padding: '1.5rem'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#111827',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '0.75rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={32} color="#ef4444" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f87171' }}>
                  Ocorreu um erro ao carregar a aplicação
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  TribCalc Reforma • Recuperação Segura
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              Pode ter ocorrido uma divergência de versão nos dados salvos anteriormente no seu navegador ou um erro de inicialização.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: '#030712',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.8rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#fca5a5',
                maxHeight: '160px',
                overflowY: 'auto',
                marginBottom: '1.5rem',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} />
                <span>Recarregar Página</span>
              </button>

              <button
                onClick={this.handleResetCache}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={16} />
                <span>Limpar Cache Local & Reiniciar</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
