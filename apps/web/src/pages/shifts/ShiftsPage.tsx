import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShiftsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shifts</h1>
        <p className="text-muted-foreground">Configure work shifts and assign employees</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Shift Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Shift management is part of Phase 1 and will be wired to the API shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
