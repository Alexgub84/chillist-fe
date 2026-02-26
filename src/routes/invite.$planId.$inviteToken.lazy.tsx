import { useState, useEffect, useRef, useMemo } from 'react';
import {
  createLazyFileRoute,
  Link,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useInvitePlan } from '../hooks/useInvitePlan';
import { useAuth } from '../contexts/useAuth';
import {
  claimInvite,
  saveGuestPreferences,
  addGuestItem,
  updateGuestItem,
} from '../core/api';
import { storePendingInvite } from '../core/pending-invite';
import type { InviteParticipant } from '../core/schemas/invite';
import type { ItemCategory, ItemPatch } from '../core/schemas/item';
import type { Participant } from '../core/schemas/participant';
import type { ListFilter } from '../core/schemas/plan-search';
import LocationMap from '../components/LocationMap';
import Modal from '../components/shared/Modal';
import CollapsibleSection from '../components/shared/CollapsibleSection';
import ItemsList from '../components/ItemsList';
import ListTabs from '../components/StatusFilter';
import PreferencesForm from '../components/PreferencesForm';
import type { PreferencesFormValues } from '../components/PreferencesForm';

export const Route = createLazyFileRoute('/invite/$planId/$inviteToken')({
  component: InvitePlanPage,
});

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function roleBadgeColor(role: InviteParticipant['role']) {
  if (role === 'owner') return 'bg-amber-100 text-amber-800';
  if (role === 'viewer') return 'bg-gray-100 text-gray-600';
  return 'bg-blue-100 text-blue-700';
}

