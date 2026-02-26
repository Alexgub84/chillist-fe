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
    title: 'Collapsible plan details',
    description:
      "The plan details section on the plan page is now collapsible. It opens by default for owners and participants who haven't confirmed their RSVP, and stays collapsed otherwise to keep the focus on items.",
  },
  {
    date: '2026-02-26',
    title: 'Owner transfer with confirmation',
    description:
      'Promoting a participant to owner now shows a confirmation dialog before applying the change. Available from both the participant cards and the manage participants modal.',
  },
  {
    date: '2026-02-26',
    title: 'Multiple owners',
    description:
      'Plans now support multiple owners. Promoting someone to owner no longer removes your own ownership — both users become co-owners.',
  },
  {
    date: '2026-02-26',
    title: 'Spanish language support',
    description:
      'Added Spanish (Español) as a third language option alongside English and Hebrew. Full translation coverage for all UI text, labels, and messages.',
  },
  {
    date: '2026-02-26',
    title: 'Spanish common items catalog',
    description:
      'The common items database now includes Spanish translations for all 700+ items, enabling autocomplete suggestions when adding items in Spanish.',
  },
  {
    date: '2026-02-26',
    title: 'Translated subcategory names',
    description:
      'Subcategory names in the bulk add wizard and item list are now translated based on the selected language instead of showing raw English keys.',
  },
  {
    date: '2026-02-26',
    title: 'Redesigned mobile language switcher',
    description:
      'The language selector in the mobile hamburger menu is now a collapsible submenu instead of a flat list, saving vertical space and improving navigation.',
  },
  {
    date: '2026-02-26',
    title: 'Hebrew common items',
    description:
      'Common items catalog now includes Hebrew translations for all 700+ items, enabling autocomplete suggestions in Hebrew.',
  },
];
