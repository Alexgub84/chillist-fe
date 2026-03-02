import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import type { ReactNode } from 'react';

type ColorScheme = 'amber' | 'blue';

const colorMap: Record<
  ColorScheme,
  {
    border: string;
    hoverBorder: string;
    iconBg: string;
    hoverIconBg: string;
    hoverText: string;
    hoverChevron: string;
  }
> = {
  amber: {
    border: 'border-amber-100',
    hoverBorder: 'hover:border-amber-300',
    iconBg: 'bg-amber-50',
    hoverIconBg: 'group-hover:bg-amber-100',
    hoverText: 'group-hover:text-amber-700',
    hoverChevron: 'group-hover:text-amber-500',
  },
  blue: {
    border: 'border-blue-100',
    hoverBorder: 'hover:border-blue-300',
    iconBg: 'bg-blue-50',
    hoverIconBg: 'group-hover:bg-blue-100',
    hoverText: 'group-hover:text-blue-700',
    hoverChevron: 'group-hover:text-blue-500',
  },
};

interface SectionLinkProps {
  to: string;
  params?: Record<string, string>;
  icon: ReactNode;
  title: string;
  subtitle: string;
  colorScheme: ColorScheme;
  testId?: string;
  className?: string;
}

export default function SectionLink({
  to,
  params,
  icon,
  title,
  subtitle,
  colorScheme,
  testId,
  className,
}: SectionLinkProps) {
  const colors = colorMap[colorScheme];

  return (
    <Link
      to={to}
      params={params}
      data-testid={testId}
      className={clsx(
        'block bg-white rounded-lg shadow-sm border hover:shadow-md transition-all p-4 sm:p-5 group',
        colors.border,
        colors.hoverBorder,
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors',
            colors.iconBg,
            colors.hoverIconBg
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p
            className={clsx(
              'text-sm sm:text-base font-semibold text-gray-800 transition-colors',
              colors.hoverText
            )}
          >
            {title}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
        </div>
        <svg
          className={clsx(
            'w-5 h-5 text-gray-400 ms-auto shrink-0 transition-colors',
            colors.hoverChevron
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
