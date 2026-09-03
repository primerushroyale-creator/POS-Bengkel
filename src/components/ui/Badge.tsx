import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline' | 'jasa' | 'barang';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        variant === 'primary' && 'bg-indigo-50 border-indigo-200 text-indigo-700',
        variant === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-700',
        variant === 'warning' && 'bg-amber-50 border-amber-200 text-amber-700',
        variant === 'danger' && 'bg-rose-50 border-rose-200 text-rose-700',
        variant === 'neutral' && 'bg-slate-100 border-slate-200 text-slate-700',
        variant === 'outline' && 'bg-transparent border-slate-300 text-slate-600',
        variant === 'jasa' && 'bg-purple-50 border-purple-200 text-purple-700',
        variant === 'barang' && 'bg-blue-50 border-blue-200 text-blue-700',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
