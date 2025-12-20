export function FormLabel({ children }: { children: React.ReactNode }) {
  const className = 'block text-sm font-semibold text-gray-700 mb-2';
  return <label className={className}>{children}</label>;
}
