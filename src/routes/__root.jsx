import {
  createRootRoute,
  Outlet,
  Link,
  redirect,
} from '@tanstack/react-router';
import ErrorPage from './ErrorPage';
import NotFound from './not-found.lazy';

export const Route = createRootRoute({
  loader: ({ context, location }) => {
    // Redirect to /plans only if we're at the exact root path
    if (location.pathname === '/' || location.pathname === '') {
      throw redirect({
        to: '/plans',
        replace: true,
      });
    }
  },
  errorElement: ErrorPage,
  notFoundComponent: NotFound,
  component: () => {
    return (
      <div className="root-layout">
        <header>
          <nav>
            <ul
              style={{
                display: 'flex',
                gap: '1rem',
                listStyle: 'none',
                padding: '1rem',
                backgroundColor: '#f5f5f5',
                margin: 0,
              }}
            >
              <li>
                <Link to="/plans">Plans</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
            </ul>
          </nav>
        </header>
        <main style={{ padding: '1rem' }}>
          <Outlet />
        </main>
      </div>
    );
  },
});
