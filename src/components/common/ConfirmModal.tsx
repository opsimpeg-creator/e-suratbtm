import React from 'react';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  itemDetails?: {
    label: string;
    value: string;
    isBadge?: boolean;
    badgeColor?: string;
  }[];
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message = 'Tindakan ini tidak dapat dibatalkan.',
  confirmText = 'Ya, Hapus Data',
  cancelText = 'Batal',
  variant = 'danger',
  itemDetails,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with decorative top bar */}
        <div
          className={`h-2.5 w-full ${
            isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
          }`}
        />

        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon badge */}
            <div
              className={`p-3 rounded-2xl shrink-0 flex items-center justify-center ${
                isDanger
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : isWarning
                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                  : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}
            >
              {isDanger ? (
                <Trash2 className="w-6 h-6" />
              ) : isWarning ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition shrink-0"
              title="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Optional item preview card */}
          {itemDetails && itemDetails.length > 0 && (
            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
              {itemDetails.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-semibold">{item.label}</span>
                  {item.isBadge ? (
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                        item.badgeColor || 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.value}
                    </span>
                  ) : (
                    <span className="font-bold text-slate-800 truncate max-w-[200px]">
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition shadow-2xs"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white transition flex items-center gap-2 shadow-xs ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                  : isWarning
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  {isDanger && <Trash2 className="w-4 h-4" />}
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
