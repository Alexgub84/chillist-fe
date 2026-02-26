import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import type { Item, ItemCreate, ItemPatch } from '../core/schemas/item';
import type { Participant } from '../core/schemas/participant';
import type { ListFilter } from '../core/schemas/plan-search';
import { getApiErrorMessage } from '../core/error-utils';
import ItemsList from './ItemsList';
import ItemForm, { type ItemFormValues } from './ItemForm';
import ListTabs from './StatusFilter';
import ParticipantFilter from './ParticipantFilter';
import Modal from './shared/Modal';
import BulkAddModal from './BulkAddModal';

interface BackLinkPlan {
  kind: 'plan';
  planId: string;
}

interface BackLinkInvite {
  kind: 'invite';
  planId: string;
  inviteToken: string;
}

type BackLink = BackLinkPlan | BackLinkInvite;

export interface ItemsViewProps {
  planId: string;
  planTitle: string;
  items: Item[];
  participants: Participant[];
  isGuest: boolean;
  guestParticipantId?: string;
  selfParticipantId?: string;
  backLink: BackLink;
  onCreateItem: (payload: ItemCreate) => Promise<void>;
  onUpdateItem: (itemId: string, updates: ItemPatch) => Promise<void>;
  onBulkAssign?: (itemIds: string[], participantId: string) => void;
  isCreating?: boolean;
}

