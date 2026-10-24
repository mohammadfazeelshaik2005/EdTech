import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8',
        align === 'center' && 'text-center md:items-center justify-center',
        className
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-primary uppercase mb-2">
            <span className="text-sm">•</span>
            <span>{eyebrow}</span>
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold text-charcoal tracking-tight mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-base text-slate-muted leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
