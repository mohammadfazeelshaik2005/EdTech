import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'busy' | 'away';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  initials,
  size = 'md',
  status,
  className,
  ...props
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const statusColors = {
    online: 'bg-mint',
    busy: 'bg-danger',
    away: 'bg-warning',
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-primary-subtle text-primary font-semibold select-none shrink-0 overflow-visible',
        sizes[size],
        className
      )}
      {...props}
    >
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span>{initials || 'PS'}</span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface',
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  limit?: number;
  total?: number;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center -space-x-2 [&>*]:border-2 [&>*]:border-surface [&>*]:shadow-xs',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
