import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/create-plan')({
  component: CreatePlan,
});

export function CreatePlan() {
  return (
    <div className="create-plan">
      <h1>Create Plan</h1>
      <p>Welcome to Chillist!</p>
    </div>
  );
}
