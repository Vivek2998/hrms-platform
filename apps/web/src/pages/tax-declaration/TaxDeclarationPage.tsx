import { useEffect, useState } from 'react';
import { Save, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useMyTaxDeclarations,
  useSaveTaxDeclaration,
  useSubmitTaxDeclaration,
  type TaxDeclaration,
} from '@/hooks/useTaxDeclaration';
import { useAuthStore } from '@/stores/auth.store';

function getCurrentFY(): string {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(-2)}`;
}

const FY_OPTIONS = (() => {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1].map((y) => ({
    label: `${y}-${String(y + 1).slice(-2)}`,
    value: `${y}-${String(y + 1).slice(-2)}`,
  }));
})();

function statusVariant(status: TaxDeclaration['status']) {
  switch (status) {
    case 'VERIFIED': return 'success';
    case 'SUBMITTED': return 'warning';
    default: return 'secondary';
  }
}

const INR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

function NumInput({
  label, value, onChange, max, disabled,
}: { label: string; value: number | undefined; onChange: (v: number | undefined) => void; max?: number; disabled?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}{max ? ` (max ${INR(max)})` : ''}</Label>
      <Input
        type="number"
        min={0}
        max={max}
        placeholder="0"
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value === '' ? undefined : Number(e.target.value);
          onChange(v);
        }}
        className="h-8 text-sm"
      />
    </div>
  );
}

interface FormState {
  ppf?: number;
  epf?: number;
  elss?: number;
  lic?: number;
  nsc?: number;
  homeLoanPrincipal?: number;
  tuitionFees?: number;
  sukanyaSamriddhi?: number;
  healthInsuranceSelf?: number;
  healthInsuranceParents?: number;
  rentPaid?: number;
  landlordPan?: string;
  npsEmployee?: number;
  homeLoanInterest?: number;
  savingsInterest?: number;
  otherDeductions?: Record<string, number>;
}

const emptyForm: FormState = {};

function computeTotal(form: FormState): number {
  const raw80C =
    (form.ppf ?? 0) + (form.epf ?? 0) + (form.elss ?? 0) + (form.lic ?? 0) +
    (form.nsc ?? 0) + (form.homeLoanPrincipal ?? 0) + (form.tuitionFees ?? 0) +
    (form.sukanyaSamriddhi ?? 0);
  const sec80C = Math.min(150000, raw80C);
  const sec80D = (form.healthInsuranceSelf ?? 0) + (form.healthInsuranceParents ?? 0);
  const hra = form.rentPaid ?? 0;
  const nps = Math.min(50000, form.npsEmployee ?? 0);
  const hli = Math.min(200000, form.homeLoanInterest ?? 0);
  const si = Math.min(10000, form.savingsInterest ?? 0);
  return sec80C + sec80D + hra + nps + hli + si;
}

function declarationToForm(d: TaxDeclaration): FormState {
  return {
    ...(d.ppf != null && { ppf: d.ppf }),
    ...(d.epf != null && { epf: d.epf }),
    ...(d.elss != null && { elss: d.elss }),
    ...(d.lic != null && { lic: d.lic }),
    ...(d.nsc != null && { nsc: d.nsc }),
    ...(d.homeLoanPrincipal != null && { homeLoanPrincipal: d.homeLoanPrincipal }),
    ...(d.tuitionFees != null && { tuitionFees: d.tuitionFees }),
    ...(d.sukanyaSamriddhi != null && { sukanyaSamriddhi: d.sukanyaSamriddhi }),
    ...(d.healthInsuranceSelf != null && { healthInsuranceSelf: d.healthInsuranceSelf }),
    ...(d.healthInsuranceParents != null && { healthInsuranceParents: d.healthInsuranceParents }),
    ...(d.rentPaid != null && { rentPaid: d.rentPaid }),
    ...(d.landlordPan != null && { landlordPan: d.landlordPan }),
    ...(d.npsEmployee != null && { npsEmployee: d.npsEmployee }),
    ...(d.homeLoanInterest != null && { homeLoanInterest: d.homeLoanInterest }),
    ...(d.savingsInterest != null && { savingsInterest: d.savingsInterest }),
    ...(d.otherDeductions != null && { otherDeductions: d.otherDeductions as Record<string, number> }),
  };
}


export default function TaxDeclarationPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isHR = role && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role);

  const [fy, setFy] = useState(getCurrentFY());
  const [regime, setRegime] = useState<'OLD' | 'NEW'>('OLD');
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: declarations, isLoading } = useMyTaxDeclarations(fy);
  const saveDeclaration = useSaveTaxDeclaration();
  const submitDeclaration = useSubmitTaxDeclaration();

  const current = declarations?.[0];
  const isReadonly = current?.status === 'SUBMITTED' || current?.status === 'VERIFIED';

  useEffect(() => {
    if (current) {
      setRegime(current.regime);
      setForm(declarationToForm(current));
    } else {
      setForm(emptyForm);
    }
  }, [current]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    saveDeclaration.mutate({ financialYear: fy, regime, ...form });
  }

  function handleSubmit() {
    if (!current) return;
    submitDeclaration.mutate(current.id);
  }

  const totalDeclared = computeTotal(form);
  const taxSaved = Math.round(totalDeclared * 0.3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tax Declaration</h1>
          <p className="text-muted-foreground">
            Declare your tax-saving investments for TDS calculation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={fy} onValueChange={setFy}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>FY {o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {current && (
            <Badge variant={statusVariant(current.status)}>{current.status}</Badge>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form — left 2 columns */}
          <div className="space-y-6 lg:col-span-2">
            {/* Tax Regime */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tax Regime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {(['OLD', 'NEW'] as const).map((r) => (
                    <button
                      key={r}
                      disabled={isReadonly}
                      onClick={() => { setRegime(r); }}
                      className={`flex-1 rounded-lg border p-4 text-left transition-colors ${
                        regime === r
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/40'
                      }`}
                    >
                      <p className="font-medium">{r === 'OLD' ? 'Old Regime' : 'New Regime'}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {r === 'OLD'
                          ? 'Claim deductions under 80C, 80D, HRA etc.'
                          : 'Lower tax slabs, no deductions allowed'}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {regime === 'OLD' && (
              <>
                {/* 80C */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Section 80C — Investments
                      <span className="text-muted-foreground ml-2 text-xs font-normal">Max ₹1,50,000</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <NumInput label="PPF" value={form.ppf} onChange={(v) => { setField('ppf', v); }} disabled={isReadonly} />
                    <NumInput label="EPF (voluntary)" value={form.epf} onChange={(v) => { setField('epf', v); }} disabled={isReadonly} />
                    <NumInput label="ELSS / Mutual Fund" value={form.elss} onChange={(v) => { setField('elss', v); }} disabled={isReadonly} />
                    <NumInput label="LIC Premium" value={form.lic} onChange={(v) => { setField('lic', v); }} disabled={isReadonly} />
                    <NumInput label="NSC" value={form.nsc} onChange={(v) => { setField('nsc', v); }} disabled={isReadonly} />
                    <NumInput label="Home Loan Principal" value={form.homeLoanPrincipal} onChange={(v) => { setField('homeLoanPrincipal', v); }} disabled={isReadonly} />
                    <NumInput label="Tuition Fees" value={form.tuitionFees} onChange={(v) => { setField('tuitionFees', v); }} disabled={isReadonly} />
                    <NumInput label="Sukanya Samriddhi" value={form.sukanyaSamriddhi} onChange={(v) => { setField('sukanyaSamriddhi', v); }} disabled={isReadonly} />
                  </CardContent>
                </Card>

                {/* 80D */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Section 80D — Health Insurance</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <NumInput label="Self & Family Premium" value={form.healthInsuranceSelf} onChange={(v) => { setField('healthInsuranceSelf', v); }} disabled={isReadonly} />
                    <NumInput label="Parents Premium" value={form.healthInsuranceParents} onChange={(v) => { setField('healthInsuranceParents', v); }} disabled={isReadonly} />
                  </CardContent>
                </Card>

                {/* HRA */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">HRA — House Rent Allowance</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <NumInput label="Annual Rent Paid" value={form.rentPaid} onChange={(v) => { setField('rentPaid', v); }} disabled={isReadonly} />
                    <div className="space-y-1">
                      <Label className="text-xs">Landlord PAN (if rent &gt; ₹1L/yr)</Label>
                      <Input
                        placeholder="ABCDE1234F"
                        value={form.landlordPan ?? ''}
                        disabled={isReadonly}
                        onChange={(e) => { setField('landlordPan', e.target.value || undefined); }}
                        className="h-8 text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Other */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Other Deductions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <NumInput label="NPS 80CCD(1B)" max={50000} value={form.npsEmployee} onChange={(v) => { setField('npsEmployee', v); }} disabled={isReadonly} />
                    <NumInput label="Home Loan Interest 24(b)" max={200000} value={form.homeLoanInterest} onChange={(v) => { setField('homeLoanInterest', v); }} disabled={isReadonly} />
                    <NumInput label="Savings Interest 80TTA" max={10000} value={form.savingsInterest} onChange={(v) => { setField('savingsInterest', v); }} disabled={isReadonly} />
                  </CardContent>
                </Card>
              </>
            )}

            {regime === 'NEW' && (
              <Card>
                <CardContent className="py-10 text-center">
                  <CheckCircle2 className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
                  <p className="font-medium">New Tax Regime Selected</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    No deductions to declare. You will be taxed at the new slab rates.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary — right column */}
          <div className="space-y-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base">Declaration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {regime === 'OLD' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">80C (capped)</span>
                        <span>{INR(Math.min(150000, (form.ppf ?? 0) + (form.epf ?? 0) + (form.elss ?? 0) + (form.lic ?? 0) + (form.nsc ?? 0) + (form.homeLoanPrincipal ?? 0) + (form.tuitionFees ?? 0) + (form.sukanyaSamriddhi ?? 0)))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">80D</span>
                        <span>{INR((form.healthInsuranceSelf ?? 0) + (form.healthInsuranceParents ?? 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">HRA</span>
                        <span>{INR(form.rentPaid ?? 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">NPS 80CCD(1B)</span>
                        <span>{INR(Math.min(50000, form.npsEmployee ?? 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Home Loan Interest</span>
                        <span>{INR(Math.min(200000, form.homeLoanInterest ?? 0))}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Deductions</span>
                      <span>{INR(totalDeclared)}</span>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
                    <p className="text-muted-foreground text-xs">Estimated Tax Saved (30%)</p>
                    <p className="text-xl font-bold text-green-600">{INR(taxSaved)}</p>
                  </div>
                </div>

                {current?.status === 'VERIFIED' ? (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/20">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Verified by HR on {new Date(current.verifiedAt!).toLocaleDateString('en-IN')}
                  </div>
                ) : current?.status === 'SUBMITTED' ? (
                  <p className="text-muted-foreground rounded-lg bg-amber-50 p-3 text-center text-sm dark:bg-amber-950/20">
                    Submitted — awaiting HR verification
                  </p>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleSave}
                      disabled={saveDeclaration.isPending}
                    >
                      <Save className="h-4 w-4" />
                      {saveDeclaration.isPending ? 'Saving…' : 'Save Draft'}
                    </Button>
                    {current && (
                      <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={submitDeclaration.isPending}
                      >
                        <Send className="h-4 w-4" />
                        {submitDeclaration.isPending ? 'Submitting…' : 'Submit to HR'}
                      </Button>
                    )}
                  </div>
                )}

                {isHR && current?.status === 'SUBMITTED' && (
                  <p className="text-muted-foreground text-center text-xs">
                    Go to HR dashboard to verify declarations
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
