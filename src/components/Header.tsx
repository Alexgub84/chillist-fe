import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/useAuth';

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
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
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
            onClick={() => setIsMenuOpen(!isMenuOpen)}
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
                  Plans
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="block px-3 py-2 text-base sm:text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  About
                </Link>
              </li>
            </ul>

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
                      <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black/5 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p
                            className="text-sm font-medium text-gray-900"
                            data-testid="menu-display-name"
                          >
                            {getUserDisplayName(user) || 'User'}
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
                            Edit Profile
                          </Link>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              signOut();
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Sign Out
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
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg z-50 sm:hidden border-t border-gray-200 transition-opacity duration-200">
            <ul className="list-none m-0 p-0">
              <li className="border-b border-gray-100">
                <Link
                  to="/plans"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  Plans
                </Link>
              </li>
              <li className="border-b border-gray-100">
                <Link
                  to="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  About
                </Link>
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
                            {getUserDisplayName(user) || 'User'}
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
                        Edit Profile
                      </Link>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          signOut();
                        }}
                        className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Link
                        to="/signin"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-3 text-base font-medium text-blue-600 hover:bg-gray-50 transition-colors border-t border-gray-100"
                      >
                        Sign Up
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
