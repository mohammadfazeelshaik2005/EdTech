import React from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-12 bg-surface border border-dashed border-border-strong rounded-xl max-w-lg mx-auto',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-primary-subtle text-primary flex items-center justify-center mb-4 text-2xl">
        {icon || <Search className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-charcoal mb-1.5">{title}</h3>
      <p className="text-sm text-slate-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <Button variant="primary" pill onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
