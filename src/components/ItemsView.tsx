import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import type {
  Item,
  ItemCategory,
  ItemCreate,
  ItemPatch,
} from '../core/schemas/item';
import type { Participant } from '../core/schemas/participant';
import type { ListFilter } from '../core/schemas/plan-search';
import { getApiErrorMessage } from '../core/error-utils';
import CategorySection from './CategorySection';
import ItemForm, { type ItemFormValues } from './ItemForm';
import ListTabs from './StatusFilter';
import Modal from './shared/Modal';

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
  isCreating?: boolean;
}

const CATEGORIES: ItemCategory[] = ['equipment', 'food'];

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
  isCreating,
}: ItemsViewProps) {
  const { t } = useTranslation();
  const [itemModalId, setItemModalId] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<ListFilter | null>(null);

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

  const listCounts: Record<ListFilter, number> = { buying: 0, packing: 0 };
  for (const item of items) {
    if (item.status === 'pending') listCounts.buying++;
    if (item.status === 'purchased') listCounts.packing++;
  }

  const filteredItems = items.filter((item) => {
    if (listFilter === 'buying' && item.status !== 'pending') return false;
    if (listFilter === 'packing' && item.status !== 'purchased') return false;
    return true;
  });

  const itemsByCategory = CATEGORIES.map((category) => ({
    category,
    items: filteredItems.filter((item) => item.category === category),
  }));

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
          <div className="mb-4 sm:mb-6">
            <ListTabs
              selected={listFilter}
              onChange={setListFilter}
              counts={listCounts}
              total={items.length}
            />
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
          <div className="space-y-4 mb-4">
            {itemsByCategory.map(({ category, items: catItems }) => (
              <CategorySection
                key={category}
                category={category}
                items={catItems}
                participants={participants}
                listFilter={listFilter}
                selfAssignParticipantId={myParticipantId}
                canEditItem={canEditItem}
                onEditItem={(itemId) => setItemModalId(itemId)}
                onUpdateItem={handleUpdateItem}
              />
            ))}
          </div>
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
        <button
          type="button"
          onClick={() => setItemModalId('new')}
          className="pointer-events-auto ms-auto flex items-center gap-2 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 active:bg-green-800 hover:shadow-xl transition-colors cursor-pointer px-4 py-3"
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
  );
}
