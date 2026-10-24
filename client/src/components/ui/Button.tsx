import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      pill = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed disabled:pointer-events-none active:translate-y-0';

    const variants = {
      primary:
        'bg-primary text-white hover:bg-primary-hover shadow-brand hover:shadow-brand-hover hover:-translate-y-0.5',
      secondary:
        'bg-primary-subtle text-primary border border-primary-border hover:bg-[#DEF2EB] hover:text-primary-hover',
      outline:
        'bg-transparent text-primary border border-primary hover:bg-primary-subtle',
      ghost:
        'bg-transparent text-slate-muted hover:bg-subtle hover:text-charcoal',
      dark:
        'bg-charcoal text-white hover:bg-[#1E293B]',
      light:
        'bg-white text-primary border border-white/40 shadow-sm hover:bg-alternate hover:text-primary-hover',
    };

    const sizes = {
      sm: pill ? 'text-xs px-3.5 py-1.5 gap-1.5' : 'text-xs px-3 py-1.5 rounded-sm gap-1.5',
      md: pill ? 'text-sm px-5 py-2.5 gap-2' : 'text-sm px-4 py-2.5 rounded-md gap-2',
      lg: pill ? 'text-base px-7 py-3.5 gap-2.5' : 'text-base px-6 py-3.5 rounded-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          pill && 'rounded-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
