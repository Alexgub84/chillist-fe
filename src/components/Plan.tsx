import type { Plan as PlanType } from '../core/types/plan';

export function Plan({ plan }: { plan: PlanType }) {
  const {
    title,
    description,
    status,
    visibility,
    ownerParticipantId,
    startDate,
    endDate,
  } = plan;

  const NA = 'N/A';
  const formattedStartDate = startDate
    ? new Date(startDate).toLocaleDateString()
    : NA;
  const formattedEndDate = endDate
    ? new Date(endDate).toLocaleDateString()
    : NA;

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-6 border-b border-gray-200">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 line-clamp-2">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg mt-2 line-clamp-3">
              {description}
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
                {status}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Visibility
              </p>
              <p className="text-sm sm:text-base text-gray-700 font-medium capitalize">
                {visibility || NA}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Owner ID
              </p>
              <p className="text-xs sm:text-sm text-gray-700 font-mono break-all">
                {ownerParticipantId}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Start Date
              </p>
              <p className="text-sm sm:text-base text-gray-700">
                {formattedStartDate}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                End Date
              </p>
              <p className="text-sm sm:text-base text-gray-700">
                {formattedEndDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
