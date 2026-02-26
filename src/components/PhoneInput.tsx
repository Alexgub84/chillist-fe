import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import clsx from 'clsx';
import { countryCodes, getFlagEmoji } from '../data/country-codes';
import { useLanguage } from '../contexts/useLanguage';
import { FormInput } from './shared/FormInput';

export interface PhoneInputProps {
  countryProps: SelectHTMLAttributes<HTMLSelectElement>;
  phoneProps: InputHTMLAttributes<HTMLInputElement>;
  countrySelectAriaLabel: string;
  phoneCountryDefaultLabel: string;
  phonePlaceholder?: string;
  compact?: boolean;
  hasLabel?: boolean;
  error?: string;
  className?: string;
}

export function PhoneInput({
  countryProps,
  phoneProps,
  countrySelectAriaLabel,
  phoneCountryDefaultLabel,
  phonePlaceholder,
  compact = false,
  hasLabel = true,
  error,
  className,
}: PhoneInputProps) {
  const { language } = useLanguage();
  const isRtl = language === 'he';
  return (
    <div className={className}>
      <div
        className={clsx('flex gap-2 rtl:flex-row-reverse', hasLabel && 'mt-1')}
      >
        <select
          {...countryProps}
          aria-label={countrySelectAriaLabel}
          className="w-[140px] shrink-0 rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">{phoneCountryDefaultLabel}</option>
          {countryCodes.map((c) => (
            <option key={c.code} value={c.code}>
              {getFlagEmoji(c.code)} {c.dialCode}
            </option>
          ))}
        </select>
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
