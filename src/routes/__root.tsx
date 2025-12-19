import {
  createRootRoute,
  Outlet,
  Link,
  redirect,
} from '@tanstack/react-router';
import { useState } from 'react';
import NotFound from './not-found.lazy';

export const Route = createRootRoute({
  loader: ({ location }) => {
    // Redirect to /plans only if we're at the exact root path
    if (location.pathname === '/' || location.pathname === '') {
      throw redirect({
        to: '/plans',
        replace: true,
      });
    }
  },
  notFoundComponent: NotFound,
  component: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2 sm:py-4">
              {/* Mobile hamburger button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                aria-expanded="false"
              >
                <span className="sr-only">Open menu</span>
                {isMenuOpen ? (
                  /* X icon */
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
                  /* Hamburger icon */
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

              {/* Desktop navigation */}
              <ul className="hidden sm:flex gap-6 list-none m-0 p-0">
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
            </div>

            {/* Mobile navigation menu */}
            {isMenuOpen && (
              <div className="sm:hidden border-t border-gray-200">
                <ul className="space-y-1 py-2 list-none m-0 p-0">
                  <li>
                    <Link
                      to="/plans"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    >
                      Plans
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/about"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    >
                      About
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </nav>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    );
  },
});
