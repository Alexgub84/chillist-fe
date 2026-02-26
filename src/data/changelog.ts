export interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
}

export const changelog: ChangelogEntry[] = [
  {
    date: '2026-02-26',
    title: 'Admin changelog page',
    description:
      'Added this admin-only "Last Updated" page to track feature releases and changes. Accessible from the header for admin users.',
  },
  {
    date: '2026-02-26',
    title: 'Spanish language support',
    description:
      'Added Spanish (Español) as a third language option alongside English and Hebrew. Full translation coverage for all UI text, labels, and messages.',
  },
  {
    date: '2026-02-26',
    title: 'Add as owner',
    description:
      'Plan owners can now promote another participant to co-owner. Multiple owners are supported — promoting someone does not remove your own ownership.',
  },
  {
    date: '2026-02-26',
    title: 'Hebrew common items',
    description:
      'Common items catalog now includes Hebrew translations for all 700+ items, enabling autocomplete suggestions in Hebrew.',
  },
];
