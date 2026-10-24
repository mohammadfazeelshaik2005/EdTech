import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'forest' | 'alternate';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'rounded-lg transition-all duration-200 relative overflow-hidden';

    const variants = {
      default:
        'bg-surface border border-border-default shadow-sm',
      interactive:
        'bg-surface border border-border-default shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-primary-border',
      forest:
        'bg-gradient-to-br from-forest to-[#0B4D40] text-white border border-white/10 shadow-xl',
      alternate:
        'bg-alternate border border-border-default shadow-xs',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn('flex items-center justify-between gap-3 mb-4', className)}
    {...props}
  />
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('space-y-2', className)} {...props} />;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border-subtle',
      className
    )}
    {...props}
  />
);