export default function ItemsView({
  planTitle,
  items,
  participants,
  isGuest,
  guestParticipantId,
  selfParticipantId,
  backLink,
  onCreateItem,
  onUpdateItem,
  onBulkAssign,
  isCreating,
}: ItemsViewProps) {
  const { t } = useTranslation();
  const [itemModalId, setItemModalId] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<ListFilter | null>(null);
  const [participantFilter, setParticipantFilter] = useState<string | null>(
    null
  );
  const [bulkAddOpen, setBulkAddOpen] = useState(false);

  const isCreatingNew = itemModalId === 'new';
  const editingItem =
    itemModalId && itemModalId !== 'new'
      ? items.find((i) => i.itemId === itemModalId)
      : null;

  function closeItemModal() {
    setItemModalId(null);
  }

  function toPayload(values: ItemFormValues) {
    return {
      name: values.name,
      category: values.category,
      subcategory: values.subcategory || null,
      quantity: values.quantity,
      unit: values.unit,
      status: values.status,
      notes: values.notes || null,
      assignedParticipantId: values.assignedParticipantId || null,
    };
  }

  async function handleItemFormSubmit(values: ItemFormValues) {
    try {
      if (isCreatingNew) {
        await onCreateItem(toPayload(values));
      } else if (editingItem) {
        await onUpdateItem(editingItem.itemId, toPayload(values));
      }
      closeItemModal();
    } catch (err) {
      console.error(
        `[ItemsView] handleItemFormSubmit failed. Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  async function handleUpdateItem(itemId: string, updates: ItemPatch) {
    try {
      await onUpdateItem(itemId, updates);
    } catch (err) {
      console.error(
        `[ItemsView] handleUpdateItem failed — itemId="${itemId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  async function handleBulkAdd(payloads: ItemCreate[]) {
    const results = await Promise.allSettled(
      payloads.map((payload) => onCreateItem(payload))
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed === 0) {
      toast.success(t('items.bulkAddSuccess', { count: succeeded }));
    } else if (succeeded > 0) {
      toast.error(
        t('items.bulkAddPartial', {
          successCount: succeeded,
          errorCount: failed,
        })
      );
    } else {
      toast.error(t('items.bulkAddError'));
      throw new Error('All items failed to create');
    }
  }

  const participantCounts: Record<string, number> = { unassigned: 0 };
  for (const p of participants) {
    participantCounts[p.participantId] = 0;
  }
  for (const item of items) {
    if (item.assignedParticipantId) {
      participantCounts[item.assignedParticipantId] =
        (participantCounts[item.assignedParticipantId] ?? 0) + 1;
    } else {
      participantCounts['unassigned']++;
    }
  }

  const participantScopedItems = items.filter((item) => {
    if (!participantFilter) return true;
    if (participantFilter === 'unassigned') return !item.assignedParticipantId;
    return item.assignedParticipantId === participantFilter;
  });

  const listCounts: Record<ListFilter, number> = { buying: 0, packing: 0 };
  for (const item of participantScopedItems) {
    if (item.status === 'pending') listCounts.buying++;
    if (item.status === 'purchased') listCounts.packing++;
  }

  const filteredItems = participantScopedItems.filter((item) => {
    if (listFilter === 'buying' && item.status !== 'pending') return false;
    if (listFilter === 'packing' && item.status !== 'purchased') return false;
    return true;
  });

  const myParticipantId = isGuest ? guestParticipantId : selfParticipantId;

  const canEditItem = myParticipantId
    ? (item: Item) => item.assignedParticipantId === myParticipantId
    : undefined;

  return (
    <div className="w-full px-3 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          {backLink.kind === 'plan' ? (
            <Link
              to="/plan/$planId"
              params={{ planId: backLink.planId }}
              className="text-blue-500 hover:underline text-sm sm:text-base"
            >
              {t('items.backToPlan')}
            </Link>
          ) : (
            <Link
              to="/invite/$planId/$inviteToken"
              params={{
                planId: backLink.planId,
                inviteToken: backLink.inviteToken,
              }}
              className="text-blue-500 hover:underline text-sm sm:text-base"
            >
              {t('items.backToPlan')}
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            {planTitle} — {t('items.title')}
            {items.length > 0 && (
              <span className="ms-2 text-sm font-normal text-gray-500">
                ({items.length})
              </span>
            )}
          </h1>
        </div>

        {items.length > 0 && (
          <div className="mb-4 sm:mb-6 space-y-3">
            {participants.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  {t('plan.filterByPerson')}
                </p>
                <ParticipantFilter
                  participants={participants}
                  selected={participantFilter}
                  onChange={setParticipantFilter}
                  counts={participantCounts}
                  total={items.length}
                  currentParticipantId={myParticipantId}
                />
              </div>
            )}
            {participants.length > 0 && (
              <div className="border-t border-gray-200" />
            )}
            <div>
              <ListTabs
                selected={listFilter}
                onChange={setListFilter}
                counts={listCounts}
                total={participantScopedItems.length}
              />
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center mb-4">
            <p className="text-gray-500 text-sm sm:text-base">
              {t('items.empty')}
            </p>
          </div>
        )}

        {items.length > 0 && (
          <ItemsList
            items={filteredItems}
            participants={participants}
            listFilter={listFilter}
            selfAssignParticipantId={myParticipantId}
            canEditItem={canEditItem}
            onEditItem={(itemId) => setItemModalId(itemId)}
            onUpdateItem={handleUpdateItem}
            onBulkAssign={onBulkAssign}
            groupBySubcategory
          />
        )}

        <Modal
          open={!!itemModalId}
          onClose={closeItemModal}
          title={isCreatingNew ? t('items.addItemLabel') : t('items.editItem')}
        >
          <ItemForm
            key={itemModalId ?? 'closed'}
            defaultValues={
              editingItem
                ? {
                    name: editingItem.name,
                    category: editingItem.category,
                    subcategory: editingItem.subcategory ?? undefined,
                    quantity: editingItem.quantity,
                    unit: editingItem.unit,
                    status: editingItem.status,
                    notes: editingItem.notes ?? '',
                    assignedParticipantId:
                      editingItem.assignedParticipantId ?? '',
                  }
                : undefined
            }
            participants={isGuest ? [] : participants}
            onSubmit={handleItemFormSubmit}
            onCancel={closeItemModal}
            isSubmitting={isCreating}
            submitLabel={isCreatingNew ? undefined : t('items.updateItem')}
          />
        </Modal>
      </div>

      <div className="fixed bottom-6 inset-x-0 z-40 max-w-4xl mx-auto px-3 sm:px-0 pointer-events-none">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setBulkAddOpen(true)}
            className="pointer-events-auto flex items-center gap-2 bg-white text-green-700 border border-green-300 rounded-full shadow-lg hover:bg-green-50 active:bg-green-100 hover:shadow-xl transition-colors cursor-pointer px-4 py-3"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span className="text-sm font-semibold">{t('items.bulkAdd')}</span>
          </button>
          <button
            type="button"
            onClick={() => setItemModalId('new')}
            className="pointer-events-auto flex items-center gap-2 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 active:bg-green-800 hover:shadow-xl transition-colors cursor-pointer px-4 py-3"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm font-semibold">
              {t('items.addItemLabel')}
            </span>
          </button>
        </div>
      </div>

      <BulkAddModal
        open={bulkAddOpen}
        onClose={() => setBulkAddOpen(false)}
        onAdd={handleBulkAdd}
      />
    </div>
  );
}
