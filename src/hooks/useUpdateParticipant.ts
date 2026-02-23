import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateParticipant } from '../core/api';
import type { ParticipantPatch } from '../core/schemas/participant';

export function useUpdateParticipant(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      participantId,
      updates,
    }: {
      participantId: string;
      updates: ParticipantPatch;
    }) => updateParticipant(participantId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });
}
