import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const inputId = id || React.useId();
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const describedBy = [errorId, hintId, ariaDescribedBy].filter(Boolean).join(' ') || undefined;

    return (
      <div>
        {label && <label htmlFor={inputId} className="mb-1.5 block text-sm text-slate-300">{label}</label>}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-slate-100 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40',
            error && 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/40',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-errormessage={errorId}
          {...props}
        />
        {error && <p id={errorId} className="mt-1.5 text-sm text-rose-400" role="alert">{error}</p>}
        {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-slate-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
