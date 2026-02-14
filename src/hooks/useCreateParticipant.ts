import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createParticipant } from '../core/api';
import type { ParticipantCreate } from '../core/schemas/participant';

export function useCreateParticipant(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participant: ParticipantCreate) =>
      createParticipant(planId, participant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });
}
