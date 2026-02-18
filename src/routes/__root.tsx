import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from 'react-hot-toast';
import NotFound from './not-found.lazy';
import Header from '../components/Header';
import { ErrorPage } from './ErrorPage';
import AuthProvider from '../contexts/AuthProvider';

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
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 2000,
              error: {
                duration: 4000,
                style: {
                  background: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FECACA',
                },
              },
              success: {
                style: {
                  background: '#F0FDF4',
                  color: '#166534',
                  border: '1px solid #BBF7D0',
                },
              },
            }}
          />
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-6 lg:py-8">
            <Outlet />
          </main>
        </div>
      </AuthProvider>
    );
  },
});
