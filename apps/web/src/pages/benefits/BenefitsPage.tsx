import { useState } from 'react';
import { Gift, Plus, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useBenefitPlans, useCreateBenefitPlan, useEnrollBenefit } from '@/hooks/useBenefits';
import { useAuthStore } from '@/stores/auth.store';

// Must match the BenefitType enum in the Prisma schema exactly
const TYPE_META: Record<string, { label: string; color: string }> = {
  HEALTH_INSURANCE: { label: 'Health Insurance', color: 'bg-red-100 text-red-700' },
  LIFE_INSURANCE:   { label: 'Life Insurance',   color: 'bg-blue-100 text-blue-700' },
  NPS:              { label: 'NPS',               color: 'bg-green-100 text-green-700' },
  GYM:              { label: 'Gym & Wellness',    color: 'bg-teal-100 text-teal-700' },
  MEAL_ALLOWANCE:   { label: 'Meal Allowance',    color: 'bg-orange-100 text-orange-700' },
  TRANSPORT:        { label: 'Transport',          color: 'bg-purple-100 text-purple-700' },
  OTHER:            { label: 'Other',              color: 'bg-gray-100 text-gray-600' },
};

export default function BenefitsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: plans, isLoading } = useBenefitPlans();
  const enroll = useEnrollBenefit();
  const user = useAuthStore((s) => s.user);
  const isHR = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-500" />
            Benefits
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Enroll in company benefit plans</p>
        </div>
        {isHR && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Plan
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : !plans?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Gift className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No benefit plans available</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan: any) => {
            const meta: { label: string; color: string } = TYPE_META[plan.type] ?? { label: plan.type as string, color: 'bg-gray-100 text-gray-600' };
            const enrolled = plan.myEnrollment?.status === 'ENROLLED';
            const waived = plan.myEnrollment?.status === 'WAIVED';
            return (
              <Card key={plan.id} className="border shadow-sm">
                <CardContent className="pt-4 pb-4 px-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{plan.name}</h3>
                        <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                      </div>
                    </div>
                    {enrolled && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                    {waived && <XCircle className="w-5 h-5 text-gray-400 shrink-0" />}
                  </div>

                  {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}

                  <div className="flex items-center justify-between text-sm">
                    {plan.maxAmount != null && (
                      <span className="text-muted-foreground">
                        Max benefit: <strong>₹{plan.maxAmount.toLocaleString('en-IN')}/yr</strong>
                      </span>
                    )}
                    {plan.enrollmentDeadline && (
                      <span className="text-xs text-muted-foreground">
                        Deadline: {new Date(plan.enrollmentDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant={enrolled ? 'default' : 'outline'}
                      disabled={enroll.isPending}
                      className={enrolled ? 'bg-green-600 hover:bg-green-700' : ''}
                      onClick={() => enroll.mutate({ planId: plan.id, action: 'enroll' })}>
                      {enrolled ? 'Enrolled' : 'Enroll'}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground"
                      disabled={enroll.isPending}
                      onClick={() => enroll.mutate({ planId: plan.id, action: 'waive' })}>
                      {waived ? 'Waived' : 'Waive'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateBenefitDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

// Must match BenefitType enum in Prisma schema
const BENEFIT_TYPES: { value: string; label: string }[] = [
  { value: 'HEALTH_INSURANCE', label: 'Health Insurance' },
  { value: 'LIFE_INSURANCE',   label: 'Life Insurance' },
  { value: 'NPS',              label: 'NPS (National Pension Scheme)' },
  { value: 'GYM',              label: 'Gym & Wellness' },
  { value: 'MEAL_ALLOWANCE',   label: 'Meal Allowance' },
  { value: 'TRANSPORT',        label: 'Transport' },
  { value: 'OTHER',            label: 'Other' },
];

function CreateBenefitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('HEALTH_INSURANCE');
  const [description, setDescription] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [enrollmentDeadline, setEnrollmentDeadline] = useState('');
  const create = useCreateBenefitPlan();

  async function handleSubmit() {
    if (!name) return;
    await create.mutateAsync({
      name,
      type,
      description: description || undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
      enrollmentDeadline: enrollmentDeadline || undefined,
    });
    setName(''); setType('HEALTH_INSURANCE'); setDescription('');
    setMaxAmount(''); setEnrollmentDeadline('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Benefit Plan</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Plan Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Group Health Insurance" /></div>
          <div>
            <Label>Type *</Label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full border rounded-md p-2 text-sm mt-1">
              {BENEFIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief description of the benefit" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Max Benefit Amount (₹/yr)</Label><Input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder="e.g. 300000" /></div>
            <div><Label>Enrollment Deadline</Label><Input type="date" value={enrollmentDeadline} onChange={(e) => setEnrollmentDeadline(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || create.isPending}>Create Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
