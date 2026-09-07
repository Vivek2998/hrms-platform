import { useAuthStore } from '@/stores/auth.store';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';
import { useApprovalInbox } from '@/hooks/useApprovalInbox';
import { SetupGuide } from '@/components/onboarding/SetupGuide';
import { AutoTour, useProductTour } from '@/components/onboarding/ProductTour';
import { useSetupGuide } from '@/hooks/useSetupGuide';
import { HeroCard } from './widgets/HeroCard';
import { ThoughtOfTheDay } from './widgets/ThoughtOfTheDay';
import { KPISummary } from './widgets/KPISummary';
import { QuickActionsSection } from './widgets/QuickActionsSection';
import { BirthdayWidget } from './widgets/BirthdayWidget';
import { NewJoineeWidget } from './widgets/NewJoineeWidget';
import { AnniversaryWidget } from './widgets/AnniversaryWidget';
import { MyRequestsWidget } from './widgets/MyRequestsWidget';
import { PendingRequestsWidget } from './widgets/PendingRequestsWidget';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const isApprover = !!role && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(role);
  const { state: guideState } = useSetupGuide();
  const { start: startTour } = useProductTour();

  const { data: widgets, isLoading: widgetsLoading } = useDashboardWidgets();
  const {
    data: inboxItems = [],
    isLoading: inboxLoading,
    isError: inboxError,
    refetch: refetchInbox,
  } = useApprovalInbox(undefined, { enabled: isApprover });

  return (
    <div className="space-y-4">
      <AutoTour />

      <div id="tour-hero">
        <HeroCard />
      </div>

      <ThoughtOfTheDay category={widgets?.quoteCategory} />

      <KPISummary
        birthdays={widgets?.birthdays.length ?? 0}
        newJoinees={widgets?.newJoinees.length ?? 0}
        anniversaries={widgets?.workAnniversaries.length ?? 0}
        pendingApprovals={inboxItems.length}
        isApprover={isApprover}
        loading={widgetsLoading}
      />

      <div id="tour-quick-actions">
        <QuickActionsSection role={role} />
      </div>

      {!guideState.dismissed && (
        <div id="tour-setup-guide">
          <SetupGuide onStartTour={startTour} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <BirthdayWidget entries={widgets?.birthdays ?? []} loading={widgetsLoading} />
        <NewJoineeWidget entries={widgets?.newJoinees ?? []} loading={widgetsLoading} />
        <AnniversaryWidget entries={widgets?.workAnniversaries ?? []} loading={widgetsLoading} />
      </div>

      {widgets?.myPendingRequests && (
        <MyRequestsWidget
          leaves={widgets.myPendingRequests.leaves}
          regularisations={widgets.myPendingRequests.regularisations}
          compOffs={widgets.myPendingRequests.compOffs}
          loading={widgetsLoading}
        />
      )}

      {isApprover && (
        <PendingRequestsWidget
          items={inboxItems}
          loading={inboxLoading}
          error={inboxError}
          onRetry={() => void refetchInbox()}
        />
      )}
    </div>
  );
}
