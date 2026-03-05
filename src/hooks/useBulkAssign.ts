import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { bulkUpdateItems } from '../core/api';
import type { Participant } from '../core/schemas/participant';
import {
  ALL_PARTICIPANTS_VALUE,
  buildAssignmentPayload,
} from '../core/utils-plan-items';

interface BulkAssignVariables {
  itemIds: string[];
  participantId: string;
}

export function useBulkAssign(planId: string, participants: Participant[]) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemIds, participantId }: BulkAssignVariables) => {
      const assignmentFields = buildAssignmentPayload(
        participantId,
        participants
      );
      const entries = itemIds.map((id) => ({
        itemId: id,
        ...assignmentFields,
      }));
      return bulkUpdateItems(planId, entries);
    },
    onSuccess: (result, { participantId }) => {
      const isAll = participantId === ALL_PARTICIPANTS_VALUE;
      const name = isAll
        ? t('items.allParticipants')
        : (() => {
            const participant = participants.find(
              (p) => p.participantId === participantId
            );
            return participant
              ? `${participant.name} ${participant.lastName}`
              : '';
          })();

      if (result.errors.length > 0) {
        toast.error(
          t('items.bulkAssignPartial', {
            successCount: result.items.length,
            errorCount: result.errors.length,
          })
        );
      } else {
        toast.success(
          t('items.bulkAssignSuccess', {
            count: result.items.length,
            name,
          })
        );
      }
    },
    onError: (err, { itemIds }) => {
      console.error(
        `[useBulkAssign] failed — planId="${planId}", itemCount=${itemIds.length}. Error: ${err instanceof Error ? err.message : String(err)}`
      );
      toast.error(t('items.bulkAssignError'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });
}
