import { useState } from 'react';
import { ChevronDown, Network } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useOrgChart } from '@/hooks/useDirectory';
import type { OrgChartEmployee } from '@/hooks/useDirectory';
import { cn } from '@/lib/utils';

interface TreeNode extends OrgChartEmployee {
  children: TreeNode[];
}

function buildTree(employees: OrgChartEmployee[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  employees.forEach((e) => map.set(e.id, { ...e, children: [] }));

  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.managerId && map.has(node.managerId)) {
      map.get(node.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function Avatar({ name, url }: { name: string; url?: string | null | undefined }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  if (url) {
    return <img src={url} alt={name} className="mx-auto h-10 w-10 rounded-full object-cover" />;
  }
  return (
    <div className="bg-primary/10 text-primary mx-auto flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold">
      {initials}
    </div>
  );
}

function OrgNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasKids = node.children.length > 0;
  const name = `${node.firstName} ${node.lastName}`;

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div
        className={cn(
          'relative w-40 rounded-xl border bg-card p-3 text-center shadow-sm transition-shadow',
          hasKids && 'cursor-pointer hover:shadow-md',
        )}
        onClick={() => { if (hasKids) setOpen((v) => !v); }}
        role={hasKids ? 'button' : undefined}
      >
        <Avatar name={name} url={node.avatarUrl} />
        <p className="mt-2 truncate text-sm font-semibold">{name}</p>
        <p className="text-muted-foreground truncate text-xs">{node.designation ?? '—'}</p>
        {node.department && (
          <p className="text-muted-foreground/60 mt-0.5 truncate text-[10px]">{node.department.name}</p>
        )}
        {hasKids && (
          <ChevronDown
            className={cn(
              'text-muted-foreground absolute bottom-1.5 right-1.5 h-3 w-3 transition-transform',
              !open && '-rotate-90',
            )}
          />
        )}
      </div>

      {/* Children */}
      {hasKids && open && (
        <>
          {/* Vertical connector */}
          <div className="h-5 w-px bg-border" />

          {/* Children row */}
          <div className="flex">
            {node.children.map((child, i) => (
              <div
                key={child.id}
                className={cn(
                  'flex flex-col items-center px-4',
                  node.children.length > 1 && 'border-t border-border',
                  i === 0 && node.children.length > 1 && 'rounded-tl-md border-l',
                  i === node.children.length - 1 && node.children.length > 1 && 'rounded-tr-md border-r',
                )}
              >
                <div className="h-5 w-px bg-border" />
                <OrgNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const { data: employees, isLoading } = useOrgChart();

  const roots = employees ? buildTree(employees) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organisation Chart</h1>
        <p className="text-muted-foreground">
          Visual hierarchy of your organisation
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center gap-6 pt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-40 rounded-xl" />
          ))}
        </div>
      ) : roots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Network className="text-muted-foreground h-12 w-12" />
            <p className="text-muted-foreground text-sm">
              No employees found. Add employees to see the org chart.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto pb-8">
          <div className="flex min-w-max justify-center gap-8 pt-4">
            {roots.map((root) => (
              <OrgNode key={root.id} node={root} depth={0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
