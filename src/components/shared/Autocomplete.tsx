import { useState } from 'react';
import clsx from 'clsx';
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';

const MAX_RESULTS = 8;

interface AutocompleteProps {
  items: string[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  filterFn?: (item: string, query: string) => boolean;
}

export default function Autocomplete({
  items,
  value,
  onChange,
  onSelect,
  placeholder,
  compact = false,
  filterFn,
}: AutocompleteProps) {
  const [query, setQuery] = useState('');

  const defaultFilter = (item: string, q: string) =>
    item.toLowerCase().includes(q.toLowerCase());

  const matchFn = filterFn ?? defaultFilter;

  const filtered =
    query.length > 0
      ? items.filter((item) => matchFn(item, query)).slice(0, MAX_RESULTS)
      : [];

  const inputStyles = clsx(
    'w-full px-3 sm:px-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition',
    compact ? 'py-2' : 'py-2 sm:py-3'
  );

  return (
    <Combobox
      value={value}
      onChange={(selected: string) => {
        onChange(selected);
        onSelect(selected);
      }}
      onClose={() => setQuery('')}
    >
      <ComboboxInput
        displayValue={(v: string) => v}
        onChange={(e) => {
          const text = e.target.value;
          setQuery(text);
          onChange(text);
        }}
        placeholder={placeholder}
        className={inputStyles}
        autoComplete="off"
      />

      <ComboboxOptions
        anchor="bottom start"
        transition
        className="w-(--input-width) rounded-lg border border-gray-200 bg-white shadow-lg empty:invisible origin-top transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0"
      >
        {filtered.map((item) => (
          <ComboboxOption
            key={item}
            value={item}
            className="px-3 sm:px-4 py-2.5 sm:py-2 cursor-pointer text-sm sm:text-base text-gray-700 data-focus:bg-blue-50 data-focus:text-blue-700"
          >
            {item}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}
