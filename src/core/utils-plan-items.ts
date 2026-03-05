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
  existingList: { participantId: string; status: ItemStatus }[] = []
): Partial<ItemPatch> {
  if (selectValue === ALL_PARTICIPANTS_VALUE) {
    return {
      assignmentStatusList: participants.map((p) => {
        const existing = existingList.find(
          (e) => e.participantId === p.participantId
        );
        return {
          participantId: p.participantId,
          status: existing?.status ?? 'pending',
        };
      }),
      isAllParticipants: true,
    };
  }
  if (selectValue) {
    const existing = existingList.find((e) => e.participantId === selectValue);
    return {
      assignmentStatusList: [
        {
          participantId: selectValue,
          status: existing?.status ?? 'pending',
        },
      ],
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

export function getItemStatus(
  item: Item,
  participantId?: string
): ItemStatus | undefined {
  if (participantId) {
    const own = item.assignmentStatusList.find(
      (a) => a.participantId === participantId
    );
    if (own) return own.status;
  }
  if (item.assignmentStatusList.length === 1)
    return item.assignmentStatusList[0].status;
  return undefined;
}

export function buildStatusUpdate(
  item: Item,
  newStatus: ItemStatus,
  participantId?: string
): Partial<ItemPatch> {
  if (participantId) {
    const hasEntry = item.assignmentStatusList.some(
      (a) => a.participantId === participantId
    );
    if (hasEntry) {
      return {
        assignmentStatusList: item.assignmentStatusList.map((a) =>
          a.participantId === participantId ? { ...a, status: newStatus } : a
        ),
      };
    }
  }
  if (item.assignmentStatusList.length === 1) {
    return {
      assignmentStatusList: [
        { ...item.assignmentStatusList[0], status: newStatus },
      ],
    };
  }
  return {};
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
    if (getItemStatus(item) === 'canceled') continue;
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

export function countItemsByListTab(
  items: Item[],
  participantId?: string
): Record<ListFilter, number> {
  const counts: Record<ListFilter, number> = { buying: 0, packing: 0 };
  for (const item of items) {
    const s = getItemStatus(item, participantId);
    if (s === 'pending') counts.buying++;
    if (s === 'purchased' || s === 'pending') counts.packing++;
  }
  return counts;
}

export function filterItemsByStatusTab(
  items: Item[],
  listFilter: ListFilter | undefined,
  participantId?: string
): Item[] {
  if (!listFilter) return items;
  if (listFilter === 'buying')
    return items.filter((i) => getItemStatus(i, participantId) === 'pending');
  if (listFilter === 'packing')
    return items.filter((i) => {
      const s = getItemStatus(i, participantId);
      return s === 'purchased' || s === 'pending';
    });
  return items;
}