export function InvitePlanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { planId, inviteToken } = useParams({
    from: '/invite/$planId/$inviteToken',
  });
  const { data: plan, isLoading, error } = useInvitePlan(planId, inviteToken);
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [authModalShown, setAuthModalShown] = useState(false);
  const [listFilter, setListFilter] = useState<ListFilter | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const claimAttempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !plan || claimAttempted.current) return;
    claimAttempted.current = true;
    setIsRedirecting(true);

    console.info(
      `[InvitePage] Authenticated user detected — claiming invite and redirecting to plan. planId="${planId}", token="${inviteToken.slice(0, 8)}…".`
    );

    claimInvite(planId, inviteToken)
      .catch((err) => {
        console.debug(
          `[InvitePage] claimInvite returned error (may already be claimed) — planId="${planId}". Error: ${err instanceof Error ? err.message : String(err)}`
        );
      })
      .finally(() => {
        queryClient.invalidateQueries();
        navigate({ to: '/plan/$planId', params: { planId } });
      });
  }, [isAuthenticated, plan, planId, inviteToken, navigate, queryClient]);

  const shouldShowAuthModal =
    !isAuthenticated &&
    !!plan &&
    plan.myRsvpStatus === 'pending' &&
    !authModalShown;

  useEffect(() => {
    if (shouldShowAuthModal) {
      setShowAuthOptions(true);
      setAuthModalShown(true);
    }
  }, [shouldShowAuthModal]);

  const participantsAsFullType: Participant[] = useMemo(
    () =>
      (plan?.participants ?? []).map((p) => ({
        participantId: p.participantId,
        planId: planId,
        name: p.displayName ?? '?',
        lastName: '',
        contactPhone: '',
        role: p.role,
        rsvpStatus: 'pending' as const,
        createdAt: '',
        updatedAt: '',
      })),
    [plan?.participants, planId]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !plan) {
    console.error(
      `[InvitePage] Cannot display invite — planId="${planId}", token="${inviteToken.slice(0, 8)}…". ` +
        `Error: ${error ? `${error.name}: ${error.message}` : 'plan data is null/undefined (no error thrown)'}`
    );
    return (
      <div className="py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {t('invite.invalidLink')}
        </h1>
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-800 underline font-medium"
        >
          {t('invite.backToHome')}
        </Link>
      </div>
    );
  }

  const {
    title,
    description,
    startDate,
    endDate,
    location,
    participants,
    items,
    myParticipantId,
    myRsvpStatus,
    myPreferences,
  } = plan;

  const hasResponded = myRsvpStatus !== 'pending';

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl p-6 sm:p-8 mb-6 text-white">
        <p className="text-sm font-medium text-blue-200 uppercase tracking-wider mb-1">
          {t('invite.pageTitle')}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
      </div>

      {isRedirecting && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm font-medium text-gray-600">
            {t('invite.redirecting')}
          </span>
        </div>
      )}

      {renderPlanDetails()}
      {renderParticipants()}
      {hasResponded && !isAuthenticated && (
        <>
          <Link
            to="/items/$planId"
            params={{ planId }}
            search={{ token: inviteToken }}
            className="block bg-white rounded-xl shadow-sm border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all p-4 sm:p-5 mb-4 group"
          >
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                  {t('items.manageItems')}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {t('items.manageItemsDesc')}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-blue-500 ms-auto shrink-0 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          <div className="flex items-center justify-between mb-4">
            <ListTabs
              selected={listFilter}
              onChange={setListFilter}
              counts={listCounts}
              total={items.length}
            />
            {!showAddItem && (
              <button
                type="button"
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                {t('invite.addItem')}
              </button>
            )}
          </div>

          {showAddItem && (
            <div className="mb-4">
              <GuestItemForm
                onSubmit={handleAddItem}
                onCancel={() => setShowAddItem(false)}
              />
            </div>
          )}

          {items.length > 0 ? (
            <div className="mb-6">
              <ItemsList
                items={filteredItems}
                participants={participantsAsFullType}
                listFilter={listFilter}
                selfAssignParticipantId={myParticipantId}
                canEditItem={(item) =>
                  !!myParticipantId &&
                  item.assignedParticipantId === myParticipantId
                }
                onEditItem={(itemId) => setEditingItemId(itemId)}
                onUpdateItem={handleUpdateItem}
                groupBySubcategory
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-5 sm:p-7 text-center mb-6">
              <p className="text-sm text-gray-500">{t('invite.noItems')}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-700 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 shrink-0 text-blue-400"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>{t('invite.betterExperience')}</span>
            <Link
              to="/signin"
              search={{ redirect: `/plan/${planId}` }}
              onClick={() => storePendingInvite(planId, inviteToken)}
              className="font-semibold underline hover:text-blue-900 transition-colors"
            >
              {t('invite.signIn')}
            </Link>
            <span>{t('invite.or')}</span>
            <Link
              to="/signup"
              search={{ redirect: `/plan/${planId}` }}
              onClick={() => storePendingInvite(planId, inviteToken)}
              className="font-semibold underline hover:text-blue-900 transition-colors"
            >
              {t('invite.signUp')}
            </Link>
          </div>
        </>
      )}

      <Modal
        open={showAuthOptions}
        onClose={() => setShowAuthOptions(false)}
        title={t('invite.pageTitle')}
      >
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
          <p className="text-sm text-gray-500 mb-2">
            {t('invite.authModalSubtitle')}
          </p>
          <Link
            to="/signin"
            search={{ redirect: `/plan/${planId}` }}
            onClick={() => storePendingInvite(planId, inviteToken)}
            className="block w-full text-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            {t('invite.signInToJoin')}
          </Link>
          <Link
            to="/signup"
            search={{ redirect: `/plan/${planId}` }}
            onClick={() => storePendingInvite(planId, inviteToken)}
            className="block w-full text-center rounded-lg border border-blue-600 px-6 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            {t('invite.signUpToJoin')}
          </Link>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">
                {t('invite.or')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowAuthOptions(false);
              setShowPreferences(true);
            }}
            className="w-full text-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            {t('invite.continueAsGuest')}
          </button>
        </div>
      </Modal>

      <Modal
        open={showPreferences}
        onClose={() => setShowPreferences(false)}
        title={t('invite.guestPreferencesTitle')}
      >
        <PreferencesForm
          onSubmit={handleGuestPreferences}
          onSkip={hasResponded ? undefined : handleSkipPreferences}
          onCancel={hasResponded ? () => setShowPreferences(false) : undefined}
          isSubmitting={isSaving}
          inModal
          showRsvp
          defaultValues={{
            rsvpStatus:
              myRsvpStatus === 'confirmed' || myRsvpStatus === 'not_sure'
                ? myRsvpStatus
                : undefined,
            adultsCount: myPreferences?.adultsCount ?? 1,
            kidsCount: myPreferences?.kidsCount ?? undefined,
            foodPreferences: myPreferences?.foodPreferences ?? '',
            allergies: myPreferences?.allergies ?? '',
            notes: myPreferences?.notes ?? '',
          }}
        />
      </Modal>

      <Modal
        open={editingItemId !== null}
        onClose={() => setEditingItemId(null)}
        title={t('invite.editItem')}
      >
        {editingItemId && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <GuestItemForm
              defaultValues={(() => {
                const item = items.find((i) => i.itemId === editingItemId);
                if (!item) return undefined;
                return {
                  name: item.name,
                  category: item.category,
                  quantity: item.quantity,
                  unit: item.unit,
                  notes: item.notes ?? '',
                };
              })()}
              onSubmit={(values) => handleEditItem(editingItemId, values)}
              onCancel={() => setEditingItemId(null)}
              submitLabel={t('invite.updateItem')}
            />
          </div>
        )}
      </Modal>
    </div>
  );

  function renderPlanDetails() {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 sm:p-7 space-y-5 mb-6">
        {description && (
          <div>
            <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">
              {t('plan.description')}
            </p>
            <p className="text-sm sm:text-base text-gray-700">{description}</p>
          </div>
        )}

        <div className="flex gap-8 sm:gap-12">
          <div>
            <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">
              {t('plan.start')}
            </p>
            <p className="text-sm sm:text-base font-semibold text-gray-800">
              {startDate ? formatDateShort(startDate) : t('plan.na')}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">
              {t('plan.end')}
            </p>
            <p className="text-sm sm:text-base font-semibold text-gray-800">
              {endDate ? formatDateShort(endDate) : t('plan.na')}
            </p>
          </div>
        </div>

        {location && (
          <div>
            <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-2">
              {t('plan.location')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {location.latitude != null && location.longitude != null && (
                <LocationMap
                  latitude={location.latitude}
                  longitude={location.longitude}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-semibold text-gray-800">
                  {location.name}
                </p>
                {(location.city || location.region || location.country) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[location.city, location.region, location.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderParticipants() {
    if (participants.length === 0) return null;

    return (
      <CollapsibleSection
        title={
          <h2 className="text-lg font-semibold text-gray-800">
            {t('invite.participantsTitle')}
            <span className="ms-2 text-sm font-normal text-gray-500">
              ({participants.length})
            </span>
          </h2>
        }
        wrapperClassName="bg-white rounded-xl shadow-sm overflow-hidden mb-6"
        buttonClassName="group w-full px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
        panelContentClassName="border-t border-gray-200 px-5 sm:px-7 py-4 sm:py-5"
      >
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => {
            const isMe = p.participantId === myParticipantId;
            return (
              <div
                key={p.participantId}
                className={clsx(
                  'flex items-center gap-2 rounded-full px-3 py-1.5',
                  isMe ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-gray-50'
                )}
              >
                <div className="w-7 h-7 rounded-full border-2 border-emerald-400 bg-white flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                  {(p.displayName ?? '?').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {p.displayName ?? t('plan.na')}
                  {isMe && (
                    <span className="text-xs text-blue-500 ms-1">
                      ({t('invite.you')})
                    </span>
                  )}
                </span>
                <span
                  className={clsx(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    roleBadgeColor(p.role)
                  )}
                >
                  {t(`roles.${p.role}`)}
                </span>
                {isMe && hasResponded && (
                  <button
                    type="button"
                    onClick={() => setShowPreferences(true)}
                    className="ms-1 text-blue-500 hover:text-blue-700 transition-colors"
                    title={t('invite.editPreferences')}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleSection>
    );
  }

  async function handleGuestPreferences(values: PreferencesFormValues) {
    setIsSaving(true);
    try {
      await saveGuestPreferences(planId, inviteToken, {
        ...values,
        rsvpStatus: values.rsvpStatus ?? undefined,
      });
      console.info(
        `[InvitePage] Guest preferences saved — planId="${planId}", token="${inviteToken.slice(0, 8)}…".`
      );
      toast.success(t('preferences.updated'));
      setShowPreferences(false);
      queryClient.invalidateQueries({
        queryKey: ['invite', planId, inviteToken],
      });
    } catch (err) {
      console.error(
        `[InvitePage] saveGuestPreferences failed — planId="${planId}", token="${inviteToken.slice(0, 8)}…". ` +
          `Error: ${err instanceof Error ? err.message : String(err)}`
      );
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleSkipPreferences() {
    setShowPreferences(false);
  }

  async function handleAddItem(values: GuestItemFormValues) {
    try {
      await addGuestItem(planId, inviteToken, values);
      toast.success(t('invite.itemAdded'));
      setShowAddItem(false);
      queryClient.invalidateQueries({
        queryKey: ['invite', planId, inviteToken],
      });
    } catch (err) {
      console.error(
        `[InvitePage] addGuestItem failed — planId="${planId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      toast.error(t('errors.somethingWentWrong'));
    }
  }

  async function handleEditItem(itemId: string, values: GuestItemFormValues) {
    try {
      await updateGuestItem(planId, inviteToken, itemId, { ...values });
      toast.success(t('invite.itemUpdated'));
      setEditingItemId(null);
      queryClient.invalidateQueries({
        queryKey: ['invite', planId, inviteToken],
      });
    } catch (err) {
      console.error(
        `[InvitePage] updateGuestItem failed — planId="${planId}", itemId="${itemId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      toast.error(t('errors.somethingWentWrong'));
    }
  }

  async function handleUpdateItem(itemId: string, updates: ItemPatch) {
    try {
      await updateGuestItem(planId, inviteToken, itemId, updates);
      queryClient.invalidateQueries({
        queryKey: ['invite', planId, inviteToken],
      });
    } catch (err) {
      console.error(
        `[InvitePage] updateGuestItem (inline) failed — planId="${planId}", itemId="${itemId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      toast.error(t('errors.somethingWentWrong'));
    }
  }
}

interface GuestItemFormValues {
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  notes: string;
}

function GuestItemForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaultValues?: Partial<GuestItemFormValues>;
  onSubmit: (values: GuestItemFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [category, setCategory] = useState<ItemCategory>(
    defaultValues?.category ?? 'equipment'
  );
  const [quantity, setQuantity] = useState(defaultValues?.quantity ?? 1);
  const [unit, setUnit] = useState(defaultValues?.unit ?? 'pcs');
  const [notes, setNotes] = useState(defaultValues?.notes ?? '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), category, quantity, unit, notes });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 rounded-lg p-4 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('invite.itemNamePlaceholder')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="equipment">{t('categories.equipment')}</option>
            <option value="food">{t('categories.food')}</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min={1}
            className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="pcs">{t('units.pcs')}</option>
            <option value="kg">{t('units.kg')}</option>
            <option value="g">{t('units.g')}</option>
            <option value="l">{t('units.l')}</option>
            <option value="ml">{t('units.ml')}</option>
            <option value="pack">{t('units.pack')}</option>
            <option value="set">{t('units.set')}</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('invite.itemNotesPlaceholder')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          {t('addParticipant.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitLabel ?? t('invite.addItem')}
        </button>
      </div>
    </form>
  );
}
