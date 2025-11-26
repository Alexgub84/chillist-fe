import React from 'react';
import { Link } from '@tanstack/react-router';

export function ErrorPage({ error }) {
  return (
    <div
      className="error-page"
      style={{ padding: '2rem', textAlign: 'center' }}
    >
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
        Something went wrong
      </h1>
      <div style={{ color: '#b91c1c', marginBottom: '1rem' }}>
        {error?.message ?? 'An unexpected error occurred.'}
      </div>
      <div>
        <Link
          to="/plans"
          style={{ color: '#2563eb', textDecoration: 'underline' }}
        >
          Back to Plans
        </Link>
      </div>
    </div>
  );
}

export default ErrorPage;
