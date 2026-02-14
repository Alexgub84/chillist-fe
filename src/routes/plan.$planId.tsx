import { createFileRoute } from '@tanstack/react-router';
import { planSearchSchema } from '../core/schemas/plan-search';

export const Route = createFileRoute('/plan/$planId')({
  validateSearch: planSearchSchema,
});
