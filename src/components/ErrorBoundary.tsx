import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ErrorDisplay: React.FC<{ error: Error | null }> = ({ error }) => {
  const { t, isRTL } = useLanguage();
  let errorMessage = t('errorSubtitle');
  let isFirestoreError = false;

  try {
    if (error?.message) {
      const parsed = JSON.parse(error.message);
      if (parsed.error && parsed.operationType) {
        errorMessage = t('firestoreError')
          .replace('{error}', parsed.error)
          .replace('{op}', parsed.operationType)
          .replace('{path}', parsed.path || 'unknown');
        isFirestoreError = true;
      }
    }
  } catch (e) {
    errorMessage = error?.message || errorMessage;
  }

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-red-100 shadow-sm text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-6">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-zinc-900 mb-2">{t('errorTitle')}</h2>
      <p className="text-zinc-500 max-w-md mb-8 leading-relaxed">
        {errorMessage}
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all"
      >
        <RefreshCw size={20} />
        {t('refreshPage')}
      </button>
      
      {isFirestoreError && (
        <div className="mt-8 p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-left max-w-lg overflow-auto">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{t('technicalDetails')}</p>
          <pre className="text-[10px] text-zinc-600 font-mono whitespace-pre-wrap">
            {error?.message}
          </pre>
        </div>
      )}
    </div>
  );
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} />;
    }

    return this.props.children;
  }
}
