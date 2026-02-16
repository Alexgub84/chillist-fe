import { Link } from '@tanstack/react-router';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg z-50 sm:hidden border-t border-gray-200 transition-opacity duration-200">
            <ul className="list-none m-0 p-0">
              <li className="border-b border-gray-100 last:border-b-0">
                <Link
                  to="/plans"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  Plans
                </Link>
              </li>
              <li className="border-b border-gray-100 last:border-b-0">
                <Link
                  to="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
