import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/useAuth';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_META,
  type AppLanguage,
} from '../contexts/language-context';
import { useLanguage } from '../contexts/useLanguage';

function getUserDisplayName(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}): string {
  const meta = user.user_metadata ?? {};
  if (meta.first_name) return meta.first_name as string;
  if (meta.full_name) return (meta.full_name as string).split(' ')[0];
  return user.email?.split('@')[0] ?? '';
}

function getUserInitials(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}): string {
  const meta = user.user_metadata ?? {};
  const first = (meta.first_name as string) ?? '';
  const last = (meta.last_name as string) ?? '';
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (meta.full_name) {
    const parts = (meta.full_name as string).trim().split(/\s+/);
    return parts
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return (user.email?.[0] ?? '?').toUpperCase();
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMobileLangOpen, setIsMobileLangOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const { user, loading, signOut, isAdmin } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const currentMeta = LANGUAGE_META[language];

  function selectLanguage(lang: AppLanguage) {
    setLanguage(lang);
    setIsLangMenuOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(e.target as Node)
      ) {
        setIsLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between py-2 sm:py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-semibold text-gray-900"
          >
            <img
              src="/logo-icon.png"
              alt="Chillist"
              className="h-8 w-8 sm:h-9 sm:w-9"
            />
            <span>Chillist</span>
          </Link>

          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              if (isMenuOpen) setIsMobileLangOpen(false);
            }}
            className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-6">
            <ul className="flex gap-6 list-none m-0 p-0">
              <li>
                <Link
                  to="/plans"
                  className="block px-3 py-2 text-base sm:text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {t('nav.plans')}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="block px-3 py-2 text-base sm:text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {t('nav.about')}
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link
                    to="/admin/last-updated"
                    className="block px-3 py-2 text-base sm:text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Last Updated
                  </Link>
                </li>
              )}
            </ul>

            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                data-testid="lang-toggle"
                className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                aria-expanded={isLangMenuOpen}
              >
                <span>{currentMeta.nativeLabel}</span>
                <span className="text-gray-400">
                  {currentMeta.currencySymbol}
                </span>
                <svg
                  className="h-4 w-4 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isLangMenuOpen && (
                <div className="absolute end-0 mt-1 w-44 rounded-lg bg-white shadow-lg ring-1 ring-black/5 z-50 py-1">
                  {SUPPORTED_LANGUAGES.map((code) => {
                    const meta = LANGUAGE_META[code];
                    return (
                      <button
                        key={code}
                        onClick={() => selectLanguage(code)}
                        data-testid={`lang-option-${code}`}
                        className={clsx(
                          'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors',
                          code === language
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        <span>{meta.nativeLabel}</span>
                        <span className="text-gray-400">
                          {meta.currencySymbol}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {!loading && (
              <>
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="User menu"
                      aria-expanded={isUserMenuOpen}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                        {getUserInitials(user)}
                      </span>
                      <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[140px] truncate">
                        {getUserDisplayName(user)}
                      </span>
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute end-0 mt-2 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black/5 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p
                            className="text-sm font-medium text-gray-900"
                            data-testid="menu-display-name"
                          >
                            {getUserDisplayName(user) || t('auth.userFallback')}
                          </p>
                          <p
                            className="text-xs text-gray-500 truncate mt-0.5"
                            data-testid="menu-email"
                          >
                            {user.email}
                          </p>
                          {user.user_metadata?.phone && (
                            <p
                              className="text-xs text-gray-500 mt-0.5"
                              data-testid="menu-phone"
                            >
                              {user.user_metadata.phone as string}
                            </p>
                          )}
                        </div>
                        <div className="py-1">
                          <Link
                            to="/complete-profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {t('auth.editProfile')}
                          </Link>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              signOut();
                            }}
                            className="block w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {t('auth.signOut')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/signin"
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      {t('auth.signIn')}
                    </Link>
                    <Link
                      to="/signup"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      {t('auth.signUp')}
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {isMenuOpen && (
          <div
            className="fixed inset-0 z-40 sm:hidden"
            aria-hidden="true"
            onClick={() => {
              setIsMenuOpen(false);
              setIsMobileLangOpen(false);
            }}
          />
        )}
        {isMenuOpen && (
          <div className="absolute top-full start-0 end-0 bg-white shadow-lg z-50 sm:hidden border-t border-gray-200 transition-opacity duration-200">
            <ul className="list-none m-0 p-0">
              <li className="border-b border-gray-100">
                <Link
                  to="/plans"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  {t('nav.plans')}
                </Link>
              </li>
              <li className="border-b border-gray-100">
                <Link
                  to="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  {t('nav.about')}
                </Link>
              </li>
              {isAdmin && (
                <li className="border-b border-gray-100">
                  <Link
                    to="/admin/last-updated"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    Last Updated
                  </Link>
                </li>
              )}
              <li className="border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsMobileLangOpen(!isMobileLangOpen)}
                  data-testid="lang-toggle-mobile"
                  className="flex w-full items-center justify-between px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span>
                    {currentMeta.nativeLabel}{' '}
                    <span className="text-gray-400">
                      {currentMeta.currencySymbol}
                    </span>
                  </span>
                  <svg
                    className={clsx(
                      'h-4 w-4 text-gray-400 transition-transform',
                      isMobileLangOpen && 'rotate-180'
                    )}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {isMobileLangOpen && (
                  <div className="bg-gray-50">
                    {SUPPORTED_LANGUAGES.map((code) => {
                      const meta = LANGUAGE_META[code];
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            selectLanguage(code);
                            setIsMobileLangOpen(false);
                            setIsMenuOpen(false);
                          }}
                          data-testid={`lang-toggle-mobile-${code}`}
                          className={clsx(
                            'flex w-full items-center justify-between px-6 py-2.5 text-sm transition-colors',
                            code === language
                              ? 'text-blue-600 bg-blue-50 font-semibold'
                              : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                          )}
                        >
                          <span>{meta.nativeLabel}</span>
                          <span className="text-gray-400">
                            {meta.currencySymbol}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
              {!loading && (
                <li className="border-b border-gray-100 last:border-b-0">
                  {user ? (
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                          {getUserInitials(user)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getUserDisplayName(user) || t('auth.userFallback')}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      {user.user_metadata?.phone && (
                        <p className="text-xs text-gray-500 mb-2">
                          {user.user_metadata.phone as string}
                        </p>
                      )}
                      <Link
                        to="/complete-profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full text-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        {t('auth.editProfile')}
                      </Link>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          signOut();
                        }}
                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        {t('auth.signOut')}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Link
                        to="/signin"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                      >
                        {t('auth.signIn')}
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-3 text-base font-medium text-blue-600 hover:bg-gray-50 transition-colors border-t border-gray-100"
                      >
                        {t('auth.signUp')}
                      </Link>
                    </div>
                  )}
                </li>
              )}
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
