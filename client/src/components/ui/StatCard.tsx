import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  value: React.ReactNode;
  label: string;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: 'light' | 'dark';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  subtext,
  icon,
  trend,
  variant = 'light',
  className,
}) => {
  const isDark = variant === 'dark';

  return (
    <div
      className={cn(
        'p-5 rounded-lg border transition-all duration-200 flex items-center gap-4',
        isDark
          ? 'bg-white/10 border-white/15 text-white backdrop-blur-md'
          : 'bg-surface border-border-default text-charcoal shadow-sm hover:shadow-md hover:border-primary-border hover:-translate-y-0.5',
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'w-13 h-13 rounded-md flex items-center justify-center shrink-0 text-2xl',
            isDark
              ? 'bg-white/15 text-mint'
              : 'bg-primary-subtle text-primary'
          )}
        >
          {icon}
        </div>
      )}

      <div className="flex flex-col min-w-0">
        <div
          className={cn(
            'text-2xl font-extrabold tracking-tight leading-tight',
            isDark ? 'text-white' : 'text-charcoal'
          )}
        >
          {value}
        </div>
        <div
          className={cn(
            'text-sm font-medium mt-0.5 truncate',
            isDark ? 'text-slate-200' : 'text-slate-muted'
          )}
        >
          {label}
        </div>
        {subtext && (
          <div
            className={cn(
              'text-xs mt-0.5',
              isDark ? 'text-mint' : 'text-slate-subtle'
            )}
          >
            {subtext}
          </div>
        )}
        {trend && (
          <div
            className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold mt-1',
              trend.isPositive !== false ? 'text-success' : 'text-danger'
            )}
          >
            {trend.isPositive !== false ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};
