import { createLazyFileRoute } from '@tanstack/react-router';
import { changelog } from '../data/changelog';

export const Route = createLazyFileRoute('/admin/last-updated')({
  component: LastUpdated,
});

export function LastUpdated() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
        Last Updated
      </h1>

      {changelog.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No updates yet.</p>
      ) : (
        <div className="relative ps-8 border-s-2 border-blue-200">
          {changelog.map((entry, idx) => (
            <div key={idx} className="relative mb-10 last:mb-0">
              <div className="absolute -start-[calc(1rem+5px)] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />

              <time className="text-sm font-medium text-blue-600">
                {entry.date}
              </time>

              <h2 className="text-lg font-semibold text-gray-900 mt-1">
                {entry.title}
              </h2>

              <p className="text-gray-600 mt-1 leading-relaxed">
                {entry.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
