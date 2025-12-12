import type { Plan as PlanType } from '../core/types/plan';

export function Plan({ plan }: { plan: PlanType }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{plan.title}</h1>
        {plan.description && (
          <p className="text-gray-600 mb-6">{plan.description}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Details
            </h2>
            <ul className="text-gray-600">
              <li>
                <strong>Status:</strong> {plan.status}
              </li>
              <li>
                <strong>Visibility:</strong> {plan.visibility || 'N/A'}
              </li>
              <li>
                <strong>Owner Participant ID:</strong> {plan.ownerParticipantId}
              </li>
              <li>
                <strong>Start Date:</strong> {plan.startDate || 'N/A'}
              </li>
              <li>
                <strong>End Date:</strong> {plan.endDate || 'N/A'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
