import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Receipt, CheckCircle, XCircle, Banknote, Trash2, Send } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import {
  useMyExpenses,
  useAllExpenses,
  useCreateExpense,
  useSubmitExpense,
  useReviewExpense,
  useMarkExpensePaid,
  useDeleteExpense,
} from '@/hooks/useExpenses';
import type { ExpenseClaim, ExpenseCategory, ExpenseStatus } from '@hrms/shared-types';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  TRAVEL: '✈️ Travel',
  FOOD: '🍽️ Food',
  ACCOMMODATION: '🏨 Accommodation',
  COMMUNICATION: '📱 Communication',
  TRAINING: '📚 Training',
  EQUIPMENT: '💻 Equipment',
  MEDICAL: '🏥 Medical',
  OTHER: '📦 Other',
};

const STATUS_META: Record<ExpenseStatus, { label: string; className: string }> = {
  DRAFT:     { label: 'Draft',     className: 'bg-gray-100 text-gray-600 border-gray-200' },
  SUBMITTED: { label: 'Pending',   className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  APPROVED:  { label: 'Approved',  className: 'bg-green-100 text-green-700 border-green-200' },
  REJECTED:  { label: 'Rejected',  className: 'bg-red-100 text-red-700 border-red-200' },
  PAID:      { label: 'Paid',      className: 'bg-blue-100 text-blue-700 border-blue-200' },
};

function StatusBadge({ status }: { status: ExpenseStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${m.className}`}>
      {m.label}
    </span>
  );
}

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const isHR = HR_ROLES.includes(user?.role as typeof HR_ROLES[number]);

  const myExpenses = useMyExpenses();
  const allExpenses = useAllExpenses();
  const submitExpense = useSubmitExpense();
  const reviewExpense = useReviewExpense();
  const markPaid = useMarkExpensePaid();
  const deleteExpense = useDeleteExpense();

  const [showCreate, setShowCreate] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ claim: ExpenseClaim; action: 'APPROVE' | 'REJECT' } | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const claims = isHR ? (allExpenses.data ?? []) : (myExpenses.data ?? []);
  const loading = isHR ? allExpenses.isLoading : myExpenses.isLoading;

  // Summary stats
  const totalSubmitted = claims.filter(c => c.status === 'SUBMITTED').reduce((s, c) => s + c.amount, 0);
  const totalApproved = claims.filter(c => c.status === 'APPROVED').reduce((s, c) => s + c.amount, 0);
  const totalPaid = claims.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Claims</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isHR ? 'Manage and approve employee expense claims' : 'Submit and track your expense reimbursements'}
          </p>
        </div>
        {!isHR && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            New Claim
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label={isHR ? 'Pending Review' : 'Pending'} value={fmt(totalSubmitted)}
          icon={<Receipt className="w-5 h-5 text-yellow-600" />} bg="bg-yellow-50" />
        <SummaryCard label="Approved" value={fmt(totalApproved)}
          icon={<CheckCircle className="w-5 h-5 text-green-600" />} bg="bg-green-50" />
        <SummaryCard label="Paid Out" value={fmt(totalPaid)}
          icon={<Banknote className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" />
      </div>

      {/* Claims table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No expense claims yet</p>
            {!isHR && (
              <button onClick={() => setShowCreate(true)}
                className="mt-4 text-indigo-600 text-sm font-medium hover:underline">
                Create your first claim →
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {isHR && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  {isHR && (
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {claim.employee ? `${claim.employee.firstName} ${claim.employee.lastName}` : '—'}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{claim.title}</div>
                    {claim.description && (
                      <div className="text-xs text-gray-400 truncate max-w-48">{claim.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {CATEGORY_LABELS[claim.category]}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {fmt(claim.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {format(new Date(claim.expenseDate), 'd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={claim.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {/* Employee actions */}
                      {!isHR && claim.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => submitExpense.mutate(claim.id)}
                            className="p-1.5 rounded text-indigo-600 hover:bg-indigo-50"
                            title="Submit"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteExpense.mutate(claim.id)}
                            className="p-1.5 rounded text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {/* HR actions */}
                      {isHR && claim.status === 'SUBMITTED' && (
                        <>
                          <button
                            onClick={() => { setReviewModal({ claim, action: 'APPROVE' }); setReviewNote(''); }}
                            className="p-1.5 rounded text-green-600 hover:bg-green-50"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setReviewModal({ claim, action: 'REJECT' }); setReviewNote(''); }}
                            className="p-1.5 rounded text-red-500 hover:bg-red-50"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {isHR && claim.status === 'APPROVED' && (
                        <button
                          onClick={() => markPaid.mutate(claim.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Banknote className="w-3 h-3" />
                          Mark Paid
                        </button>
                      )}
                      {claim.receiptUrl && (
                        <a href={claim.receiptUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-indigo-500 hover:underline">
                          Receipt
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showCreate && <CreateExpenseModal onClose={() => setShowCreate(false)} />}

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-1">
              {reviewModal.action === 'APPROVE' ? 'Approve' : 'Reject'} Expense
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              "{reviewModal.claim.title}" — {fmt(reviewModal.claim.amount)}
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none"
              rows={3}
              placeholder="Add a note for the employee..."
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setReviewModal(null)}
                className="flex-1 py-2 border rounded-lg text-sm">Cancel</button>
              <button
                onClick={() => {
                  reviewExpense.mutate({
                    id: reviewModal.claim.id,
                    action: reviewModal.action,
                    reviewNote: reviewNote || undefined,
                  });
                  setReviewModal(null);
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium text-white ${
                  reviewModal.action === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewModal.action === 'APPROVE' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, bg }: { label: string; value: string; icon: React.ReactNode; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 flex items-center gap-4`}>
      <div className="p-2 bg-background/80 rounded-lg shadow-sm">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

const CATEGORIES: ExpenseCategory[] = ['TRAVEL', 'FOOD', 'ACCOMMODATION', 'COMMUNICATION', 'TRAINING', 'EQUIPMENT', 'MEDICAL', 'OTHER'];

function CreateExpenseModal({ onClose }: { onClose: () => void }) {
  const createExpense = useCreateExpense();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'OTHER' as ExpenseCategory,
    amount: '',
    expenseDate: format(new Date(), 'yyyy-MM-dd'),
    receiptUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.expenseDate) return;
    await createExpense.mutateAsync({
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      amount: parseFloat(form.amount),
      expenseDate: form.expenseDate,
      receiptUrl: form.receiptUrl || undefined,
    });
    onClose();
  };

  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {node}
    </div>
  );

  const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h2 className="text-lg font-bold mb-4">New Expense Claim</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {field('Title *', input({
            value: form.title,
            onChange: e => setForm(f => ({ ...f, title: e.target.value })),
            placeholder: 'e.g. Client dinner – Mumbai trip',
            required: true,
          }))}
          <div className="grid grid-cols-2 gap-4">
            {field('Category', (
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            ))}
            {field('Amount (₹) *', input({
              type: 'number',
              value: form.amount,
              onChange: e => setForm(f => ({ ...f, amount: e.target.value })),
              placeholder: '0',
              min: '0',
              step: '0.01',
              required: true,
            }))}
          </div>
          {field('Expense Date *', input({
            type: 'date',
            value: form.expenseDate,
            onChange: e => setForm(f => ({ ...f, expenseDate: e.target.value })),
            required: true,
          }))}
          {field('Description', (
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              rows={2}
              placeholder="Optional details..."
            />
          ))}
          {field('Receipt URL (optional)', input({
            value: form.receiptUrl,
            onChange: e => setForm(f => ({ ...f, receiptUrl: e.target.value })),
            placeholder: 'https://...',
            type: 'url',
          }))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={createExpense.isPending}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {createExpense.isPending ? 'Creating...' : 'Create Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
