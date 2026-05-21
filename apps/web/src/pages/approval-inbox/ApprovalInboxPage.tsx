import { useState } from 'react';
import { CheckCircle, XCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useApprovalInbox,
  useApproveLeave,
  useApproveExpense,
  useApproveRegularisation,
  useApproveCompOff,
} from '@/hooks/useApprovalInbox';
import type { ApprovalInboxItem, ApprovalItemType } from '@hrms/shared-types';
import { formatDistanceToNow } from 'date-fns';
import { EmptyState } from '@/components/ui/empty-state';

type FilterType = 'ALL' | ApprovalItemType;

const TYPE_TABS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Leaves', value: 'LEAVE' },
  { label: 'Expenses', value: 'EXPENSE' },
  { label: 'Regularisation', value: 'REGULARISATION' },
  { label: 'Comp-off', value: 'COMP_OFF' },
  { label: 'Helpdesk', value: 'HELPDESK' },
];

const TYPE_META: Record<ApprovalItemType, { label: string; color: string }> = {
  LEAVE: { label: 'Leave', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  EXPENSE: { label: 'Expense', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  REGULARISATION: { label: 'Regularisation', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  COMP_OFF: { label: 'Comp-off', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  HELPDESK: { label: 'Helpdesk', color: 'bg-orange-100 text-orange-700 border-orange-200' },
};

export default function ApprovalInboxPage() {
  const [activeType, setActiveType] = useState<FilterType>('ALL');
  const { data: items, isLoading, refetch } = useApprovalInbox(
    activeType === 'ALL' ? undefined : activeType
  );

  const approveLeave = useApproveLeave();
  const approveExpense = useApproveExpense();
  const approveReg = useApproveRegularisation();
  const approveCompOff = useApproveCompOff();

  function handleApprove(item: ApprovalInboxItem) {
    if (item.type === 'LEAVE') approveLeave.mutate({ id: item.id, action: 'APPROVED' });
    else if (item.type === 'EXPENSE') approveExpense.mutate({ id: item.id, action: 'APPROVE' });
    else if (item.type === 'REGULARISATION') approveReg.mutate({ id: item.id, action: 'APPROVED' });
    else if (item.type === 'COMP_OFF') approveCompOff.mutate({ id: item.id, action: 'APPROVED' });
  }

  function handleReject(item: ApprovalInboxItem) {
    if (item.type === 'LEAVE') approveLeave.mutate({ id: item.id, action: 'REJECTED' });
    else if (item.type === 'EXPENSE') approveExpense.mutate({ id: item.id, action: 'REJECT' });
    else if (item.type === 'REGULARISATION') approveReg.mutate({ id: item.id, action: 'REJECTED' });
    else if (item.type === 'COMP_OFF') approveCompOff.mutate({ id: item.id, action: 'REJECTED' });
  }

  const canAct = (item: ApprovalInboxItem) => item.type !== 'HELPDESK';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="w-6 h-6 text-indigo-600" />
            Approval Inbox
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pending items requiring your attention
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveType(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeType === tab.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-background border-border text-muted-foreground hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          illustration="caught-up"
          title="All caught up!"
          description="No pending approvals at this time. Check back later."
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''} pending</p>
          {items.map((item) => {
            const meta = TYPE_META[item.type];
            return (
              <Card key={`${item.type}-${item.id}`} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${meta.color}`}
                        >
                          {meta.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="font-semibold text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">{item.employeeName}</span>
                      </p>
                    </div>
                    {canAct(item) && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleReject(item)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(item)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                    {item.type === 'HELPDESK' && (
                      <Badge variant="secondary" className="shrink-0">
                        {(item.metadata.priority as string) ?? 'OPEN'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
