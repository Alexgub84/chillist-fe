import { useState, useMemo } from 'react';
import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  ComboboxButton,
} from '@headlessui/react';
import {
  countryCodes,
  getFlagEmoji,
  type CountryCode,
} from '../data/country-codes';
import { useLanguage } from '../contexts/useLanguage';
import { FormInput } from './shared/FormInput';

const MAX_RESULTS = 12;

export interface PhoneInputProps {
  countryValue: string;
  onCountryChange: (code: string) => void;
  phoneProps: InputHTMLAttributes<HTMLInputElement>;
  countrySelectAriaLabel: string;
  phonePlaceholder?: string;
  compact?: boolean;
  hasLabel?: boolean;
  error?: string;
  className?: string;
}

function matchCountry(country: CountryCode, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  return (
    country.name.toLowerCase().includes(q) ||
    country.dialCode.includes(q) ||
    country.code.toLowerCase() === q
  );
}

export function PhoneInput({
  countryValue,
  onCountryChange,
  phoneProps,
  countrySelectAriaLabel,
  phonePlaceholder,
  compact = false,
  hasLabel = true,
  error,
  className,
}: PhoneInputProps) {
  const { language } = useLanguage();
  const isRtl = language === 'he';
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => countryCodes.find((c) => c.code === countryValue) ?? null,
    [countryValue]
  );

  const filtered = useMemo(() => {
    if (!query) return countryCodes.slice(0, MAX_RESULTS);
    return countryCodes
      .filter((c) => matchCountry(c, query))
      .slice(0, MAX_RESULTS);
  }, [query]);

  return (
    <div className={className}>
      <div
        className={clsx('flex gap-2 rtl:flex-row-reverse', hasLabel && 'mt-1')}
      >
        <Combobox
          value={selected}
          onChange={(c: CountryCode | null) => onCountryChange(c?.code ?? '')}
          onClose={() => setQuery('')}
        >
          <div className="relative w-[160px] shrink-0">
            <ComboboxInput
              aria-label={countrySelectAriaLabel}
              displayValue={(c: CountryCode | null) =>
                c ? `${getFlagEmoji(c.code)} ${c.dialCode}` : ''
              }
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none pr-7"
              autoComplete="off"
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-1.5">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </ComboboxButton>

            <ComboboxOptions
              anchor="bottom start"
              className="w-[280px] rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto empty:invisible z-50 origin-top transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0"
            >
              {filtered.map((c) => (
                <ComboboxOption
                  key={c.code}
                  value={c}
                  className="px-3 py-2 cursor-pointer text-sm text-gray-700 data-focus:bg-blue-50 data-focus:text-blue-700 flex items-center gap-2"
                >
                  <span className="shrink-0">{getFlagEmoji(c.code)}</span>
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto text-gray-400 shrink-0 text-xs">
                    {c.dialCode}
                  </span>
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          </div>
        </Combobox>

        <FormInput
          type="tel"
          autoComplete="tel-national"
          {...phoneProps}
          placeholder={phonePlaceholder}
          compact={compact}
          dir={isRtl ? 'rtl' : 'ltr'}
          className={clsx('flex-1', phoneProps.className)}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
