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

const TYPE_META: Record<string, { label: string; color: string }> = {
  HEALTH: { label: 'Health', color: 'bg-red-100 text-red-700' },
  DENTAL: { label: 'Dental', color: 'bg-pink-100 text-pink-700' },
  VISION: { label: 'Vision', color: 'bg-purple-100 text-purple-700' },
  LIFE: { label: 'Life', color: 'bg-blue-100 text-blue-700' },
  RETIREMENT: { label: 'Retirement', color: 'bg-green-100 text-green-700' },
  WELLNESS: { label: 'Wellness', color: 'bg-teal-100 text-teal-700' },
  OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-600' },
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
                      {plan.provider && <p className="text-xs text-muted-foreground">{plan.provider}</p>}
                    </div>
                    {enrolled && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                    {waived && <XCircle className="w-5 h-5 text-gray-400 shrink-0" />}
                  </div>

                  {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}

                  <div className="flex items-center justify-between text-sm">
                    {plan.employeeContribution != null && (
                      <span className="text-muted-foreground">
                        Employee: <strong>₹{plan.employeeContribution?.toLocaleString()}/mo</strong>
                      </span>
                    )}
                    {plan.employerContribution != null && (
                      <span className="text-muted-foreground">
                        Employer: <strong>₹{plan.employerContribution?.toLocaleString()}/mo</strong>
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

const BENEFIT_TYPES = ['HEALTH', 'DENTAL', 'VISION', 'LIFE', 'RETIREMENT', 'WELLNESS', 'OTHER'];

function CreateBenefitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('HEALTH');
  const [provider, setProvider] = useState('');
  const [description, setDescription] = useState('');
  const [employeeContribution, setEmployeeContribution] = useState('');
  const [employerContribution, setEmployerContribution] = useState('');
  const create = useCreateBenefitPlan();

  async function handleSubmit() {
    if (!name) return;
    await create.mutateAsync({
      name, type, provider: provider || undefined, description: description || undefined,
      employeeContribution: employeeContribution ? Number(employeeContribution) : undefined,
      employerContribution: employerContribution ? Number(employerContribution) : undefined,
    });
    setName(''); setType('HEALTH'); setProvider(''); setDescription('');
    setEmployeeContribution(''); setEmployerContribution('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Benefit Plan</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Plan Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div>
            <Label>Type</Label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full border rounded-md p-2 text-sm mt-1">
              {BENEFIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><Label>Provider</Label><Input value={provider} onChange={(e) => setProvider(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Employee Contribution (₹/mo)</Label><Input type="number" value={employeeContribution} onChange={(e) => setEmployeeContribution(e.target.value)} /></div>
            <div><Label>Employer Contribution (₹/mo)</Label><Input type="number" value={employerContribution} onChange={(e) => setEmployerContribution(e.target.value)} /></div>
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
