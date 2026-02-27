import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/carbonites")({
  component: CarbonitesPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type Carbonite = {
  id: string;
  name: string;
  role: string | null;
  sl: string | null;
  sg: string | null;
  state: string | null;
  office: string | null;
  pod: string | null;
  salary: number | null;
  type: string | null;
  seniority: number | null;
  location: string | null;
  hours: number | null;
  isPartner: boolean | null;
  entity: string | null;
  reportsTo: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

// ── RBAC ─────────────────────────────────────────────────────────────────────

const WRITE_ROLES = ["admin", "practice_manager", "sl_lead", "state_manager"];

function canWrite(role: string | undefined | null) {
  return WRITE_ROLES.includes(role ?? "");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function seniorityLabel(s: number | null) {
  if (!s) return "—";
  if (s >= 9) return "Principal";
  if (s >= 7) return "Senior";
  if (s >= 5) return "Mid";
  if (s >= 3) return "Junior";
  return "Graduate";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Filter bar ────────────────────────────────────────────────────────────────

type Filters = {
  search: string;
  state: string;
  sl: string;
  office: string;
  type: string;
};

const EMPTY_FILTERS: Filters = { search: "", state: "", sl: "", office: "", type: "" };

function unique(items: Carbonite[], key: keyof Carbonite): string[] {
  const vals = items.map((i) => i[key] as string | null).filter((v): v is string => !!v);
  return [...new Set(vals)].sort();
}

function FilterBar({
  filters,
  onChange,
  allData,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  allData: Carbonite[];
}) {
  const set = (k: keyof Filters) => (v: string) => onChange({ ...filters, [k]: v === "__all__" ? "" : v });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search name, role, pod…"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="h-8 w-52 text-xs"
      />
      <SelectFilter placeholder="State" value={filters.state} options={unique(allData, "state")} onChange={set("state")} />
      <SelectFilter placeholder="Service Line" value={filters.sl} options={unique(allData, "sl")} onChange={set("sl")} />
      <SelectFilter placeholder="Office" value={filters.office} options={unique(allData, "office")} onChange={set("office")} />
      <SelectFilter placeholder="Type" value={filters.type} options={["FT", "PT"]} onChange={set("type")} />
      {Object.values(filters).some(Boolean) && (
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onChange(EMPTY_FILTERS)}>
          <X className="mr-1 size-3" /> Clear
        </Button>
      )}
    </div>
  );
}

function SelectFilter({ placeholder, value, options, onChange }: {
  placeholder: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <Select value={value || "__all__"} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-36 text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All {placeholder}s</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// ── Detail sheet ──────────────────────────────────────────────────────────────

function DetailSheet({ carbonite, onClose, onEdit, onDelete, canWriteAccess }: {
  carbonite: Carbonite | null;
  onClose: () => void;
  onEdit: (c: Carbonite) => void;
  onDelete: (c: Carbonite) => void;
  canWriteAccess: boolean;
}) {
  return (
    <Sheet open={!!carbonite} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[380px] sm:w-[420px]">
        {carbonite && (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {initials(carbonite.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-base">{carbonite.name}</SheetTitle>
                  <p className="text-xs text-muted-foreground">{carbonite.role ?? "—"}</p>
                </div>
              </div>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4 pr-4">
                <DetailSection title="Organisation">
                  <DetailRow label="Service Line" value={carbonite.sl} />
                  <DetailRow label="Sub Group" value={carbonite.sg} />
                  <DetailRow label="State" value={carbonite.state} />
                  <DetailRow label="Office" value={carbonite.office} />
                  <DetailRow label="Pod" value={carbonite.pod} />
                  <DetailRow label="Entity" value={carbonite.entity} />
                  <DetailRow label="Reports To" value={carbonite.reportsTo} />
                </DetailSection>
                <DetailSection title="Employment">
                  <DetailRow label="Type" value={carbonite.type} />
                  <DetailRow label="Location" value={carbonite.location} />
                  <DetailRow label="Hours / week" value={carbonite.hours?.toString()} />
                  <DetailRow label="Seniority" value={`${carbonite.seniority} — ${seniorityLabel(carbonite.seniority)}`} />
                  <DetailRow label="Salary" value={carbonite.salary ? `$${carbonite.salary.toLocaleString()}` : undefined} />
                  <DetailRow label="Partner" value={carbonite.isPartner ? "Yes" : "No"} />
                </DetailSection>
              </div>
            </ScrollArea>
            {canWriteAccess && (
              <div className="flex gap-2 pt-4">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(carbonite)}>
                  <Pencil className="mr-1.5 size-3" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(carbonite)}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-medium">{value ?? "—"}</span>
    </div>
  );
}

// ── Edit/Create dialog ────────────────────────────────────────────────────────

type FormState = {
  name: string; role: string; sl: string; sg: string; state: string;
  office: string; pod: string; salary: string; type: "FT" | "PT";
  seniority: string; location: string; hours: string; isPartner: boolean;
  entity: string; reportsTo: string;
};

function emptyForm(): FormState {
  return { name: "", role: "", sl: "", sg: "", state: "", office: "", pod: "",
    salary: "", type: "FT", seniority: "5", location: "", hours: "",
    isPartner: false, entity: "", reportsTo: "" };
}

function carboniteToForm(c: Carbonite): FormState {
  return {
    name: c.name, role: c.role ?? "", sl: c.sl ?? "", sg: c.sg ?? "",
    state: c.state ?? "", office: c.office ?? "", pod: c.pod ?? "",
    salary: c.salary?.toString() ?? "", type: (c.type as "FT" | "PT") ?? "FT",
    seniority: c.seniority?.toString() ?? "5", location: c.location ?? "",
    hours: c.hours?.toString() ?? "", isPartner: c.isPartner ?? false,
    entity: c.entity ?? "", reportsTo: c.reportsTo ?? "",
  };
}

function CarboniteDialog({ open, onClose, initial, onSave, saving }: {
  open: boolean; onClose: () => void; initial: FormState;
  onSave: (f: FormState) => void; saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) { setPrevInitial(initial); setForm(initial); }

  const set = (k: keyof FormState) => (v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial.name ? "Edit Carbonite" : "Add Carbonite"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="grid grid-cols-2 gap-3 p-1">
            <div className="col-span-2">
              <Label className="mb-1 block text-[11px] text-muted-foreground">Name *</Label>
              <Input value={form.name} onChange={(e) => set("name")(e.target.value)} className="h-8 text-xs" />
            </div>
            {(["role", "sl", "sg", "state", "office", "pod", "entity"] as const).map((field) => (
              <div key={field}>
                <Label className="mb-1 block text-[11px] text-muted-foreground capitalize">{field === "sl" ? "Service Line" : field === "sg" ? "Sub Group" : field}</Label>
                <Input value={form[field]} onChange={(e) => set(field)(e.target.value)} className="h-8 text-xs" />
              </div>
            ))}
            <div>
              <Label className="mb-1 block text-[11px] text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type")(v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FT">Full Time</SelectItem>
                  <SelectItem value="PT">Part Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-[11px] text-muted-foreground">Seniority (1–10)</Label>
              <Input type="number" min={1} max={10} value={form.seniority} onChange={(e) => set("seniority")(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="mb-1 block text-[11px] text-muted-foreground">Salary</Label>
              <Input type="number" value={form.salary} onChange={(e) => set("salary")(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="mb-1 block text-[11px] text-muted-foreground">Hours / week</Label>
              <Input type="number" value={form.hours} onChange={(e) => set("hours")(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block text-[11px] text-muted-foreground">Location</Label>
              <Input value={form.location} onChange={(e) => set("location")(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block text-[11px] text-muted-foreground">Reports To</Label>
              <Input value={form.reportsTo} onChange={(e) => set("reportsTo")(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input id="isPartner" type="checkbox" checked={form.isPartner}
                onChange={(e) => set("isPartner")(e.target.checked)} className="size-3.5" />
              <Label htmlFor="isPartner" className="text-xs">Partner</Label>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!form.name || saving} onClick={() => onSave(form)}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function CarbonitesPage() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-lg font-extrabold tracking-tight">Carbonites</h1>
				<p className="mt-1 text-xs text-muted-foreground">
					Staff directory — searchable and filterable by state, service line, office and pod
				</p>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center gap-2">
					<Users className="size-4 text-muted-foreground" />
					<CardTitle>Coming Soon</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-xs text-muted-foreground">
						Staff directory with filterable table, inline detail panel and full CRUD
						for admin and manager roles.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
