import { useState, useMemo } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import type { Item } from '../core/schemas/item';
import type { Participant } from '../core/schemas/participant';
import BulkAssignDialog from './BulkAssignDialog';

interface BulkAssignButtonProps {
  items: Item[];
  participants: Participant[];
  onAssign: (itemIds: string[], participantId: string) => void;
  restrictToUnassignedOnly?: boolean;
  selfParticipantId?: string;
}

export default function BulkAssignButton({
  items,
  participants,
  onAssign,
  restrictToUnassignedOnly,
  selfParticipantId,
}: BulkAssignButtonProps) {
  const { t } = useTranslation();
  const [dialogState, setDialogState] = useState<{
    participantId: string;
    participantName: string;
    conflictCount: number;
    totalCount: number;
    allIds: string[];
    unassignedIds: string[];
  } | null>(null);

  const effectiveItems = restrictToUnassignedOnly
    ? items.filter((i) => !i.assignedParticipantId)
    : items;

  const effectiveParticipants =
    restrictToUnassignedOnly && selfParticipantId
      ? participants.filter((p) => p.participantId === selfParticipantId)
      : participants;

  const participantOptions = useMemo(
    () =>
      effectiveParticipants.map((p) => ({
        id: p.participantId,
        label: `${p.name} ${p.lastName}`,
      })),
    [effectiveParticipants]
  );

  function handleSelectParticipant(participantId: string) {
    const selected = participantOptions.find((p) => p.id === participantId);
    if (!selected) return;

    const allIds = effectiveItems.map((i) => i.itemId);
    const conflicts = effectiveItems.filter(
      (i) =>
        i.assignedParticipantId !== null &&
        i.assignedParticipantId !== undefined &&
        i.assignedParticipantId !== participantId
    );
    const unassignedIds = effectiveItems
      .filter(
        (i) =>
          !i.assignedParticipantId || i.assignedParticipantId === participantId
      )
      .map((i) => i.itemId);

    if (restrictToUnassignedOnly || conflicts.length === 0) {
      onAssign(
        unassignedIds.length > 0 ? unassignedIds : allIds,
        participantId
      );
    } else {
      setDialogState({
        participantId,
        participantName: selected.label,
        conflictCount: conflicts.length,
        totalCount: effectiveItems.length,
        allIds,
        unassignedIds,
      });
    }
  }

  if (effectiveParticipants.length === 0) return null;
  if (restrictToUnassignedOnly && effectiveItems.length === 0) return null;

  return (
    <>
      <Menu as="div" className="relative">
        <MenuButton
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
          aria-label={t('items.bulkAssign')}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{t('items.bulkAssign')}</span>
        </MenuButton>

        <MenuItems
          anchor="bottom end"
          className="z-50 w-56 origin-top-end rounded-lg bg-white shadow-lg ring-1 ring-black/5 p-1 focus:outline-none"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            {t('items.bulkAssign')}
          </div>
          {participantOptions.map((p) => (
            <MenuItem key={p.id}>
              <button
                type="button"
                onClick={() => handleSelectParticipant(p.id)}
                className="group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 data-focus:bg-blue-50 data-focus:text-blue-700"
              >
                <svg
                  className="w-4 h-4 text-gray-400 group-data-focus:text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {p.label}
              </button>
            </MenuItem>
          ))}
        </MenuItems>
      </Menu>

      {dialogState && (
        <BulkAssignDialog
          open={!!dialogState}
          onClose={() => setDialogState(null)}
          participantName={dialogState.participantName}
          conflictCount={dialogState.conflictCount}
          totalCount={dialogState.totalCount}
          onAssignAll={() =>
            onAssign(dialogState.allIds, dialogState.participantId)
          }
          onOnlyUnassigned={() =>
            onAssign(dialogState.unassignedIds, dialogState.participantId)
          }
        />
      )}
    </>
  );
}
