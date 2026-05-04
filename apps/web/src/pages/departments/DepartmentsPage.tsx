import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DepartmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Departments</h1>
        <p className="text-muted-foreground">
          Manage your organisation&apos;s departments and teams
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Department management is part of Phase 1 and will be wired to the API shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
