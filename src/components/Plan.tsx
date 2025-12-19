import type { Plan as PlanType } from '../core/types/plan';

export function Plan({ plan }: { plan: PlanType }) {
  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-6 border-b border-gray-200">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 line-clamp-2">
            {plan.title}
          </h1>
          {plan.description && (
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg mt-2 line-clamp-3">
              {plan.description}
            </p>
          )}
        </div>

        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 mb-4">
            Details
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </p>
              <p className="text-sm sm:text-base text-gray-700 font-medium capitalize">
                {plan.status}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Visibility
              </p>
              <p className="text-sm sm:text-base text-gray-700 font-medium capitalize">
                {plan.visibility || 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Owner ID
              </p>
              <p className="text-xs sm:text-sm text-gray-700 font-mono break-all">
                {plan.ownerParticipantId}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Start Date
              </p>
              <p className="text-sm sm:text-base text-gray-700">
                {plan.startDate
                  ? new Date(plan.startDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                End Date
              </p>
              <p className="text-sm sm:text-base text-gray-700">
                {plan.endDate
                  ? new Date(plan.endDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
