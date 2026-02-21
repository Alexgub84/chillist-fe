import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import clsx from 'clsx';

interface InlineSelectOption<T extends string> {
  value: T;
  label: string;
}

interface InlineSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: InlineSelectOption<T>[];
  disabled?: boolean;
  buttonClassName?: string;
  ariaLabel?: string;
}

export default function InlineSelect<T extends string>({
  value,
  onChange,
  options,
  disabled,
  buttonClassName,
  ariaLabel,
}: InlineSelectProps<T>) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <ListboxButton
        onClick={() =>
          console.log('[InlineSelect] CLICKED:', {
            value,
            disabled,
            ariaLabel,
          })
        }
        className={clsx(
          'cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded',
          disabled && 'cursor-default opacity-60',
          buttonClassName
        )}
        aria-label={ariaLabel}
      >
        {selectedOption?.label ?? value}
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        transition
        className="z-10 mt-1 min-w-32 rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none origin-top transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0"
      >
        {options.map((opt) => (
          <ListboxOption
            key={opt.value}
            value={opt.value}
            className="cursor-pointer select-none px-3 py-2 text-sm transition-colors data-focus:bg-gray-100 data-selected:font-semibold"
          >
            {opt.label}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
