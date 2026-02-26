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
}

export default function BulkAssignButton({
  items,
  participants,
  onAssign,
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

  const participantOptions = useMemo(
    () =>
      participants.map((p) => ({
        id: p.participantId,
        label: `${p.name} ${p.lastName}`,
      })),
    [participants]
  );

  function handleSelectParticipant(participantId: string) {
    const selected = participantOptions.find((p) => p.id === participantId);
    if (!selected) return;

    const allIds = items.map((i) => i.itemId);
    const conflicts = items.filter(
      (i) =>
        i.assignedParticipantId !== null &&
        i.assignedParticipantId !== undefined &&
        i.assignedParticipantId !== participantId
    );
    const unassignedIds = items
      .filter(
        (i) =>
          !i.assignedParticipantId || i.assignedParticipantId === participantId
      )
      .map((i) => i.itemId);

    if (conflicts.length === 0) {
      onAssign(allIds, participantId);
    } else {
      setDialogState({
        participantId,
        participantName: selected.label,
        conflictCount: conflicts.length,
        totalCount: items.length,
        allIds,
        unassignedIds,
      });
    }
  }

  if (participants.length === 0) return null;

  return (
    <>
      <Menu as="div" className="relative">
        <MenuButton
          className="inline-flex items-center justify-center w-7 h-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
          aria-label={t('items.bulkAssign')}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <svg
            className="w-4 h-4"
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
