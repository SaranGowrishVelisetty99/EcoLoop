import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'neutral';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-brand-500/30 bg-brand-500/10 text-brand-100',
    success: 'border-green-500/30 bg-green-500/10 text-green-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    error: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    neutral: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  };
  return (
    <span
      className={cn('rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]', variants[variant], className)}
      {...props}
    />
  );
}
