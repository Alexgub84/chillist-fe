interface Plan {
  id: string;
  title: string;
}

interface PlansListProps {
  plans: Plan[];
}

export function PlansList({ plans }: PlansListProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Plans</h1>
      <ul
        data-testid="plans-list"
        className="bg-white rounded-lg shadow-md divide-y divide-gray-200"
      >
        {plans.map((plan) => (
          <li key={plan.id} className="px-6 py-4 hover:bg-gray-50 transition">
            <span className="text-lg text-gray-700">{plan.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
