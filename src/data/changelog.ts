export interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
}

export const changelog: ChangelogEntry[] = [
  {
    date: '2026-03-02',
    title: 'Approve / Reject join requests',
    description:
      'Plan owners can now approve or reject pending join requests directly from the Manage Participants page. Approving a request automatically creates a new participant linked to the requester. Both actions show confirmation toasts and refresh the plan data.',
  },
  {
    date: '2026-03-02',
    title: 'OpenAPI spec sync & schema fix',
    description:
      'Synced the frontend OpenAPI spec with the latest backend release. Fixed schema reference numbering shift (def-25/28 → def-33/36) caused by the new join-request management endpoint.',
  },
  {
    date: '2026-03-02',
    title: 'Shared profile fields component',
    description:
      'Extracted first name, last name, phone, and email inputs into a reusable ProfileFields component. Used by both the complete-profile page and the join-request form, ensuring consistent validation and Supabase profile sync.',
  },
  {
    date: '2026-03-02',
    title: 'Searchable phone country selector',
    description:
      'Rewrote the phone country code dropdown as a Headless UI Combobox. Users can now search by country name or dial code instead of scrolling through a long list.',
  },
  {
    date: '2026-03-02',
    title: 'Shared preferences fields component',
    description:
      'Extracted adults count, kids count, food preferences, allergies, and notes into a reusable PreferencesFields component shared between the preferences form and the join-request form.',
  },
  {
    date: '2026-03-02',
    title: 'Profile sync on join request',
    description:
      'When a user submits a join request, their profile details (name, phone, email) are now also synced to Supabase user_metadata — keeping profile data consistent across the app.',
  },
  {
    date: '2026-03-02',
    title: 'Plan route refactoring',
    description:
      'Broke the 600-line plan route into focused modules: usePlanRole (role derivation), usePlanActions (mutations), utils-plan-items (counting/filtering), TransferOwnershipModal, and SectionLink. Each module is independently testable.',
  },
  {
    date: '2026-03-02',
    title: 'Auth redirect context messages',
    description:
      'When unauthenticated users are redirected to sign-in from a plan page, a contextual message now explains they need to log in to view or join the plan. The redirect param is preserved when toggling between sign-in and sign-up.',
  },
  {
    date: '2026-03-02',
    title: 'Request to Join plan',
    description:
      "Invited users who aren't yet participants now see a plan preview and a form to request access instead of a crash. Once submitted, the page shows a pending status badge until the owner approves.",
  },
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
