import { createLazyFileRoute, redirect } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/')({
  loader: () => {
    throw redirect({
      to: '/plans',
      replace: true
    });
  },
  component: () => null
});
