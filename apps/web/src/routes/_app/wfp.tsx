import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Pencil, Star, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/wfp")({
  component: WfpPage,
});

// ── RBAC ─────────────────────────────────────────────────────────────────────

const WRITE_ROLES = ["admin", "practice_manager", "sl_lead", "state_manager"];
function canWrite(role: string | undefined | null) {
  return WRITE_ROLES.includes(role ?? "");
}

// ── Types ─────────────────────────────────────────────────────────────────────

type StaffWithMeta = {
  id: string;
  name: string;
  role: string | null;
  sl: string | null;
  state: string | null;
  office: string | null;
  pod: string | null;
  salary: number | null;
  seniority: number | null;
  meta: {
    cbId: string;
    billingTarget: string | null;
    billingActual: string | null;
    perfRating: string | null;
    promoFlag: boolean | null;
    promoEta: string | null;
    staffRole: string | null;
  } | null;
};

// ── Perf rating badge ─────────────────────────────────────────────────────────

const PERF_STYLES: Record<string, string> = {
  Exceeds:   "border-green-500/40 bg-green-500/10 text-green-400",
  Meets:     "border-blue-500/40 bg-blue-500/10 text-blue-400",
  Below:     "border-red-500/40 bg-red-500/10 text-red-400",
  "N/A":     "border-border bg-muted/40 text-muted-foreground",
};

function PerfBadge({ rating }: { rating: string | null | undefined }) {
  const r = rating ?? "N/A";
  const cls = PERF_STYLES[r] ?? PERF_STYLES["N/A"];
  return <Badge variant="outline" className={`text-[10px] ${cls}`}>{r}</Badge>;
}

function pct(actual: string | null, target: string | null): string {
  const a = Number(actual), t = Number(target);
  if (!t || !a) return "—";
  return `${Math.round((a / t) * 100)}%`;
}

