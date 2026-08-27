import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div id="toast-container" className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            id={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
              toast.type === 'success'
                ? 'bg-zinc-900/95 border-amber-500/40 text-zinc-100'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/40 text-red-100'
                : 'bg-zinc-900/95 border-zinc-700 text-zinc-200'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button
              id={`close-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
