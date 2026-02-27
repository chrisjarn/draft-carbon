import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/capacity")({
  component: CapacityPage,
});

// ── RBAC ─────────────────────────────────────────────────────────────────────

const WRITE_ROLES = ["admin", "practice_manager", "sl_lead", "state_manager"];

function canWrite(role: string | undefined | null) {
  return WRITE_ROLES.includes(role ?? "");
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Carbonite = {
  id: string;
  state: string | null;
  office: string | null;
  pod: string | null;
};

type PodBudget = {
  state: string;
  office: string;
  podName: string;
  budget: number;
};

type PodRow = {
  podName: string;
  budget: number;
  actual: number;
};

type OfficeGroup = {
  office: string;
  pods: PodRow[];
  totalBudget: number;
  totalActual: number;
};

type StateGroup = {
  state: string;
  offices: OfficeGroup[];
  totalBudget: number;
  totalActual: number;
};

// ── Status logic ──────────────────────────────────────────────────────────────

type Status = "under" | "at" | "over" | "empty";

function getStatus(actual: number, budget: number): Status {
  if (budget === 0 && actual === 0) return "empty";
  if (actual > budget) return "over";
  if (actual === budget) return "at";
  return "under";
}

function StatusBadge({ actual, budget }: { actual: number; budget: number }) {
  const status = getStatus(actual, budget);
  const map: Record<Status, { label: string; className: string }> = {
    under: { label: "Under", className: "border-green-500/40 bg-green-500/10 text-green-400" },
    at:    { label: "At capacity", className: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
    over:  { label: "Over", className: "border-red-500/40 bg-red-500/10 text-red-400" },
    empty: { label: "No budget", className: "border-border bg-muted/40 text-muted-foreground" },
  };
  const { label, className } = map[status];
  return (
    <Badge variant="outline" className={`text-[10px] ${className}`}>{label}</Badge>
  );
}

function CapacityBar({ actual, budget }: { actual: number; budget: number }) {
  if (budget === 0) return <div className="h-1.5 w-full rounded-full bg-muted" />;
  const pct = Math.min((actual / budget) * 100, 100);
  const over = actual > budget;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct >= 90 ? "bg-amber-500" : "bg-green-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Budget edit cell ──────────────────────────────────────────────────────────

function BudgetCell({
  state, office, podName, budget, canWriteAccess,
}: {
  state: string; office: string; podName: string; budget: number; canWriteAccess: boolean;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(budget));

  const upsert = useMutation(trpc.podBudgets.upsert.mutationOptions({
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.podBudgets.getAll.queryKey() });
      setEditing(false);
      toast.success("Budget updated");
    },
    onError: (e) => toast.error(e.message),
  }));

  function save() {
    const n = Number(val);
    if (Number.isNaN(n) || n < 0) return;
    upsert.mutate({ state, office, podName, budget: n });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          className="h-6 w-16 text-center text-xs"
          autoFocus
        />
        <button type="button" onClick={save} disabled={upsert.isPending} className="text-green-400 hover:text-green-300">
          <Check className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group">
      <span className="text-xs font-medium tabular-nums">{budget}</span>
      {canWriteAccess && (
        <button
          type="button"
          onClick={() => { setVal(String(budget)); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
        >
          <Pencil className="size-3" />
        </button>
      )}
    </div>
  );
}

// ── Group builder ─────────────────────────────────────────────────────────────

function buildGroups(carbonites: Carbonite[], budgets: PodBudget[]): StateGroup[] {
  // Build a map of all pods that have either staff or a budget
  const podSet = new Map<string, { state: string; office: string; podName: string }>();

  for (const c of carbonites) {
    if (!c.state || !c.office || !c.pod) continue;
    const key = `${c.state}||${c.office}||${c.pod}`;
    if (!podSet.has(key)) podSet.set(key, { state: c.state, office: c.office, podName: c.pod });
  }
  for (const b of budgets) {
    const key = `${b.state}||${b.office}||${b.podName}`;
    if (!podSet.has(key)) podSet.set(key, { state: b.state, office: b.office, podName: b.podName });
  }

  // Count staff per pod
  const countMap = new Map<string, number>();
  for (const c of carbonites) {
    if (!c.state || !c.office || !c.pod) continue;
    const key = `${c.state}||${c.office}||${c.pod}`;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  // Budget map
  const budgetMap = new Map<string, number>();
  for (const b of budgets) {
    budgetMap.set(`${b.state}||${b.office}||${b.podName}`, b.budget);
  }

  // Group into state > office > pods
  const stateMap = new Map<string, Map<string, PodRow[]>>();
  for (const { state, office, podName } of podSet.values()) {
    if (!stateMap.has(state)) stateMap.set(state, new Map());
    const offMap = stateMap.get(state)!;
    if (!offMap.has(office)) offMap.set(office, []);
    const key = `${state}||${office}||${podName}`;
    offMap.get(office)!.push({
      podName,
      budget: budgetMap.get(key) ?? 0,
      actual: countMap.get(key) ?? 0,
    });
  }

  // Sort pods within each office
  const states: StateGroup[] = [];
  for (const [state, offMap] of [...stateMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const offices: OfficeGroup[] = [];
    for (const [office, pods] of [...offMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const sorted = pods.sort((a, b) => a.podName.localeCompare(b.podName));
      const totalBudget = sorted.reduce((s, p) => s + p.budget, 0);
      const totalActual = sorted.reduce((s, p) => s + p.actual, 0);
      offices.push({ office, pods: sorted, totalBudget, totalActual });
    }
    const totalBudget = offices.reduce((s, o) => s + o.totalBudget, 0);
    const totalActual = offices.reduce((s, o) => s + o.totalActual, 0);
    states.push({ state, offices, totalBudget, totalActual });
  }
  return states;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PodRow({ pod, state, office, canWriteAccess }: {
  pod: PodRow; state: string; office: string; canWriteAccess: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_80px_80px_80px_140px_120px] items-center gap-4 px-4 py-2 text-sm hover:bg-muted/30">
      <span className="pl-10 text-xs text-muted-foreground">{pod.podName}</span>
      <BudgetCell state={state} office={office} podName={pod.podName} budget={pod.budget} canWriteAccess={canWriteAccess} />
      <span className="text-xs font-medium tabular-nums">{pod.actual}</span>
      <span className={`text-xs tabular-nums font-medium ${pod.actual > pod.budget && pod.budget > 0 ? "text-red-400" : "text-muted-foreground"}`}>
        {pod.budget > 0 ? (pod.budget > pod.actual ? `+${pod.budget - pod.actual}` : pod.actual > pod.budget ? `-${pod.actual - pod.budget}` : "0") : "—"}
      </span>
      <CapacityBar actual={pod.actual} budget={pod.budget} />
      <StatusBadge actual={pod.actual} budget={pod.budget} />
    </div>
  );
}

function OfficeSection({ office, state, canWriteAccess, defaultOpen }: {
  office: OfficeGroup; state: string; canWriteAccess: boolean; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid w-full grid-cols-[1fr_80px_80px_80px_140px_120px] items-center gap-4 px-4 py-2.5 hover:bg-muted/20 text-left"
      >
        <div className="flex items-center gap-2 pl-4">
          {open ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
          <span className="text-sm font-semibold">{office.office}</span>
          <Badge variant="outline" className="text-[10px]">{office.pods.length} pods</Badge>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{office.totalBudget}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{office.totalActual}</span>
        <span className={`text-xs tabular-nums ${office.totalActual > office.totalBudget && office.totalBudget > 0 ? "text-red-400" : "text-muted-foreground"}`}>
          {office.totalBudget > 0 ? (office.totalBudget > office.totalActual ? `+${office.totalBudget - office.totalActual}` : office.totalActual > office.totalBudget ? `-${office.totalActual - office.totalBudget}` : "0") : "—"}
        </span>
        <CapacityBar actual={office.totalActual} budget={office.totalBudget} />
        <StatusBadge actual={office.totalActual} budget={office.totalBudget} />
      </button>
      {open && office.pods.map((pod) => (
        <PodRow key={pod.podName} pod={pod} state={state} office={office.office} canWriteAccess={canWriteAccess} />
      ))}
    </div>
  );
}

function StateSection({ group, canWriteAccess }: { group: StateGroup; canWriteAccess: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid w-full grid-cols-[1fr_80px_80px_80px_140px_120px] items-center gap-4 bg-muted/40 px-4 py-3 text-left hover:bg-muted/60"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
          <span className="font-bold">{group.state}</span>
          <Badge variant="secondary" className="text-[10px]">{group.offices.length} offices</Badge>
        </div>
        <span className="text-xs font-medium tabular-nums">{group.totalBudget}</span>
        <span className="text-xs font-medium tabular-nums">{group.totalActual}</span>
        <span className={`text-xs font-medium tabular-nums ${group.totalActual > group.totalBudget && group.totalBudget > 0 ? "text-red-400" : "text-muted-foreground"}`}>
          {group.totalBudget > 0 ? (group.totalBudget > group.totalActual ? `+${group.totalBudget - group.totalActual}` : group.totalActual > group.totalBudget ? `-${group.totalActual - group.totalBudget}` : "0") : "—"}
        </span>
        <CapacityBar actual={group.totalActual} budget={group.totalBudget} />
        <StatusBadge actual={group.totalActual} budget={group.totalBudget} />
      </button>
      {open && (
        <div className="divide-y divide-border/50">
          {group.offices.map((office) => (
            <OfficeSection
              key={office.office}
              office={office}
              state={group.state}
              canWriteAccess={canWriteAccess}
              defaultOpen={group.offices.length === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function CapacityPage() {
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const hasWriteAccess = canWrite(userRole);

  const carbonitesQuery = useQuery(trpc.carbonites.getAll.queryOptions({}));
  const budgetsQuery = useQuery(trpc.podBudgets.getAll.queryOptions());

  const isLoading = carbonitesQuery.isPending || budgetsQuery.isPending;

  const carbonites = (carbonitesQuery.data ?? []) as Carbonite[];
  const budgets = budgetsQuery.data ?? [];
  const groups = buildGroups(carbonites, budgets);

  const totalBudget = groups.reduce((s, g) => s + g.totalBudget, 0);
  const totalActual = groups.reduce((s, g) => s + g.totalActual, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">Capacity Plan</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pod headcount vs budget — {groups.length} states · {groups.reduce((s, g) => s + g.offices.length, 0)} offices
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span><span className="font-semibold text-foreground">{totalActual}</span> / {totalBudget} headcount</span>
          <StatusBadge actual={totalActual} budget={totalBudget} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 border-b border-border px-6 py-2.5">
        <div className="grid grid-cols-[1fr_80px_80px_80px_140px_120px] w-full gap-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="pl-4">Location</span>
          <span>Budget</span>
          <span>Actual</span>
          <span>Variance</span>
          <span>Utilisation</span>
          <span>Status</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <p>No capacity data yet.</p>
            <p className="text-[11px]">Add staff to Carbonites or seed pod budgets to see this view.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <StateSection key={group.state} group={group} canWriteAccess={hasWriteAccess} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
