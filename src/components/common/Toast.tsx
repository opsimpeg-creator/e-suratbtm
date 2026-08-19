import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    error: 'bg-rose-50 border-rose-200 text-rose-950',
    info: 'bg-blue-50 border-blue-200 text-blue-950',
    warning: 'bg-amber-50 border-amber-200 text-amber-950',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4">
      <div className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all ${bgStyles[type]}`}>
        {icons[type]}
        <div className="flex-1 text-xs">
          <h4 className="font-bold text-sm leading-snug">{title}</h4>
          {message && <p className="mt-0.5 opacity-90 leading-relaxed">{message}</p>}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

