'use client';

import React from 'react';
import { useToastStore } from '@/stores/useToastStore';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-soft-lg border backdrop-blur-md transition-all transform animate-in slide-in-from-top-4 duration-200',
            toast.type === 'success' && 'bg-white/95 border-emerald-200 text-emerald-950',
            toast.type === 'error' && 'bg-white/95 border-rose-200 text-rose-950',
            toast.type === 'warning' && 'bg-white/95 border-amber-200 text-amber-950',
            toast.type === 'info' && 'bg-white/95 border-indigo-200 text-indigo-950'
          )}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-600" />}
          </div>

          <div className="flex-1 min-w-0">
            {toast.title && <p className="text-sm font-semibold mb-0.5">{toast.title}</p>}
            <p className="text-xs text-slate-600 leading-relaxed">{toast.message}</p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
