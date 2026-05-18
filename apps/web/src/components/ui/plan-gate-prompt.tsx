import { Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PlanGatePromptProps {
  feature: string;
  requiredPlan: string;
}

export function PlanGatePrompt({ feature, requiredPlan }: PlanGatePromptProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <Lock className="text-muted-foreground h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{feature} is not available on your current plan</h3>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">
            Upgrade to the <span className="font-medium">{requiredPlan}</span> plan or higher to
            access this feature. Contact your administrator to upgrade.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
