import {
  StatCard,
  EntityCard,
  PersonCard,
  ScenarioCard,
  KpiCard,
  PageStatsBar,
  SectionHeader,
} from "@/components/cards";
import {
  Users,
  DollarSign,
  TrendingUp,
  Briefcase,
  Target,
} from "lucide-react";

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <header className="border-b border-[hsl(var(--stroke-soft-200))]/60 bg-[hsl(var(--bg-white-0))] dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <h1 className="font-semibold text-xl text-[hsl(var(--text-strong-950))] tracking-tight">
            Linear-Style Card Components
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--text-soft-400))]">
            Polished, professional UI components for workforce planning dashboards
          </p>
        </div>
      </header>

      {/* Page Stats Bar Demo */}
      <PageStatsBar
        stats={[
          { label: "Total Staff", value: "127", indicator: 0.85, fraction: "/ 150" },
          { label: "Budget Used", value: "$2.4M", valueClass: "text-amber-500" },
          { label: "Utilization", value: "78%", indicator: 0.78 },
          { label: "Revenue Gap", value: "$340K", valueClass: "text-red-500" },
        ]}
      >
        <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
          Add Staff
        </button>
      </PageStatsBar>

      <main className="mx-auto max-w-7xl space-y-12 px-6 py-8">
        {/* Stat Cards Section */}
        <section>
          <SectionHeader
            title="Stat Cards"
            description="Single KPI displays with optional trends and icons"
            className="mb-6"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Headcount"
              value="127"
              trend={{ value: "+12%", positive: true }}
              icon={<Users className="size-4" />}
              subtitle="vs. last quarter"
            />
            <StatCard
              label="Annual Payroll"
              value="$2.4M"
              trend={{ value: "-3%", positive: false }}
              icon={<DollarSign className="size-4" />}
              variant="warning"
            />
            <StatCard
              label="Billing Multiple"
              value="3.2x"
              trend={{ value: "+0.4x", positive: true }}
              icon={<TrendingUp className="size-4" />}
              variant="success"
            />
            <StatCard
              label="Open Positions"
              value="8"
              icon={<Briefcase className="size-4" />}
              subtitle="3 urgent"
              variant="error"
            />
          </div>
        </section>

        {/* Entity Cards Section */}
        <section>
          <SectionHeader
            title="Entity Cards"
            description="Business unit cards with staff, budget tracking, and key metrics"
            className="mb-6"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <EntityCard
              name="Sydney Office"
              subtitle="Carbon Group Pty Ltd"
              state="NSW"
              stateColor="#3b82f6"
              attainment={94}
              avatars={[
                { initials: "JD", name: "John Doe" },
                { initials: "AS", name: "Alice Smith" },
                { initials: "BC", name: "Bob Chen" },
                { initials: "MK", name: "Mary Kim" },
                { initials: "TP", name: "Tom Park" },
              ]}
              tags={[
                { label: "Audit", color: "#8b5cf6" },
                { label: "Tax", color: "#10b981" },
                { label: "Advisory" },
              ]}
              budget={{ used: 890000, total: 1000000 }}
              stats={[
                { label: "Payroll/yr", value: "$1.2M" },
                { label: "Staff", value: 42 },
                { label: "Pods", value: 6 },
              ]}
              onClick={() => {}}
            />
            <EntityCard
              name="Melbourne Office"
              subtitle="Carbon Group VIC"
              state="VIC"
              stateColor="#06b6d4"
              attainment={87}
              avatars={[
                { initials: "RW", name: "Rachel Wong" },
                { initials: "DL", name: "David Lee" },
                { initials: "SJ", name: "Sarah Jones" },
              ]}
              tags={[
                { label: "Audit", color: "#8b5cf6" },
                { label: "Advisory" },
              ]}
              budget={{ used: 720000, total: 800000 }}
              stats={[
                { label: "Payroll/yr", value: "$890K" },
                { label: "Staff", value: 28 },
                { label: "Pods", value: 4 },
              ]}
              onClick={() => {}}
            />
            <EntityCard
              name="Brisbane Office"
              subtitle="Carbon Group QLD"
              state="QLD"
              stateColor="#f59e0b"
              attainment={72}
              avatars={[
                { initials: "KT", name: "Kevin Tan" },
                { initials: "LM", name: "Lisa Miller" },
              ]}
              tags={[{ label: "Tax", color: "#10b981" }]}
              budget={{ used: 450000, total: 400000 }}
              stats={[
                { label: "Payroll/yr", value: "$520K" },
                { label: "Staff", value: 15 },
                { label: "Pods", value: 2 },
              ]}
              onClick={() => {}}
            />
          </div>
        </section>

        {/* Person Cards Section */}
        <section>
          <SectionHeader
            title="Person Cards"
            description="Staff member cards with role, tags, and compensation"
            className="mb-6"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PersonCard
              name="Sarah Johnson"
              role="Senior Auditor"
              avatarColor="#16a34a"
              tags={[
                { label: "Audit", color: "#8b5cf6" },
                { label: "NSW" },
                { label: "Sydney", variant: "filled" },
                { label: "FT" },
              ]}
              salary={125000}
              onClick={() => {}}
            />
            <PersonCard
              name="Michael Chen"
              role="Tax Manager"
              avatarColor="#2563eb"
              tags={[
                { label: "Tax", color: "#10b981" },
                { label: "VIC" },
                { label: "Melbourne", variant: "filled" },
                { label: "FT" },
              ]}
              salary={145000}
              onClick={() => {}}
            />
            <PersonCard
              name="Emma Williams"
              role="Graduate Accountant"
              avatarColor="#dc2626"
              tags={[
                { label: "Advisory", color: "#f59e0b" },
                { label: "QLD" },
                { label: "PT" },
              ]}
              salary={65000}
              onClick={() => {}}
            />
            <PersonCard
              name="James Taylor"
              role="Partner"
              avatarColor="#7c3aed"
              tags={[
                { label: "Audit", color: "#8b5cf6" },
                { label: "Tax", color: "#10b981" },
                { label: "NSW" },
              ]}
              salary={280000}
              onClick={() => {}}
            />
          </div>
        </section>

        {/* Scenario Cards Section */}
        <section>
          <SectionHeader
            title="Scenario Cards"
            description="What-if scenario comparisons with metrics"
            className="mb-6"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ScenarioCard
              name="Hire 2 Senior Auditors"
              description="Expand audit capacity for Q3 demand"
              color="#8b5cf6"
              metrics={{
                current: { payroll: 1200000, capacity: 3600000, multiple: 3.0 },
                projected: { payroll: 1450000, capacity: 4350000, multiple: 3.0 },
              }}
            />
            <ScenarioCard
              name="Promote 3 to Manager"
              description="Internal progression pathway"
              color="#10b981"
              metrics={{
                current: { payroll: 1200000, capacity: 3600000, multiple: 3.0 },
                projected: { payroll: 1320000, capacity: 3960000, multiple: 3.0 },
              }}
            />
            <ScenarioCard
              name="Restructure Tax Team"
              description="Optimize team composition"
              color="#f59e0b"
              metrics={{
                current: { payroll: 890000, capacity: 2670000, multiple: 3.0 },
                projected: { payroll: 850000, capacity: 2890000, multiple: 3.4 },
              }}
            />
          </div>
        </section>

        {/* KPI Cards Section */}
        <section>
          <SectionHeader
            title="KPI Cards"
            description="Expandable metric cards with child content"
            className="mb-6"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              title="Revenue Target"
              value="$4.2M"
              icon={<Target className="size-4" />}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[hsl(var(--text-soft-400))]">Progress</span>
                  <span className="tabular-nums">78%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div className="h-full w-[78%] rounded-full bg-emerald-500" />
                </div>
              </div>
            </KpiCard>
            <KpiCard
              title="Capacity Utilization"
              value="82%"
              valueClass="text-emerald-500"
              icon={<Users className="size-4" />}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-[hsl(var(--text-soft-400))]">Available</span>
                <span className="tabular-nums">18% (23 FTE)</span>
              </div>
            </KpiCard>
            <KpiCard
              title="Hiring Pipeline"
              value="12"
              icon={<Briefcase className="size-4" />}
            >
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-semibold text-sm">4</div>
                  <div className="text-[10px] text-[hsl(var(--text-soft-400))]">Applied</div>
                </div>
                <div>
                  <div className="font-semibold text-sm">5</div>
                  <div className="text-[10px] text-[hsl(var(--text-soft-400))]">Interview</div>
                </div>
                <div>
                  <div className="font-semibold text-sm">3</div>
                  <div className="text-[10px] text-[hsl(var(--text-soft-400))]">Offer</div>
                </div>
              </div>
            </KpiCard>
          </div>
        </section>
      </main>
    </div>
  );
}
