import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

interface InlineQuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  disabled?: boolean;
  className?: string;
}

export default function InlineQuantityInput({
  value,
  onChange,
  min = 1,
  disabled,
  className,
}: InlineQuantityInputProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.select();
    }
  }, [editing]);

  function startEditing() {
    if (disabled) return;
    setDraft(String(value));
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const parsed = parseInt(draft, 10);
    if (!Number.isNaN(parsed) && parsed >= min && parsed !== value) {
      onChange(parsed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        min={min}
        step={1}
        autoFocus
        className={clsx(
          'w-12 px-1 py-0 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center',
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      disabled={disabled}
      className={clsx(
        'cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded hover:bg-gray-100 px-1',
        disabled && 'cursor-default',
        className
      )}
    >
      {value}
    </button>
  );
}