function fmtDollar(v: string | null | undefined): string {
  const n = Number(v);
  if (!v || Number.isNaN(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

// ── Inline editable cell ──────────────────────────────────────────────────────

function EditableCell({ value, onSave, prefix = "$", disabled }: {
  value: string | null | undefined; onSave: (v: string) => void; prefix?: string; disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");

  if (disabled) return <span className="text-xs">{fmtDollar(value)}</span>;

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{prefix}</span>
        <Input
          type="number" value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { onSave(val); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
          className="h-6 w-20 text-xs" autoFocus
        />
        <button type="button" onClick={() => { onSave(val); setEditing(false); }} className="text-green-400 hover:text-green-300">
          <Check className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1">
      <span className="text-xs">{fmtDollar(value)}</span>
      <button type="button" onClick={() => { setVal(value ?? ""); setEditing(true); }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity">
        <Pencil className="size-3" />
      </button>
    </div>
  );
}

// ── Staff meta edit dialog ────────────────────────────────────────────────────

type MetaForm = {
  perfRating: string; promoFlag: boolean; promoEta: string; staffRole: string;
  billingTarget: string; billingActual: string;
};

function MetaDialog({ staff, onClose, onSave, saving }: {
  staff: StaffWithMeta | null; onClose: () => void;
  onSave: (f: MetaForm) => void; saving: boolean;
}) {
  const m = staff?.meta;
  const [form, setForm] = useState<MetaForm>({
    perfRating: m?.perfRating ?? "N/A", promoFlag: m?.promoFlag ?? false,
    promoEta: m?.promoEta ?? "", staffRole: m?.staffRole ?? "",
    billingTarget: m?.billingTarget ?? "", billingActual: m?.billingActual ?? "",
  });

  // reset on new staff
  const [prev, setPrev] = useState(staff);
  if (staff !== prev) {
    setPrev(staff);
    setForm({
      perfRating: m?.perfRating ?? "N/A", promoFlag: m?.promoFlag ?? false,
      promoEta: m?.promoEta ?? "", staffRole: m?.staffRole ?? "",
      billingTarget: m?.billingTarget ?? "", billingActual: m?.billingActual ?? "",
    });
  }

  const set = (k: keyof MetaForm) => (v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={!!staff} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">{staff?.name}</DialogTitle>
          <p className="text-xs text-muted-foreground">{staff?.role} · {staff?.office}</p>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block text-[11px] text-muted-foreground">Role Override</Label>
            <Input value={form.staffRole} onChange={(e) => set("staffRole")(e.target.value)} className="h-8 text-xs" placeholder={staff?.role ?? ""} />
          </div>
          <div>
            <Label className="mb-1 block text-[11px] text-muted-foreground">Billing Target ($)</Label>
            <Input type="number" value={form.billingTarget} onChange={(e) => set("billingTarget")(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="mb-1 block text-[11px] text-muted-foreground">Billing Actual ($)</Label>
            <Input type="number" value={form.billingActual} onChange={(e) => set("billingActual")(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="mb-1 block text-[11px] text-muted-foreground">Performance Rating</Label>
            <Select value={form.perfRating} onValueChange={set("perfRating")}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Exceeds">Exceeds</SelectItem>
                <SelectItem value="Meets">Meets</SelectItem>
                <SelectItem value="Below">Below</SelectItem>
                <SelectItem value="N/A">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input id="promoFlag" type="checkbox" checked={form.promoFlag}
              onChange={(e) => set("promoFlag")(e.target.checked)} className="size-3.5" />
            <Label htmlFor="promoFlag" className="text-xs">Promotion Flagged</Label>
          </div>
          {form.promoFlag && (
            <div>
              <Label className="mb-1 block text-[11px] text-muted-foreground">Promo ETA</Label>
              <Input value={form.promoEta} onChange={(e) => set("promoEta")(e.target.value)} className="h-8 text-xs" placeholder="e.g. Q2 FY26" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={saving} onClick={() => onSave(form)}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Filters ───────────────────────────────────────────────────────────────────

function unique(items: StaffWithMeta[], key: keyof StaffWithMeta): string[] {
  return [...new Set(items.map((i) => i[key] as string | null).filter((v): v is string => !!v))].sort();
}

// ── Page ──────────────────────────────────────────────────────────────────────

function WfpPage() {
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const hasWriteAccess = canWrite(userRole);

  const qc = useQueryClient();
  const [editStaff, setEditStaff] = useState<StaffWithMeta | null>(null);
  const [filterSl, setFilterSl] = useState("");
  const [filterOffice, setFilterOffice] = useState("");
  const [filterPromo, setFilterPromo] = useState(false);

  const query = useQuery(trpc.wfp.getStaffWithMeta.queryOptions());
  const allStaff = (query.data ?? []) as StaffWithMeta[];

  const upsertMeta = useMutation(trpc.wfp.upsertStaffMeta.mutationOptions({
    onSuccess: () => { qc.invalidateQueries({ queryKey: trpc.wfp.getStaffWithMeta.queryKey() }); setEditStaff(null); toast.success("Saved"); },
    onError: (e) => toast.error(e.message),
  }));

  const quickUpsert = (cbId: string, patch: Record<string, string>) => {
    upsertMeta.mutate({ cbId, ...patch });
  };

  const filtered = allStaff.filter((s) => {
    if (filterSl && s.sl !== filterSl) return false;
    if (filterOffice && s.office !== filterOffice) return false;
    if (filterPromo && !s.meta?.promoFlag) return false;
    return true;
  });

  // Totals
  const totalTarget = filtered.reduce((s, r) => s + Number(r.meta?.billingTarget ?? 0), 0);
  const totalActual = filtered.reduce((s, r) => s + Number(r.meta?.billingActual ?? 0), 0);
  const promoCount = filtered.filter((r) => r.meta?.promoFlag).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">Workforce Planning</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {filtered.length} staff · {fmtDollar(String(totalTarget))} target · {fmtDollar(String(totalActual))} actual
            {promoCount > 0 && <span className="ml-2 text-amber-400">{promoCount} promo flagged</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-3">
        <Select value={filterSl || "__all__"} onValueChange={(v) => setFilterSl(v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="All SLs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Service Lines</SelectItem>
            {unique(allStaff, "sl").map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterOffice || "__all__"} onValueChange={(v) => setFilterOffice(v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All Offices" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Offices</SelectItem>
            {unique(allStaff, "office").map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={() => setFilterPromo((p) => !p)}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${filterPromo ? "border-amber-500/40 bg-amber-500/10 text-amber-400" : "border-border text-muted-foreground hover:text-foreground"}`}
        >
          <Star className="size-3" /> Promo only
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {query.isPending ? (
          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">No staff found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>SL</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>Pod</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Attainment</TableHead>
                <TableHead>Perf</TableHead>
                <TableHead>Promo</TableHead>
                {hasWriteAccess && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.meta?.staffRole || s.role || "—"}</TableCell>
                  <TableCell className="text-xs">{s.sl ?? "—"}</TableCell>
                  <TableCell className="text-xs">{s.office ?? "—"}</TableCell>
                  <TableCell className="text-xs">{s.pod ?? "—"}</TableCell>
                  <TableCell>
                    <EditableCell
                      value={s.meta?.billingTarget}
                      onSave={(v) => quickUpsert(s.id, { billingTarget: v })}
                      disabled={!hasWriteAccess}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={s.meta?.billingActual}
                      onSave={(v) => quickUpsert(s.id, { billingActual: v })}
                      disabled={!hasWriteAccess}
                    />
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium tabular-nums ${Number(s.meta?.billingActual) >= Number(s.meta?.billingTarget) && s.meta?.billingTarget ? "text-green-400" : ""}`}>
                      {pct(s.meta?.billingActual, s.meta?.billingTarget)}
                    </span>
                  </TableCell>
                  <TableCell><PerfBadge rating={s.meta?.perfRating} /></TableCell>
                  <TableCell>
                    {s.meta?.promoFlag ? (
                      <div className="flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {s.meta.promoEta && <span className="text-[10px] text-amber-400">{s.meta.promoEta}</span>}
                      </div>
                    ) : <span className="text-xs text-muted-foreground/40">—</span>}
                  </TableCell>
                  {hasWriteAccess && (
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditStaff(s)}>
                        <Pencil className="size-3" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit dialog */}
      <MetaDialog
        staff={editStaff}
        onClose={() => setEditStaff(null)}
        onSave={(form) => {
          if (!editStaff) return;
          upsertMeta.mutate({
            cbId: editStaff.id,
            perfRating: form.perfRating,
            promoFlag: form.promoFlag,
            promoEta: form.promoEta || undefined,
            staffRole: form.staffRole || undefined,
            billingTarget: form.billingTarget || undefined,
            billingActual: form.billingActual || undefined,
          });
        }}
        saving={upsertMeta.isPending}
      />
    </div>
  );
}
