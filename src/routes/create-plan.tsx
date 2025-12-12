import { createFileRoute } from '@tanstack/react-router';
import PlanForm from '../components/PlanForm';

export const Route = createFileRoute('/create-plan')({
  component: CreatePlan,
});

export function CreatePlan() {
  return <PlanForm />;
}
