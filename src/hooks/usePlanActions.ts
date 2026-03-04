import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useCreateItem } from './useCreateItem';
import { useUpdateItem } from './useUpdateItem';
import { useUpdateParticipant } from './useUpdateParticipant';
import { useDeletePlan } from './useDeletePlan';
import { useUpdatePlan } from './useUpdatePlan';
import { getApiErrorMessage } from '../core/error-utils';
import type { ItemCreate, ItemPatch } from '../core/schemas/item';
import type { PlanPatch } from '../core/schemas/plan';
import type { ItemFormValues } from '../components/ItemForm';
import type { PreferencesFormValues } from '../components/PreferencesForm';
import { ALL_PARTICIPANTS_VALUE } from '../core/utils-plan-items';

function toItemPayload(values: ItemFormValues) {
  const isAll = values.assignedParticipantId === ALL_PARTICIPANTS_VALUE;
  return {
    name: values.name,
    category: values.category,
    subcategory: values.subcategory || null,
    quantity: values.quantity,
    unit: values.unit,
    status: values.status,
    notes: values.notes || null,
    assignedParticipantId: isAll ? null : values.assignedParticipantId || null,
    assignedToAll: isAll || undefined,
  };
}

function handleMutationError(context: string, err: unknown) {
  console.error(
    `[PlanActions] ${context}. Error: ${err instanceof Error ? err.message : String(err)}`
  );
  const { title, message } = getApiErrorMessage(
    err instanceof Error ? err : new Error(String(err))
  );
  toast.error(`${title}: ${message}`);
}

export function usePlanActions(planId: string) {
  const { t } = useTranslation();
  const createItemMutation = useCreateItem(planId);
  const updateItemMutation = useUpdateItem(planId);
  const updateParticipantMutation = useUpdateParticipant(planId);
  const deletePlanMutation = useDeletePlan();
  const updatePlanMutation = useUpdatePlan(planId);

  async function updateSingleItem(itemId: string, updates: ItemPatch) {
    try {
      await updateItemMutation.mutateAsync({ itemId, updates });
    } catch (err) {
      handleMutationError(
        `updateSingleItem failed — planId="${planId}", itemId="${itemId}"`,
        err
      );
    }
  }

  async function createItem(payload: ItemCreate) {
    try {
      await createItemMutation.mutateAsync(payload);
    } catch (err) {
      handleMutationError(`createItem failed — planId="${planId}"`, err);
      throw err;
    }
  }

  async function createOrUpdateItem(
    values: ItemFormValues,
    editingItemId: string | null
  ) {
    if (editingItemId) {
      await updateSingleItem(editingItemId, toItemPayload(values));
    } else {
      await createItem(toItemPayload(values));
    }
  }

  async function updateParticipantPreferences(
    participantId: string,
    values: PreferencesFormValues
  ) {
    try {
      await updateParticipantMutation.mutateAsync({
        participantId,
        updates: {
          adultsCount: values.adultsCount ?? null,
          kidsCount: values.kidsCount ?? null,
          foodPreferences: values.foodPreferences || null,
          allergies: values.allergies || null,
          notes: values.notes || null,
          rsvpStatus: values.rsvpStatus ?? undefined,
        },
      });
      toast.success(t('preferences.updated'));
    } catch (err) {
      handleMutationError(
        `updateParticipantPreferences failed — planId="${planId}", participantId="${participantId}"`,
        err
      );
    }
  }

  async function deletePlan(): Promise<boolean> {
    try {
      await deletePlanMutation.mutateAsync(planId);
      toast.success(t('plan.deleted'));
      return true;
    } catch (err) {
      handleMutationError(`deletePlan failed — planId="${planId}"`, err);
      return false;
    }
  }

  async function updatePlanDetails(updates: PlanPatch): Promise<boolean> {
    try {
      await updatePlanMutation.mutateAsync(updates);
      toast.success(t('plan.updated'));
      return true;
    } catch (err) {
      handleMutationError(`updatePlanDetails failed — planId="${planId}"`, err);
      return false;
    }
  }

  async function transferPlanOwnership(participantId: string) {
    try {
      await updateParticipantMutation.mutateAsync({
        participantId,
        updates: { role: 'owner' },
      });
      toast.success(t('participantDetails.addOwnerSuccess'));
    } catch (err) {
      handleMutationError(
        `transferPlanOwnership failed — planId="${planId}", participantId="${participantId}"`,
        err
      );
    }
  }

  return {
    createItem,
    updateSingleItem,
    createOrUpdateItem,
    updateParticipantPreferences,
    deletePlan,
    updatePlanDetails,
    transferPlanOwnership,
    isCreatingItem: createItemMutation.isPending,
    isUpdatingItem: updateItemMutation.isPending,
    isDeletingPlan: deletePlanMutation.isPending,
    isUpdatingPlan: updatePlanMutation.isPending,
    isUpdatingParticipant: updateParticipantMutation.isPending,
  };
}
