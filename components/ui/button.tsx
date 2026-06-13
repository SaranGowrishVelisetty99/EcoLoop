import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default: 'bg-brand-500 text-slate-950 hover:bg-brand-400',
        outline: 'border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10',
        ghost: 'bg-transparent text-slate-100 hover:bg-white/8',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-11 px-3',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, 'aria-label': ariaLabel, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;
    const buttonProps = {
      className: cn(buttonVariants({ variant, size, className })),
      ref,
      ...props,
    };
    if (!asChild) {
      Object.assign(buttonProps, {
        disabled: isDisabled,
        'aria-disabled': isDisabled,
        'aria-busy': loading,
        'aria-label': ariaLabel,
      });
    }
    return (
      <Comp {...buttonProps}>
        {!asChild && loading && <span className="mr-2" aria-hidden="true">⏳</span>}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
