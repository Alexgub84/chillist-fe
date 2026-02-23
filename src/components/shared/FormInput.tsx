import clsx from 'clsx';
import {
  forwardRef,
  type InputHTMLAttributes,
  type MouseEvent,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

const pickerTypes = new Set([
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
]);

const baseInputStyles =
  'w-full bg-white px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const compactInputStyles =
  'w-full bg-white px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

export const FormInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { compact?: boolean }
>(({ className, compact, onClick, ...props }, ref) => {
  const styles = compact ? compactInputStyles : baseInputStyles;
  const hasPicker = pickerTypes.has(props.type ?? '');

  function handleClick(e: MouseEvent<HTMLInputElement>) {
    if (hasPicker) {
      try {
        e.currentTarget.showPicker();
      } catch {
        /* showPicker() may throw in non-user-gesture contexts */
      }
    }
    onClick?.(e);
  }

  return (
    <input
      ref={ref}
      className={clsx(styles, hasPicker && 'cursor-pointer', className)}
      onClick={handleClick}
      {...props}
    />
  );
});

FormInput.displayName = 'FormInput';

export const FormTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={clsx(baseInputStyles, 'resize-none', className)}
      {...props}
    />
  );
});

FormTextarea.displayName = 'FormTextarea';

export const FormSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { compact?: boolean }
>(({ className, children, compact, ...props }, ref) => {
  const styles = compact ? compactInputStyles : baseInputStyles;
  return (
    <select ref={ref} className={clsx(styles, className)} {...props}>
      {children}
    </select>
  );
});

FormSelect.displayName = 'FormSelect';
