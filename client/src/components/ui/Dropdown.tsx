import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  isDivider?: boolean;
  isActive?: boolean;
}

export interface DropdownProps {
  trigger?: React.ReactNode;
  label?: string;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  label = 'Options',
  items,
  align = 'left',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-charcoal bg-surface border border-border-default rounded-full hover:border-primary-border transition-colors cursor-pointer shadow-xs"
        >
          <span>{label}</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-200 text-slate-subtle',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      )}

      {isOpen && (
        <div
          className={cn(
            'absolute top-[calc(100%+6px)] min-w-[200px] p-1.5 bg-surface border border-border-default rounded-lg shadow-lg z-50 flex flex-col gap-0.5 animate-in fade-in-0 zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, idx) => {
            if (item.isDivider) {
              return (
                <div
                  key={`div-${idx}`}
                  className="h-px bg-border-subtle my-1"
                />
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-sm text-left transition-colors cursor-pointer',
                  item.isActive
                    ? 'bg-primary-subtle text-primary font-semibold'
                    : 'text-charcoal hover:bg-primary-subtle hover:text-primary'
                )}
              >
                {item.icon && (
                  <span className="shrink-0 text-slate-subtle">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
