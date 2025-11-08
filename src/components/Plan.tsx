import type { Plan as PlanType } from '../core/types/plan';
import { Link } from '@tanstack/react-router';

export function Plan({ plan }: { plan: PlanType }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/plans" className="text-blue-500 hover:underline">
          ← Back to Plans
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{plan.title}</h1>
      </div>
    </div>
  );
}
