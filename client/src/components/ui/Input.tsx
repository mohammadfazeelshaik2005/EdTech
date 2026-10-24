import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  pill?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      pill = false,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-charcoal flex items-center justify-between"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-subtle pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full text-sm text-charcoal bg-canvas border border-border-default placeholder:text-slate-border outline-none transition-all duration-150 py-2.5 px-3.5 shadow-xs',
              pill ? 'rounded-full px-5' : 'rounded-md',
              leftIcon && (pill ? 'pl-11' : 'pl-10'),
              rightIcon && (pill ? 'pr-11' : 'pr-10'),
              'hover:border-border-strong focus:border-primary focus:ring-3 focus:ring-primary/15',
              error && 'border-danger! ring-3! ring-danger/15!',
              disabled && 'bg-subtle text-slate-border cursor-not-allowed border-border-subtle',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-slate-subtle flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <span
            className={cn(
              'text-xs mt-0.5',
              error ? 'text-danger font-medium' : 'text-slate-subtle'
            )}
          >
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, id, ...props }, ref) => {
    const areaId = id || React.useId();

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={areaId}
            className="text-xs font-semibold text-charcoal"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          className={cn(
            'w-full text-sm text-charcoal bg-canvas border border-border-default placeholder:text-slate-border rounded-md outline-none transition-all duration-150 p-3 min-h-[96px] shadow-xs',
            'hover:border-border-strong focus:border-primary focus:ring-3 focus:ring-primary/15',
            error && 'border-danger! ring-3! ring-danger/15!',
            className
          )}
          {...props}
        />
        {(error || helperText) && (
          <span
            className={cn(
              'text-xs mt-0.5',
              error ? 'text-danger font-medium' : 'text-slate-subtle'
            )}
          >
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, error, id, children, ...props }, ref) => {
    const selectId = id || React.useId();

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-charcoal"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full text-sm text-charcoal bg-canvas border border-border-default rounded-md outline-none transition-all duration-150 py-2.5 px-3.5 pr-9 shadow-xs cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748B\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center] bg-[length:16px_16px]',
            'hover:border-border-strong focus:border-primary focus:ring-3 focus:ring-primary/15',
            error && 'border-danger! ring-3! ring-danger/15!',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {(error || helperText) && (
          <span
            className={cn(
              'text-xs mt-0.5',
              error ? 'text-danger font-medium' : 'text-slate-subtle'
            )}
          >
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
