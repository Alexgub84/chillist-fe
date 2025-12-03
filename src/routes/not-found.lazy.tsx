import { createLazyFileRoute } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/not-found')({
  component: NotFound,
});

function NotFound() {
  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        404 — Page Not Found
      </h1>
      <p style={{ marginBottom: '1rem' }}>
        We couldn't find the page you were looking for.
      </p>
      <Link
        to="/plans"
        style={{ color: '#2563eb', textDecoration: 'underline' }}
      >
        Back to Plans
      </Link>
    </div>
  );
}

export default NotFound;
