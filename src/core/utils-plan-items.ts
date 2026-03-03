import type { Item } from './schemas/item';
import type { Participant } from './schemas/participant';
import type { ListFilter } from './schemas/plan-search';

export function countItemsPerParticipant(
  participants: Participant[],
  items: Item[]
): Record<string, number> {
  const counts: Record<string, number> = { unassigned: 0 };
  for (const p of participants) {
    counts[p.participantId] = 0;
  }
  for (const item of items) {
    if (item.assignedParticipantId) {
      counts[item.assignedParticipantId] =
        (counts[item.assignedParticipantId] ?? 0) + 1;
    } else {
      counts['unassigned']++;
    }
  }
  return counts;
}

export function filterItemsByAssignedParticipant(
  items: Item[],
  participantFilter: string | undefined
): Item[] {
  if (!participantFilter) return items;
  if (participantFilter === 'unassigned')
    return items.filter((i) => !i.assignedParticipantId);
  return items.filter((i) => i.assignedParticipantId === participantFilter);
}

export function countItemsByListTab(items: Item[]): Record<ListFilter, number> {
  const counts: Record<ListFilter, number> = { buying: 0, packing: 0 };
  for (const item of items) {
    if (item.status === 'pending') {
      counts.buying++;
      counts.packing++;
    }
    if (item.status === 'purchased') counts.packing++;
  }
  return counts;
}

export function filterItemsByStatusTab(
  items: Item[],
  listFilter: ListFilter | undefined
): Item[] {
  if (!listFilter) return items;
  if (listFilter === 'buying')
    return items.filter((i) => i.status === 'pending');
  if (listFilter === 'packing')
    return items.filter(
      (i) => i.status === 'purchased' || i.status === 'pending'
    );
  return items;
}
