import { useState } from 'react';
import {
  createLazyFileRoute,
  Link,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useInvitePlan } from '../hooks/useInvitePlan';
import { useAuth } from '../contexts/useAuth';
import { saveGuestPreferences } from '../core/api';
import { storePendingInvite } from '../core/pending-invite';
import type { InviteParticipant } from '../core/schemas/invite';
import type { ItemCategory } from '../core/schemas/item';
import LocationMap from '../components/LocationMap';
import Modal from '../components/shared/Modal';
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

function InvitePlanPage() {
  const { t } = useTranslation();
  const { planId, inviteToken } = useParams({
    from: '/invite/$planId/$inviteToken',
  });
  const navigate = useNavigate();
  const { data: plan, isLoading, error } = useInvitePlan(planId, inviteToken);
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [showPreferences, setShowPreferences] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    items,
    participants,
  } = plan;
  const CATEGORIES: ItemCategory[] = ['equipment', 'food'];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 sm:p-8 mb-6 text-white">
        <p className="text-sm font-medium text-blue-200 uppercase tracking-wider mb-1">
          {t('invite.pageTitle')}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        {isAuthenticated ? (
          <Link
            to="/plan/$planId"
            params={{ planId }}
            className="w-full sm:w-auto text-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            {t('invite.goToPlan')}
          </Link>
        ) : (
          <>
            <Link
              to="/signin"
              search={{ redirect: `/plan/${planId}` }}
              onClick={() => storePendingInvite(planId, inviteToken)}
              className="w-full sm:w-auto text-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              {t('invite.signInToJoin')}
            </Link>
            <Link
              to="/signup"
              search={{ redirect: `/plan/${planId}` }}
              onClick={() => storePendingInvite(planId, inviteToken)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
            >
              {t('invite.signUpToJoin')}
            </Link>
            <button
              type="button"
              onClick={() => setShowPreferences(true)}
              className="w-full sm:w-auto text-center rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              {t('invite.continueAsGuest')}
            </button>
          </>
        )}
      </div>

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

      {participants.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-7 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {t('invite.participantsTitle')}
            <span className="ms-2 text-sm font-normal text-gray-500">
              ({participants.length})
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <div
                key={p.participantId}
                className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5"
              >
                <div className="w-7 h-7 rounded-full border-2 border-emerald-400 bg-white flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                  {(p.displayName ?? '?').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {p.displayName ?? t('plan.na')}
                </span>
                <span
                  className={clsx(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    roleBadgeColor(p.role)
                  )}
                >
                  {t(`roles.${p.role}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {t('invite.itemsTitle')}
            <span className="ms-2 text-sm font-normal text-gray-500">
              ({items.length})
            </span>
          </h2>
          {CATEGORIES.map((category) => {
            const catItems = items.filter((i) => i.category === category);
            if (catItems.length === 0) return null;
            return (
              <div
                key={category}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                    {t(`categories.${category}`)}
                    <span className="ms-2 text-sm font-normal text-gray-500">
                      ({catItems.length})
                    </span>
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {catItems.map((item) => (
                    <div
                      key={item.itemId}
                      className="px-4 sm:px-5 py-3 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                          {item.name}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ms-3">
                        <span className="text-sm text-gray-600">
                          {item.quantity} {t(`units.${item.unit}`)}
                        </span>
                        <span
                          className={clsx(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            item.status === 'packed' &&
                              'bg-green-100 text-green-700',
                            item.status === 'purchased' &&
                              'bg-blue-100 text-blue-700',
                            item.status === 'pending' &&
                              'bg-gray-100 text-gray-600',
                            item.status === 'canceled' &&
                              'bg-red-100 text-red-600'
                          )}
                        >
                          {t(`itemStatus.${item.status}`)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-7 text-center">
          <p className="text-sm text-gray-500">{t('invite.noItems')}</p>
        </div>
      )}

      <Modal
        open={showPreferences}
        onClose={() => setShowPreferences(false)}
        title={t('invite.guestPreferencesTitle')}
      >
        <PreferencesForm
          onSubmit={handleGuestPreferences}
          onSkip={handleSkipPreferences}
          isSubmitting={isSaving}
          inModal
        />
      </Modal>
    </div>
  );

  async function handleGuestPreferences(values: PreferencesFormValues) {
    setIsSaving(true);
    try {
      await saveGuestPreferences(planId, inviteToken, values);
      toast.success(t('preferences.updated'));
      setShowPreferences(false);
      navigate({ to: '/plan/$planId', params: { planId } });
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
    navigate({ to: '/plan/$planId', params: { planId } });
  }
}
