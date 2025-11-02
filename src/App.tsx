import { PlansList } from './components/PlansList';

export const App = () => {
  const plans = [
    { id: '1', title: 'Camping' },
    { id: '2', title: 'Family Dinner' },
    { id: '3', title: 'Road Trip' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <PlansList plans={plans} />
    </div>
  );
};
