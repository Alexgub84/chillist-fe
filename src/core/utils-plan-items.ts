import type { Item, ItemPatch, ItemStatus } from './schemas/item';
import type { Participant } from './schemas/participant';
import type { ListFilter } from './schemas/plan-search';

export const ALL_PARTICIPANTS_VALUE = '__all__';

// --- Assignment helpers ---

export function isAssignedTo(item: Item, participantId: string): boolean {
  return item.assignmentStatusList.some(
    (a) => a.participantId === participantId
  );
}

export function isItemUnassigned(item: Item): boolean {
  return item.assignmentStatusList.length === 0;
}

export function getAssignmentSelectValue(item: Item): string {
  if (item.isAllParticipants) return ALL_PARTICIPANTS_VALUE;
  if (item.assignmentStatusList.length === 1)
    return item.assignmentStatusList[0].participantId;
  return '';
}

export function buildAssignmentPayload(
  selectValue: string,
  participants: Participant[],
  status: ItemStatus = 'pending'
): Partial<ItemPatch> {
  if (selectValue === ALL_PARTICIPANTS_VALUE) {
    return {
      assignmentStatusList: participants.map((p) => ({
        participantId: p.participantId,
        status,
      })),
      isAllParticipants: true,
    };
  }
  if (selectValue) {
    return {
      assignmentStatusList: [{ participantId: selectValue, status }],
      isAllParticipants: false,
    };
  }
  return { assignmentStatusList: [], isAllParticipants: false };
}

export function getParticipantStatus(
  item: Item,
  participantId: string
): ItemStatus | undefined {
  const entry = item.assignmentStatusList.find(
    (a) => a.participantId === participantId
  );
  return entry?.status;
}

// --- Participant options ---

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

// --- Counting & filtering ---

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
    if (isItemUnassigned(item)) {
      counts['unassigned']++;
    } else {
      for (const a of item.assignmentStatusList) {
        counts[a.participantId] = (counts[a.participantId] ?? 0) + 1;
      }
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
    return items.filter((i) => isItemUnassigned(i));
  return items.filter((i) => isAssignedTo(i, participantFilter));
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
