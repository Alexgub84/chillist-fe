import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/about')({
  component: About,
});

function About() {
  return (
    <div className="about">
      <h1>About Us</h1>
      <p>Welcome to Chillist!</p>
    </div>
  );
}
