import type { Item, ItemStatus } from './schemas/item';
import type { Participant } from './schemas/participant';
import type { ListFilter } from './schemas/plan-search';

export const ALL_PARTICIPANTS_VALUE = '__all__';

export interface AggregatedGroupMeta {
  groupId: string;
  copies: Item[];
  statusSummary: Record<ItemStatus, number>;
}

export type DisplayItem = Item & {
  _aggregatedGroup?: AggregatedGroupMeta;
};

export function aggregateAllParticipantItems(
  items: Item[],
  isOwner: boolean
): DisplayItem[] {
  if (!isOwner) return items;

  const groups = new Map<string, Item[]>();
  const standalone: DisplayItem[] = [];

  for (const item of items) {
    if (item.isAllParticipants && item.allParticipantsGroupId) {
      const existing = groups.get(item.allParticipantsGroupId);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(item.allParticipantsGroupId, [item]);
      }
    } else {
      standalone.push(item);
    }
  }

  const aggregated: DisplayItem[] = [];
  for (const [groupId, copies] of groups) {
    const representative: DisplayItem = { ...copies[0] };
    const statusSummary: Record<ItemStatus, number> = {
      pending: 0,
      purchased: 0,
      packed: 0,
      canceled: 0,
    };
    for (const copy of copies) {
      statusSummary[copy.status]++;
    }
    representative._aggregatedGroup = { groupId, copies, statusSummary };
    aggregated.push(representative);
  }

  return [...aggregated, ...standalone];
}

export interface ParticipantOption {
  value: string;
  label: string;
}

export function buildParticipantOptions(
  participants: Participant[],
  labels: { unassigned: string; allParticipants: string },
  opts?: { includeUnassigned?: boolean; includeAll?: boolean }
): ParticipantOption[] {
  const result: ParticipantOption[] = [];
  if (opts?.includeUnassigned) {
    result.push({ value: '', label: labels.unassigned });
  }
  if (opts?.includeAll) {
    result.push({
      value: ALL_PARTICIPANTS_VALUE,
      label: labels.allParticipants,
    });
  }
  for (const p of participants) {
    result.push({ value: p.participantId, label: `${p.name} ${p.lastName}` });
  }
  return result;
}

export function countItemsPerParticipant(
  participants: Participant[],
  items: Item[]
): Record<string, number> {
  const counts: Record<string, number> = { unassigned: 0 };
  for (const p of participants) {
    counts[p.participantId] = 0;
  }
  for (const item of items) {
    if (item.status === 'canceled') continue;
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
    if (item.status === 'pending') counts.buying++;
    if (item.status === 'purchased' || item.status === 'pending')
      counts.packing++;
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
