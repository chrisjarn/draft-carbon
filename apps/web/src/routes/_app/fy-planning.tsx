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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/fy-planning")({
  component: FyPlanningPage,
});

// ── RBAC ─────────────────────────────────────────────────────────────────────

const WRITE_ROLES = ["admin", "practice_manager"];
function canWrite(role: string | undefined | null) {
  return WRITE_ROLES.includes(role ?? "");
}

// ── Types ─────────────────────────────────────────────────────────────────────

type EntityWithRevenue = {
  id: string;
  biz: string;
  state: string | null;
  officeId: string | null;
  revenue: { target: string | null; actual: string | null } | null;
};

// ── FY options ────────────────────────────────────────────────────────────────

const FY_OPTIONS = ["FY25-26", "FY24-25", "FY23-24", "FY26-27"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: string | null | undefined): string {
  const n = Number(v);
  if (!v || Number.isNaN(n) || n === 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}m`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

function variance(target: string | null, actual: string | null): { val: string; positive: boolean | null } {
  const t = Number(target), a = Number(actual);
  if (!t || !a) return { val: "—", positive: null };
  const diff = a - t;
  const positive = diff >= 0;
  const abs = Math.abs(diff);
  const label = abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(2)}m` : abs >= 1_000 ? `${Math.round(abs / 1_000)}k` : String(abs);
  return { val: `${positive ? "+" : "-"}$${label}`, positive };
}

