import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'mint' | 'neutral' | 'warning' | 'danger' | 'info' | 'dark';
  pill?: boolean;
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'brand',
      pill = true,
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide border select-none whitespace-nowrap';

    const variants = {
      brand:
        'bg-primary-subtle text-primary border-primary-muted',
      mint:
        'bg-mint-subtle text-success border-success/30',
      neutral:
        'bg-subtle text-slate-muted border-border-default',
      warning:
        'bg-warning-subtle text-warning border-warning/30',
      danger:
        'bg-danger-subtle text-danger border-danger/30',
      info:
        'bg-info-subtle text-info border-info/30',
      dark:
        'bg-white/15 text-white border-white/25 backdrop-blur-xs',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          pill ? 'rounded-full px-3 py-1' : 'rounded-sm px-2.5 py-0.5',
          className
        )}
        {...props}
      >
        {dot && (
          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
