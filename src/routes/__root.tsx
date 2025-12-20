import { createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import NotFound from './not-found.lazy';
import Header from '../components/Header';

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
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    );
  },
});
