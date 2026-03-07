import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createLazyFileRoute, Link, useParams } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { usePlan } from '../hooks/usePlan';
import { useExpenses } from '../hooks/useExpenses';
import { useCreateExpense } from '../hooks/useCreateExpense';
import { useUpdateExpense } from '../hooks/useUpdateExpense';
import { useDeleteExpense } from '../hooks/useDeleteExpense';
import { usePlanRole } from '../hooks/usePlanRole';
import { useAuth } from '../contexts/useAuth';
import { useScrollRestore } from '../hooks/useScrollRestore';
import {
  isNotParticipantResponse,
  type PlanWithDetails,
} from '../core/schemas/plan';
import type { Expense } from '../core/schemas/expense';
import type { ExpenseFormValues } from '../components/ExpenseForm';
import ExpenseForm from '../components/ExpenseForm';
import Modal from '../components/shared/Modal';
import PlanProvider from '../contexts/PlanProvider';
import { usePlanContext } from '../hooks/usePlanContext';
import { getApiErrorMessage } from '../core/error-utils';
import ErrorPage from './ErrorPage';

export const Route = createLazyFileRoute('/expenses/$planId')({
  component: ExpensesPage,
  errorComponent: ErrorPage,
});

export function ExpensesPage() {
  const { planId } = useParams({ from: '/expenses/$planId' });
  const {
    data: plan,
    isLoading: planLoading,
    error: planError,
  } = usePlan(planId);
  const { t } = useTranslation();

  if (planLoading) {
    return <div className="text-center py-10">{t('plan.loading')}</div>;
  }
  if (planError) throw planError;
  if (!plan) throw new Error(t('plan.notFound'));
  if (isNotParticipantResponse(plan)) return null;

  return (
    <PlanProvider plan={plan}>
      <ExpensesContent planId={planId} plan={plan} />
    </PlanProvider>
  );
}