function attainmentPct(target: string | null, actual: string | null): number | null {
  const t = Number(target), a = Number(actual);
  if (!t || !a) return null;
  return Math.round((a / t) * 100);
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function RevenueBar({ target, actual }: { target: string | null; actual: string | null }) {
  const t = Number(target), a = Number(actual);
  if (!t) return <div className="h-1.5 w-full rounded-full bg-muted" />;
  const pct = Math.min((a / t) * 100, 100);
  const over = a > t;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${over ? "bg-green-500" : pct >= 80 ? "bg-amber-500" : "bg-blue-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Inline editable dollar cell ───────────────────────────────────────────────

function RevenueCell({ value, onSave, disabled }: {
  value: string | null | undefined; onSave: (v: string) => void; disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");

  if (disabled) return <span className="text-xs tabular-nums">{fmt(value)}</span>;

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">$</span>
        <Input
          type="number" value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { onSave(val); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
          className="h-6 w-24 text-xs" autoFocus
        />
        <button type="button" onClick={() => { onSave(val); setEditing(false); }} className="text-green-400 hover:text-green-300">
          <Check className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1">
      <span className="text-xs tabular-nums">{fmt(value)}</span>
      <button type="button" onClick={() => { setVal(value ?? ""); setEditing(true); }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity">
        <Pencil className="size-3" />
      </button>
    </div>
  );
}

// ── State group ───────────────────────────────────────────────────────────────

type StateGroup = {
  state: string;
  entities: EntityWithRevenue[];
  totalTarget: number;
  totalActual: number;
};

function buildStateGroups(rows: EntityWithRevenue[]): StateGroup[] {
  const map = new Map<string, EntityWithRevenue[]>();
  for (const r of rows) {
    const s = r.state ?? "Unknown";
    if (!map.has(s)) map.set(s, []);
    map.get(s)!.push(r);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([state, entities]) => ({
      state,
      entities,
      totalTarget: entities.reduce((s, e) => s + Number(e.revenue?.target ?? 0), 0),
      totalActual: entities.reduce((s, e) => s + Number(e.revenue?.actual ?? 0), 0),
    }));
}

function EntityRow({ entity, fy, canWriteAccess, onSave }: {
  entity: EntityWithRevenue; fy: string; canWriteAccess: boolean;
  onSave: (entId: string, field: "target" | "actual", value: string) => void;
}) {
  const target = entity.revenue?.target ?? null;
  const actual = entity.revenue?.actual ?? null;
  const v = variance(target, actual);
  const pct = attainmentPct(target, actual);

  return (
    <div className="grid grid-cols-[1fr_130px_130px_110px_160px_80px] items-center gap-4 px-4 py-2.5 hover:bg-muted/20">
      <span className="pl-8 text-xs">{entity.biz}</span>
      <RevenueCell value={target} onSave={(v) => onSave(entity.id, "target", v)} disabled={!canWriteAccess} />
      <RevenueCell value={actual} onSave={(v) => onSave(entity.id, "actual", v)} disabled={!canWriteAccess} />
      <span className={`text-xs tabular-nums font-medium ${v.positive === null ? "text-muted-foreground" : v.positive ? "text-green-400" : "text-red-400"}`}>
        {v.val}
      </span>
      <RevenueBar target={target} actual={actual} />
      <span className={`text-xs tabular-nums font-medium ${pct === null ? "text-muted-foreground" : pct >= 100 ? "text-green-400" : pct >= 80 ? "text-amber-400" : "text-red-400"}`}>
        {pct !== null ? `${pct}%` : "—"}
      </span>
    </div>
  );
}

function StateSection({ group, fy, canWriteAccess, onSave }: {
  group: StateGroup; fy: string; canWriteAccess: boolean;
  onSave: (entId: string, field: "target" | "actual", value: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const v = variance(String(group.totalTarget), String(group.totalActual));
  const pct = attainmentPct(String(group.totalTarget), String(group.totalActual));

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid w-full grid-cols-[1fr_130px_130px_110px_160px_80px] items-center gap-4 bg-muted/40 px-4 py-3 text-left hover:bg-muted/60"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
          <span className="font-bold">{group.state}</span>
          <Badge variant="outline" className="text-[10px]">{group.entities.length} entities</Badge>
        </div>
        <span className="text-xs font-medium tabular-nums">{fmt(String(group.totalTarget))}</span>
        <span className="text-xs font-medium tabular-nums">{fmt(String(group.totalActual))}</span>
        <span className={`text-xs font-medium tabular-nums ${v.positive === null ? "text-muted-foreground" : v.positive ? "text-green-400" : "text-red-400"}`}>
          {v.val}
        </span>
        <RevenueBar target={String(group.totalTarget)} actual={String(group.totalActual)} />
        <span className={`text-xs font-medium tabular-nums ${pct === null ? "text-muted-foreground" : pct >= 100 ? "text-green-400" : pct >= 80 ? "text-amber-400" : "text-red-400"}`}>
          {pct !== null ? `${pct}%` : "—"}
        </span>
      </button>
      {open && (
        <div className="divide-y divide-border/50">
          {group.entities.map((e) => (
            <EntityRow key={e.id} entity={e} fy={fy} canWriteAccess={canWriteAccess} onSave={onSave} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function FyPlanningPage() {
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const hasWriteAccess = canWrite(userRole);

  const qc = useQueryClient();
  const [fy, setFy] = useState("FY25-26");

  const query = useQuery(trpc.wfp.getRevenue.queryOptions({ fy }));
  const rows = (query.data ?? []) as EntityWithRevenue[];
  const groups = buildStateGroups(rows);

  const totalTarget = groups.reduce((s, g) => s + g.totalTarget, 0);
  const totalActual = groups.reduce((s, g) => s + g.totalActual, 0);
  const overallPct = attainmentPct(String(totalTarget), String(totalActual));

  const upsert = useMutation(trpc.wfp.upsertRevenue.mutationOptions({
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.wfp.getRevenue.queryKey({ fy }) }),
    onError: (e) => toast.error(e.message),
  }));

  function handleSave(entId: string, field: "target" | "actual", value: string) {
    upsert.mutate({ entId, fy, [field]: value });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">FY Reports</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Revenue targets vs actuals · {fmt(String(totalTarget))} target · {fmt(String(totalActual))} actual
            {overallPct !== null && (
              <span className={`ml-2 font-semibold ${overallPct >= 100 ? "text-green-400" : overallPct >= 80 ? "text-amber-400" : "text-red-400"}`}>
                {overallPct}% attainment
              </span>
            )}
          </p>
        </div>
        <Select value={fy} onValueChange={setFy}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FY_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Column headers */}
      <div className="border-b border-border px-6 py-2.5">
        <div className="grid grid-cols-[1fr_130px_130px_110px_160px_80px] gap-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="pl-8">Entity</span>
          <span>Target</span>
          <span>Actual</span>
          <span>Variance</span>
          <span>Progress</span>
          <span>Attainment</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {query.isPending ? (
          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <p>No entities found.</p>
            <p className="text-[11px]">Seed entities data to see FY revenue planning.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <StateSection key={g.state} group={g} fy={fy} canWriteAccess={hasWriteAccess} onSave={handleSave} />
            ))}
          </div>
        )}
      </div>

      {/* Footer totals */}
      {groups.length > 0 && (
        <div className="border-t border-border px-6 py-3">
          <div className="grid grid-cols-[1fr_130px_130px_110px_160px_80px] gap-4 text-xs font-semibold">
            <span className="text-muted-foreground">Total ({fy})</span>
            <span className="tabular-nums">{fmt(String(totalTarget))}</span>
            <span className="tabular-nums">{fmt(String(totalActual))}</span>
            {(() => { const v = variance(String(totalTarget), String(totalActual)); return (
              <span className={`tabular-nums ${v.positive === null ? "text-muted-foreground" : v.positive ? "text-green-400" : "text-red-400"}`}>{v.val}</span>
            ); })()}
            <RevenueBar target={String(totalTarget)} actual={String(totalActual)} />
            <span className={overallPct === null ? "text-muted-foreground" : overallPct >= 100 ? "text-green-400" : overallPct >= 80 ? "text-amber-400" : "text-red-400"}>
              {overallPct !== null ? `${overallPct}%` : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
