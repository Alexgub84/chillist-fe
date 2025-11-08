import { PlansList } from './components/PlansList';

export const App = () => {
  const plans = [
    { planId: '1', title: 'Camping' },
    { planId: '2', title: 'Family Dinner' },
    { planId: '3', title: 'Road Trip' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <PlansList plans={plans} />
    </div>
  );
};
