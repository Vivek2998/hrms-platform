import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, X, ChevronRight, ChevronDown, ChevronUp, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { useSetupGuide, getGuideSteps } from '@/hooks/useSetupGuide';
import { cn } from '@/lib/utils';

export function SetupGuide({ onStartTour }: { onStartTour?: () => void }) {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const { state, markStepDone, dismiss, collapseGuide, expandGuide } = useSetupGuide();
  const collapsed = state.guideCollapsed;

  const steps = getGuideSteps(role);
  const done = steps.filter((s) => state.completedSteps.includes(s.id)).length;
  const total = steps.length;
  const allDone = done === total;
  const pct = Math.round((done / total) * 100);

  if (state.dismissed) return null;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header — always visible, clicking it toggles collapse */}
      {/* div instead of button to avoid invalid nested-button HTML (buttons inside) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => collapsed ? expandGuide() : collapseGuide()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { collapsed ? expandGuide() : collapseGuide(); } }}
        className="flex w-full items-center gap-3 px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left cursor-pointer"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
          <Rocket className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {allDone ? 'Setup complete!' : 'Setup Guide'}
          </p>
          <p className="text-xs text-muted-foreground">
            {allDone ? 'All steps completed.' : `${done} of ${total} steps done`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onStartTour && !state.tourDone && !collapsed && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={onStartTour}>
              Take the tour
            </Button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); collapsed ? expandGuide() : collapseGuide(); }}
            aria-label={collapsed ? 'Expand setup guide' : 'Collapse setup guide'}
            className="text-muted-foreground hover:text-foreground transition-colors rounded p-1"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            aria-label="Dismiss setup guide"
            className="text-muted-foreground hover:text-foreground transition-colors rounded p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Collapsible body — grid-template-rows trick gives a true smooth height animation */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: collapsed ? '0fr' : '1fr',
          transition: 'grid-template-rows 0.35s ease-in-out',
        }}
      >
        <div className="overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className={cn('h-full transition-all duration-500', allDone ? 'bg-green-500' : 'bg-primary')}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Steps */}
          <div className="divide-y">
            {steps.map((step) => {
              const completed = state.completedSteps.includes(step.id);
              return (
                <button
                  key={step.id}
                  className={cn(
                    'flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors',
                    completed ? 'bg-muted/20' : 'hover:bg-muted/40',
                  )}
                  onClick={() => { markStepDone(step.id); void navigate(step.to); }}
                >
                  {completed
                    ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                    : <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                  }
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-medium', completed && 'text-muted-foreground line-through')}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {!completed && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />}
                </button>
              );
            })}
          </div>

          {allDone && (
            <div className="px-5 py-4 bg-green-50 dark:bg-green-950/20 border-t border-green-100 dark:border-green-900/30 text-center">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                All done! You can dismiss this guide or keep it as a quick reference.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