function ExpensesContent({
  planId,
  plan,
}: {
  planId: string;
  plan: PlanWithDetails;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const planCtx = usePlanContext();
  const planCurrency = planCtx?.planCurrency ?? '';
  const { data: expensesData, isLoading } = useExpenses(planId);
  const createExpenseMutation = useCreateExpense(planId);
  const updateExpenseMutation = useUpdateExpense(planId);
  const deleteExpenseMutation = useDeleteExpense(planId);
  const { isOwner, currentParticipant } = usePlanRole(plan);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(
    null
  );

  useScrollRestore(`expenses-${planId}`, !isLoading);

  const expenses = expensesData?.expenses ?? [];
  const summary = expensesData?.summary ?? [];

  function canEditExpense(expense: Expense): boolean {
    if (isOwner) return true;
    return !!user && expense.createdByUserId === user.id;
  }

  function getParticipantName(participantId: string): string {
    const p = plan.participants.find((x) => x.participantId === participantId);
    return p ? `${p.name} ${p.lastName}` : participantId.slice(0, 8);
  }

  function formatAmount(amount: string): string {
    const num = parseFloat(amount);
    return isNaN(num) ? amount : num.toFixed(2);
  }

  async function handleCreate(values: ExpenseFormValues) {
    try {
      await createExpenseMutation.mutateAsync(values);
      toast.success(t('expenses.addSuccess'));
      setAddModalOpen(false);
    } catch (err) {
      console.error(
        `[ExpensesPage] createExpense failed — planId="${planId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  async function handleUpdate(values: ExpenseFormValues) {
    if (!editingExpense) return;
    try {
      await updateExpenseMutation.mutateAsync({
        expenseId: editingExpense.expenseId,
        updates: {
          amount: values.amount,
          description: values.description || null,
        },
      });
      toast.success(t('expenses.updateSuccess'));
      setEditingExpense(null);
    } catch (err) {
      console.error(
        `[ExpensesPage] updateExpense failed — expenseId="${editingExpense.expenseId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  async function handleDelete() {
    if (!deletingExpenseId) return;
    try {
      await deleteExpenseMutation.mutateAsync(deletingExpenseId);
      toast.success(t('expenses.deleteSuccess'));
      setDeletingExpenseId(null);
    } catch (err) {
      console.error(
        `[ExpensesPage] deleteExpense failed — expenseId="${deletingExpenseId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  const grandTotal = summary.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="w-full px-3 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <Link
            to="/plan/$planId"
            params={{ planId }}
            className="text-blue-500 hover:underline text-sm sm:text-base"
          >
            {t('expenses.backToPlan')}
          </Link>
          <button
            type="button"
            data-testid="add-expense-btn"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t('expenses.addExpense')}
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
          {t('expenses.title')}
        </h1>
        <p className="text-sm text-gray-500 mb-6">{plan.title}</p>

        {summary.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {t('expenses.summary')}
            </h2>
            <div className="space-y-2">
              {summary.map((s) => (
                <div
                  key={s.participantId}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-700">
                    {getParticipantName(s.participantId)}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {s.totalAmount.toFixed(2)} {planCurrency}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                <span className="text-sm font-semibold text-gray-800">
                  {t('expenses.totalExpenses')}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {grandTotal.toFixed(2)} {planCurrency}
                </span>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-10 text-gray-500">
            {t('plan.loading')}
          </div>
        )}

        {!isLoading && expenses.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
            <p className="text-gray-500 text-sm sm:text-base">
              {t('expenses.noExpenses')}
            </p>
          </div>
        )}

        {!isLoading && expenses.length > 0 && (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const editable = canEditExpense(expense);
              return (
                <div
                  key={expense.expenseId}
                  className="bg-white rounded-lg shadow-sm p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-base font-semibold text-gray-900">
                        {formatAmount(expense.amount)} {planCurrency}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getParticipantName(expense.participantId)}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {expense.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {editable && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        data-testid={`edit-expense-${expense.expenseId}`}
                        onClick={() => setEditingExpense(expense)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        aria-label={t('expenses.editExpense')}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        data-testid={`delete-expense-${expense.expenseId}`}
                        onClick={() => setDeletingExpenseId(expense.expenseId)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label={t('expenses.deleteExpense')}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Modal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title={t('expenses.addExpense')}
          testId="add-expense-modal"
        >
          <ExpenseForm
            key={addModalOpen ? 'open' : 'closed'}
            participants={plan.participants}
            isOwner={isOwner}
            currentParticipantId={currentParticipant?.participantId}
            onSubmit={handleCreate}
            onCancel={() => setAddModalOpen(false)}
            isSubmitting={createExpenseMutation.isPending}
            currency={planCurrency}
          />
        </Modal>

        <Modal
          open={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          title={t('expenses.editExpense')}
          testId="edit-expense-modal"
        >
          {editingExpense && (
            <ExpenseForm
              key={editingExpense.expenseId}
              defaultValues={{
                participantId: editingExpense.participantId,
                amount: parseFloat(editingExpense.amount),
                description: editingExpense.description ?? '',
              }}
              participants={plan.participants}
              isOwner={isOwner}
              currentParticipantId={currentParticipant?.participantId}
              onSubmit={handleUpdate}
              onCancel={() => setEditingExpense(null)}
              isSubmitting={updateExpenseMutation.isPending}
              submitLabel={t('expenses.editExpense')}
              currency={planCurrency}
            />
          )}
        </Modal>

        <Modal
          open={!!deletingExpenseId}
          onClose={() => setDeletingExpenseId(null)}
          title={t('expenses.deleteConfirmTitle')}
          testId="delete-expense-modal"
        >
          <div className="p-4 sm:p-6 space-y-4">
            <p className="text-sm text-gray-600">
              {t('expenses.deleteConfirmMessage')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingExpenseId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('expenses.deleteCancel')}
              </button>
              <button
                type="button"
                data-testid="confirm-delete-expense"
                onClick={handleDelete}
                disabled={deleteExpenseMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {t('expenses.deleteConfirm')}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
