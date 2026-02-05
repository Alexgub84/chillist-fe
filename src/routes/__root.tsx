import { createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import NotFound from './not-found.lazy';
import Header from '../components/Header';
import { ErrorPage } from './ErrorPage';

function logError(error: Error, context?: string) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  console.error('[App Error]', errorInfo);

  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  // if (import.meta.env.PROD) {
  //   errorTrackingService.captureException(error, { extra: errorInfo });
  // }
}

export const Route = createRootRoute({
  loader: ({ location }) => {
    if (location.pathname === '/' || location.pathname === '') {
      throw redirect({
        to: '/plans',
        replace: true,
      });
    }
  },
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => {
    logError(error, 'RootErrorBoundary');
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-6 lg:py-8">
          <ErrorPage error={error} />
        </main>
      </div>
    );
  },
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
