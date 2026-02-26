import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';

export interface CollapsibleSectionProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  children: React.ReactNode;
  wrapperClassName?: string;
  buttonClassName?: string;
  panelClassName?: string;
  buttonAs?: 'div' | 'button';
  panelContentClassName?: string;
  chevronClassName?: string;
}

const DEFAULT_CHEVRON_CLASS =
  'w-5 h-5 text-gray-500 transition-transform group-data-open:rotate-180';

const DEFAULT_BUTTON_CLASS =
  'group w-full px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors';
const DEFAULT_PANEL_CLASS =
  'origin-top transition duration-200 ease-out data-closed:-translate-y-6 data-closed:opacity-0';

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || DEFAULT_CHEVRON_CLASS}
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
  );
}

export default function CollapsibleSection({
  title,
  defaultOpen = true,
  forceOpen = false,
  children,
  wrapperClassName,
  buttonClassName = DEFAULT_BUTTON_CLASS,
  panelClassName = DEFAULT_PANEL_CLASS,
  buttonAs = 'button',
  panelContentClassName,
  chevronClassName,
}: CollapsibleSectionProps) {
  if (forceOpen) {
    return (
      <div className={wrapperClassName}>
        <div className={buttonClassName}>
          {title}
          <ChevronIcon className={chevronClassName} />
        </div>
        <div className={panelClassName}>
          {panelContentClassName ? (
            <div className={panelContentClassName}>{children}</div>
          ) : (
            children
          )}
        </div>
      </div>
    );
  }

  return (
    <Disclosure as="div" defaultOpen={defaultOpen} className={wrapperClassName}>
      <DisclosureButton as={buttonAs} className={buttonClassName}>
        {title}
        <ChevronIcon className={chevronClassName} />
      </DisclosureButton>
      <DisclosurePanel transition className={panelClassName}>
        {panelContentClassName ? (
          <div className={panelContentClassName}>{children}</div>
        ) : (
          children
        )}
      </DisclosurePanel>
    </Disclosure>
  );
}
