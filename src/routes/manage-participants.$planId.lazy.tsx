import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createLazyFileRoute,
  Link,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { usePlan } from '../hooks/usePlan';
import { useCreateParticipant } from '../hooks/useCreateParticipant';
import { useUpdateParticipant } from '../hooks/useUpdateParticipant';
import { useAuth } from '../contexts/useAuth';
import type { ParticipantCreate } from '../core/schemas/participant';
import { isNotParticipantResponse } from '../core/schemas/plan';
import { getApiErrorMessage } from '../core/error-utils';
import type { PreferencesFormValues } from '../components/PreferencesForm';
import clsx from 'clsx';
import type { JoinRequest } from '../core/schemas/join-request';
import ErrorPage from './ErrorPage';
import ParticipantDetails from '../components/ParticipantDetails';
import { AddParticipantForm } from '../components/AddParticipantForm';
import PreferencesForm from '../components/PreferencesForm';
import Modal from '../components/shared/Modal';
import CollapsibleSection from '../components/shared/CollapsibleSection';

export const Route = createLazyFileRoute('/manage-participants/$planId')({
  component: ManageParticipantsPage,
  errorComponent: ErrorPage,
});

function ManageParticipantsPage() {
  const { t } = useTranslation();
  const { planId } = useParams({ from: '/manage-participants/$planId' });
  const { data: plan, isLoading, error } = usePlan(planId);
  const createParticipantMutation = useCreateParticipant(planId);
  const updateParticipantMutation = useUpdateParticipant(planId);
  const { user } = useAuth();
  const navigate = useNavigate({ from: '/manage-participants/$planId' });
  const [editingParticipantId, setEditingParticipantId] = useState<
    string | null
  >(null);
  const [transferTargetParticipantId, setTransferTargetParticipantId] =
    useState<string | null>(null);
  const [showAddParticipant, setShowAddParticipant] = useState(false);

  const isOwner =
    !!user &&
    !!plan &&
    !isNotParticipantResponse(plan) &&
    plan.participants.some((p) => p.role === 'owner' && p.userId === user.id);
  const currentParticipant =
    user && plan && !isNotParticipantResponse(plan)
      ? plan.participants.find((p) => p.userId === user.id)
      : undefined;

  useEffect(() => {
    if (plan && !isOwner) {
      navigate({ to: '/plan/$planId', params: { planId } });
    }
  }, [plan, isOwner, navigate, planId]);

  if (isLoading) {
    return <div className="text-center py-10">{t('plan.loading')}</div>;
  }

  if (error) throw error;
  if (!plan) throw new Error(t('plan.notFound'));

  if (!isOwner || isNotParticipantResponse(plan)) {
    return null;
  }

  const editingParticipant = editingParticipantId
    ? plan.participants.find((p) => p.participantId === editingParticipantId)
    : null;

  async function handlePreferencesSubmit(values: PreferencesFormValues) {
    if (!editingParticipantId) return;
    try {
      await updateParticipantMutation.mutateAsync({
        participantId: editingParticipantId,
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
      console.error(
        `[ManageParticipants] handlePreferencesSubmit failed — planId="${planId}", participantId="${editingParticipantId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
    setEditingParticipantId(null);
  }

  async function handleTransferOwnership() {
    if (!transferTargetParticipantId) return;
    try {
      await updateParticipantMutation.mutateAsync({
        participantId: transferTargetParticipantId,
        updates: { role: 'owner' },
      });
      toast.success(t('participantDetails.addOwnerSuccess'));
      setTransferTargetParticipantId(null);
    } catch (err) {
      console.error(
        `[ManageParticipants] handleTransferOwnership failed — planId="${planId}", participantId="${transferTargetParticipantId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  async function handleAddParticipant(p: ParticipantCreate) {
    try {
      await createParticipantMutation.mutateAsync(p);
      toast.success(t('manageParticipants.participantAdded'));
      setShowAddParticipant(false);
    } catch (err) {
      console.error(
        `[ManageParticipants] handleAddParticipant failed — planId="${planId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  return (
    <div className="w-full px-3 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Link
            to="/plan/$planId"
            params={{ planId }}
            className="text-blue-500 hover:underline text-sm sm:text-base"
          >
            {t('manageParticipants.backToPlan')}
          </Link>
        </div>

        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
          {t('manageParticipants.title')}
        </h1>

        <div className="mb-6 sm:mb-8 flex items-center gap-3">
          <button
            type="button"
            data-testid="add-participant-button"
            onClick={() => setShowAddParticipant(true)}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm"
          >
            {t('plan.addParticipant')}
          </button>
        </div>

        {plan.participants.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <ParticipantDetails
              participants={plan.participants}
              planId={planId}
              planTitle={plan.title}
              isOwner={true}
              currentParticipantId={currentParticipant?.participantId}
              onEditPreferences={setEditingParticipantId}
              onMakeOwner={setTransferTargetParticipantId}
            />
          </div>
        )}

        <div className="mt-6 sm:mt-8">
          <CollapsibleSection
            title={
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                {t('manageParticipants.joinRequests')}
                {(plan.joinRequests?.length ?? 0) > 0 && (
                  <span className="ms-2 text-sm font-normal text-gray-500">
                    ({plan.joinRequests?.length ?? 0})
                  </span>
                )}
              </h2>
            }
            defaultOpen
            wrapperClassName="bg-white rounded-lg shadow-sm overflow-hidden"
            panelContentClassName="border-t border-gray-200 p-4 sm:p-5"
          >
            {plan.joinRequests?.length ? (
              <div className="space-y-3">
                {plan.joinRequests.map((req) => (
                  <JoinRequestCard key={req.requestId} request={req} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm sm:text-base">
                {t('manageParticipants.noRequests')}
              </p>
            )}
          </CollapsibleSection>
        </div>

        <Modal
          open={showAddParticipant}
          onClose={() => setShowAddParticipant(false)}
          title={t('plan.addParticipant')}
          testId="add-participant-modal"
        >
          <AddParticipantForm
            onSubmit={handleAddParticipant}
            onCancel={() => setShowAddParticipant(false)}
            isSubmitting={createParticipantMutation.isPending}
          />
        </Modal>

        <Modal
          open={!!editingParticipant}
          onClose={() => setEditingParticipantId(null)}
          title={`${editingParticipant?.name ?? ''} ${editingParticipant?.lastName ?? ''}`}
        >
          {editingParticipant && (
            <PreferencesForm
              key={editingParticipant.participantId}
              defaultValues={{
                adultsCount: editingParticipant.adultsCount ?? undefined,
                kidsCount: editingParticipant.kidsCount ?? undefined,
                foodPreferences:
                  editingParticipant.foodPreferences ?? undefined,
                allergies: editingParticipant.allergies ?? undefined,
                notes: editingParticipant.notes ?? undefined,
              }}
              onSubmit={handlePreferencesSubmit}
              onCancel={() => setEditingParticipantId(null)}
              isSubmitting={updateParticipantMutation.isPending}
              inModal
            />
          )}
        </Modal>

        <Modal
          open={transferTargetParticipantId !== null}
          onClose={() => setTransferTargetParticipantId(null)}
          title={t('participantDetails.addOwnerTitle')}
          testId="add-owner-dialog"
        >
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
            <p className="text-sm text-gray-600">
              {t('participantDetails.addOwnerMessage', {
                name: (() => {
                  const target = plan.participants.find(
                    (x) => x.participantId === transferTargetParticipantId
                  );
                  return target ? `${target.name} ${target.lastName}` : '';
                })(),
              })}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                data-testid="transfer-ownership-confirm"
                disabled={updateParticipantMutation.isPending}
                onClick={handleTransferOwnership}
                className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {t('participantDetails.addOwnerConfirm')}
              </button>
              <button
                type="button"
                disabled={updateParticipantMutation.isPending}
                onClick={() => setTransferTargetParticipantId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
              >
                {t('participantDetails.addOwnerCancel')}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

function JoinRequestCard({ request: req }: { request: JoinRequest }) {
  const { t } = useTranslation();
  const peopleParts: string[] = [];
  if (req.adultsCount != null && req.adultsCount > 0) {
    peopleParts.push(
      t('participantDetails.adults', { count: req.adultsCount })
    );
  }
  if (req.kidsCount != null && req.kidsCount > 0) {
    peopleParts.push(t('participantDetails.kids', { count: req.kidsCount }));
  }
  const foodParts: string[] = [];
  if (req.foodPreferences) foodParts.push(req.foodPreferences);
  if (req.allergies) foodParts.push(req.allergies);
  const filled = peopleParts.length > 0 || foodParts.length > 0 || !!req.notes;

  function statusBadgeColor(status: JoinRequest['status']) {
    if (status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full border-2 border-amber-300 bg-white flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
            {req.name.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-medium text-gray-800 wrap-break-word">
              {req.name} {req.lastName}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={clsx(
                  'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                  statusBadgeColor(req.status)
                )}
              >
                {t(`manageParticipants.requestStatus_${req.status}`)}
              </span>
            </div>
          </div>
        </div>
      </div>
      {!filled && (
        <p className="text-sm text-gray-400 italic">
          {t('participantDetails.notFilled')}
        </p>
      )}
      {filled && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          {peopleParts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                {t('participantDetails.people')}
              </p>
              <p className="text-sm text-gray-700">{peopleParts.join(', ')}</p>
            </div>
          )}
          {foodParts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                {t('participantDetails.food')}
              </p>
              <p className="text-sm text-gray-700">{foodParts.join(' · ')}</p>
            </div>
          )}
          {req.notes && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                {t('participantDetails.notes')}
              </p>
              <p className="text-sm text-gray-700">{req.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
