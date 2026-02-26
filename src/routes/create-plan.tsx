import { useMemo, useState } from 'react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import PlanForm from '../components/PlanForm';
import PreferencesForm, {
  type PreferencesFormValues,
} from '../components/PreferencesForm';
import Modal from '../components/shared/Modal';
import { useCreatePlan } from '../hooks/useCreatePlan';
import { useUpdateParticipant } from '../hooks/useUpdateParticipant';
import { useAuth } from '../contexts/useAuth';
import { getApiErrorMessage } from '../core/error-utils';
import { supabase } from '../lib/supabase';
import type { PlanFormPayload, DefaultOwner } from '../components/PlanForm';
import type { PlanWithDetails } from '../core/schemas/plan';

export const Route = createFileRoute('/create-plan')({
  component: CreatePlan,
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/signin' });
    }
  },
});

function splitFullName(fullName?: string): { first: string; last: string } {
  if (!fullName) return { first: '', last: '' };
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts[0] ?? '',
    last: parts.slice(1).join(' '),
  };
}

export function CreatePlan() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createPlan = useCreatePlan();
  const { user, loading } = useAuth();
  const [createdPlan, setCreatedPlan] = useState<PlanWithDetails | null>(null);

  const ownerParticipantId = createdPlan?.participants.find(
    (p) => p.role === 'owner'
  )?.participantId;

  const updateParticipant = useUpdateParticipant(createdPlan?.planId ?? '');

  const defaultOwner = useMemo((): DefaultOwner | undefined => {
    if (!user) return undefined;
    const meta = user.user_metadata ?? {};
    const { first, last } = splitFullName(meta.full_name as string);
    return {
      ownerName: (meta.first_name as string) || first,
      ownerLastName: (meta.last_name as string) || last,
      ownerPhone: (meta.phone as string) || '',
      ownerEmail: user.email ?? '',
    };
  }, [user]);

  function navigateToPlan() {
    if (createdPlan?.planId) {
      navigate({ to: '/plan/$planId', params: { planId: createdPlan.planId } });
    } else {
      navigate({ to: '/plans' });
    }
  }

  async function handleSubmit(payload: PlanFormPayload) {
    const created = await createPlan.mutateAsync(payload);
    if (created?.planId) {
      setCreatedPlan(created);
    } else {
      navigate({ to: '/plans' });
    }
  }

  async function handlePreferencesSubmit(values: PreferencesFormValues) {
    if (!ownerParticipantId) {
      navigateToPlan();
      return;
    }
    try {
      await updateParticipant.mutateAsync({
        participantId: ownerParticipantId,
        updates: {
          adultsCount: values.adultsCount ?? null,
          kidsCount: values.kidsCount ?? null,
          foodPreferences: values.foodPreferences || null,
          allergies: values.allergies || null,
          notes: values.notes || null,
        },
      });
      toast.success(t('preferences.updated'));
    } catch (err) {
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
    navigateToPlan();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PlanForm
        onSubmit={handleSubmit}
        isSubmitting={createPlan.isPending}
        defaultOwner={defaultOwner}
      />

      <Modal
        open={!!createdPlan}
        onClose={navigateToPlan}
        title={t('preferences.title')}
      >
        <PreferencesForm
          onSubmit={handlePreferencesSubmit}
          onSkip={navigateToPlan}
          isSubmitting={updateParticipant.isPending}
          inModal
        />
      </Modal>
    </>
  );
}
