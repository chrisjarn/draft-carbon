"use client";

import { ArrowDown, ArrowUp, Building2, DollarSign, TrendingUp, Users } from "lucide-react";
import type { ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════════════════

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700",
        className
      )}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// METRIC CARD
// ═══════════════════════════════════════════════════════════════════════════

interface MetricCardProps {
  label: string;
  value: ReactNode;
  trend?: {
    value: string;
    direction: "up" | "down";
    positive?: boolean;
  };
  subtitle?: string;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
  variant?: "default" | "success" | "warning" | "error";
}

function MetricCard({
  label,
  value,
  trend,
  subtitle,
  icon,
  loading = false,
  className,
  variant = "default",
}: MetricCardProps) {
  const isPositive = trend
    ? (trend.positive ?? trend.direction === "up")
    : false;

  const valueColors = {
    default: "text-neutral-900 dark:text-neutral-100",
    success: "text-emerald-600 dark:text-emerald-500",
    warning: "text-amber-600 dark:text-amber-500",
    error: "text-red-600 dark:text-red-500",
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border border-neutral-200/80 bg-white p-4 transition-all duration-150",
        "hover:border-neutral-300 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-[11px] text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-neutral-400/60">{icon}</span>}
      </div>

      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-semibold text-2xl tabular-nums tracking-tight",
              valueColors[variant]
            )}
          >
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium text-xs tabular-nums",
                isPositive
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUp className="size-3" />
              ) : (
                <ArrowDown className="size-3" />
              )}
              {trend.value}
            </span>
          )}
        </div>
      )}

      {subtitle && !loading && (
        <span className="text-neutral-500 text-xs">{subtitle}</span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY CARD
// ═══════════════════════════════════════════════════════════════════════════

interface EntityCardProps {
  title: string;
  subtitle?: string;
  state?: string | null;
  attainment?: { percent: number; status: "success" | "warning" | "error" };
  staff?: { initials: string[]; count: number };
  tags?: Array<{ id: string; label: string; color?: string }>;
  budgetProgress?: { percent: number; status: "healthy" | "warning" | "over"; label: string };
  stats?: Array<{ label: string; value: string | number }>;
  onClick?: () => void;
  className?: string;
}

function EntityCard({
  title,
  subtitle,
  state,
  attainment,
  staff,
  tags,
  budgetProgress,
  stats,
  onClick,
  className,
}: EntityCardProps) {
  const stateColors: Record<string, string> = {
    NSW: "#2563eb",
    VIC: "#7c3aed",
    QLD: "#dc2626",
    WA: "#ca8a04",
    SA: "#dc2626",
    TAS: "#16a34a",
  };

  const budgetColors = {
    healthy: "bg-emerald-500",
    warning: "bg-amber-500",
    over: "bg-red-500",
  };

  const attainmentColors = {
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
    error: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      className={cn(
        "group flex h-full flex-col rounded-xl border border-neutral-200/80 bg-white transition-all duration-150",
        "hover:border-neutral-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        "dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-base text-neutral-900 leading-tight tracking-tight dark:text-neutral-100">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-neutral-500">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {attainment && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 font-semibold text-xs tabular-nums",
                attainmentColors[attainment.status]
              )}
            >
              {attainment.percent}%
            </span>
          )}
          {state && (
            <span
              className="rounded-md border px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wide"
              style={{
                borderColor: `${stateColors[state] ?? "#888"}40`,
                color: stateColors[state] ?? "#888",
              }}
            >
              {state}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-3">
        {staff && staff.initials.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1.5">
              {staff.initials.slice(0, 4).map((initial, i) => (
                <div
                  key={`${initial}-${i}`}
                  className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-neutral-100 font-medium text-[10px] text-neutral-600 dark:border-neutral-900 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  {initial}
                </div>
              ))}
            </div>
            {staff.count > 4 && (
              <span className="ml-1 text-neutral-500 text-xs">+{staff.count - 4}</span>
            )}
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-md border border-neutral-200/80 bg-neutral-50/50 px-1.5 py-0.5 font-medium text-[10px] text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/50"
                style={
                  tag.color
                    ? {
                        borderColor: `${tag.color}30`,
                        color: tag.color,
                        backgroundColor: `${tag.color}08`,
                      }
                    : undefined
                }
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {budgetProgress && (
        <div className="px-4 pb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Budget
            </span>
            <span
              className={cn(
                "text-[11px] tabular-nums",
                budgetProgress.status === "over" ? "text-red-500" : "text-neutral-500"
              )}
            >
              {budgetProgress.label}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                budgetColors[budgetProgress.status]
              )}
              style={{ width: `${Math.min(budgetProgress.percent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {stats && stats.length > 0 && (
        <div className="flex items-center divide-x divide-neutral-200/80 border-t border-neutral-200/80 dark:divide-neutral-800 dark:border-neutral-800">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5"
            >
              <span className="font-semibold text-sm tabular-nums tracking-tight text-neutral-900 dark:text-neutral-100">
                {stat.value}
              </span>
              <span className="text-[10px] text-neutral-500">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSON CARD
// ═══════════════════════════════════════════════════════════════════════════

interface PersonCardProps {
  name: string;
  initials: string;
  role?: string;
  department?: { label: string; color?: string };
  badges?: Array<{ label: string; variant?: "default" | "outline" }>;
  salary?: string;
  avatarColor?: string;
  onClick?: () => void;
  className?: string;
}

function PersonCard({
  name,
  initials,
  role,
  department,
  badges,
  salary,
  avatarColor = "#16a34a",
  onClick,
  className,
}: PersonCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 text-left transition-all duration-150",
        "hover:border-neutral-300 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
        className
      )}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full font-semibold text-xs text-white"
        style={{ backgroundColor: avatarColor }}
      >
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-sm text-neutral-900 dark:text-neutral-100">
          {name}
        </div>
        {role && (
          <div className="mt-0.5 truncate text-neutral-500 text-xs">{role}</div>
        )}

        {(department || (badges && badges.length > 0)) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {department && (
              <span
                className="rounded-md border px-1.5 py-0.5 font-medium text-[10px]"
                style={{
                  borderColor: `${department.color ?? "#888"}40`,
                  color: department.color ?? "#888",
                  backgroundColor: `${department.color ?? "#888"}08`,
                }}
              >
                {department.label}
              </span>
            )}
            {badges?.map((badge) => (
              <span
                key={badge.label}
                className={cn(
                  "rounded-md px-1.5 py-0.5 font-medium text-[10px]",
                  badge.variant === "outline"
                    ? "border border-neutral-200/80 text-neutral-500 dark:border-neutral-700"
                    : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}

        {salary && (
          <div className="mt-2 text-neutral-500 text-xs tabular-nums">{salary}</div>
        )}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT ROW
// ═══════════════════════════════════════════════════════════════════════════

interface StatRowProps {
  stats: Array<{
    label: string;
    value: ReactNode;
    valueClass?: string;
    loading?: boolean;
    indicator?: number;
  }>;
  className?: string;
}

function StatRow({ stats, className }: StatRowProps) {
  const getIndicatorColor = (value: number) => {
    if (value < 0.3) return "bg-red-500";
    if (value < 0.7) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getIndicatorBars = (value: number) => {
    if (value < 0.3) return 1;
    if (value < 0.7) return 2;
    return 3;
  };

  return (
    <div
      className={cn(
        "flex items-center divide-x divide-neutral-200/80 rounded-xl border border-neutral-200/80 bg-white",
        "dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/50",
        className
      )}
    >
      {stats.map((stat, i) => (
        <div
          key={`${stat.label}-${i}`}
          className="flex flex-col gap-0.5 px-5 py-2.5 first:pl-5 last:pr-5"
        >
          <span className="font-medium text-[10px] text-neutral-500 uppercase tracking-wider">
            {stat.label}
          </span>
          {stat.loading ? (
            <Skeleton className="h-5 w-14" />
          ) : (
            <div className="flex items-center gap-1.5">
              {stat.indicator !== undefined && (
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((bar) => (
                    <div
                      key={bar}
                      className={cn(
                        "h-3 w-1 rounded-sm",
                        bar < getIndicatorBars(stat.indicator!)
                          ? getIndicatorColor(stat.indicator!)
                          : "bg-neutral-200 dark:bg-neutral-700"
                      )}
                    />
                  ))}
                </div>
              )}
              <span
                className={cn(
                  "font-semibold text-sm tabular-nums tracking-tight",
                  stat.valueClass ?? "text-neutral-900 dark:text-neutral-100"
                )}
              >
                {stat.value}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO CARD
// ═══════════════════════════════════════════════════════════════════════════

interface ScenarioCardProps {
  name: string;
  description?: string;
  color?: string;
  metrics?: Array<{
    label: string;
    base: string;
    revised: string;
    delta: string;
    isPositive?: boolean;
    invertColor?: boolean;
  }>;
  summary?: { payroll: string; headcount: number };
  className?: string;
}

function ScenarioCard({
  name,
  description,
  color = "#666",
  metrics,
  summary,
  className,
}: ScenarioCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white transition-all duration-150",
        "hover:border-neutral-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        "dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
        className
      )}
    >
      <div
        className="absolute top-0 left-0 h-full w-1"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-start justify-between gap-2 p-4 pb-2 pl-5">
        <div className="min-w-0">
          <h4 className="truncate font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            {name}
          </h4>
          {description && (
            <p className="mt-0.5 line-clamp-2 text-neutral-500 text-xs">
              {description}
            </p>
          )}
        </div>
      </div>

      {metrics && metrics.length > 0 && (
        <div className="space-y-1.5 px-4 py-2 pl-5">
          {metrics.map((metric) => {
            const isGood = metric.invertColor
              ? !metric.isPositive
              : metric.isPositive;
            return (
              <div
                key={metric.label}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-neutral-500 text-xs">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400/60 text-xs tabular-nums line-through">
                    {metric.base}
                  </span>
                  <span className="font-medium text-xs tabular-nums text-neutral-900 dark:text-neutral-100">
                    {metric.revised}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1 py-0.5 font-medium text-[10px] tabular-nums",
                      isGood
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                    )}
                  >
                    {metric.delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {summary && (
        <div className="flex items-center gap-4 border-t border-neutral-200/80 px-4 py-2.5 pl-5 text-xs dark:border-neutral-800">
          <span className="text-neutral-500">
            Payroll:{" "}
            <span className="font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
              {summary.payroll}
            </span>
          </span>
          <span className="text-neutral-500">
            Headcount:{" "}
            <span className="font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
              +{summary.headcount}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════

function SectionHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("", className)}>
      <h2 className="font-semibold text-base text-neutral-900 tracking-tight dark:text-neutral-100">
        {title}
      </h2>
      {description && (
        <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-200/60 bg-white px-8 py-6 dark:border-neutral-800 dark:bg-neutral-900/50">
        <h1 className="font-semibold text-2xl tracking-tight text-neutral-900 dark:text-neutral-100">
          Linear-Style Components Preview
        </h1>
        <p className="mt-1 text-neutral-500">
          Polished, professional card components for the Carbon WFP dashboard
        </p>
      </div>

      <div className="mx-auto max-w-6xl space-y-12 p-8">
        {/* Metric Cards */}
        <section>
          <SectionHeader
            title="Metric Cards"
            description="Single KPI displays with optional trends and icons"
            className="mb-4"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total Payroll"
              value="$2.4M"
              trend={{ value: "+12%", direction: "up" }}
              subtitle="Across all entities"
              icon={<DollarSign className="size-4" />}
            />
            <MetricCard
              label="Headcount"
              value="156"
              trend={{ value: "+8", direction: "up" }}
              subtitle="Active staff"
              icon={<Users className="size-4" />}
            />
            <MetricCard
              label="Budget Used"
              value="87%"
              variant="warning"
              subtitle="$340k remaining"
            />
            <MetricCard
              label="Revenue Gap"
              value="-$180k"
              variant="error"
              trend={{ value: "-5%", direction: "down", positive: true }}
            />
          </div>
        </section>

        {/* Stat Row */}
        <section>
          <SectionHeader
            title="Stat Row"
            description="Compact horizontal stat display with optional indicators"
            className="mb-4"
          />
          <StatRow
            stats={[
              { label: "Billing Capacity", value: "$3.8M", indicator: 0.85 },
              { label: "Payroll", value: "$2.4M" },
              { label: "Headcount", value: "156" },
              { label: "Utilization", value: "78%", indicator: 0.78 },
            ]}
          />
        </section>

        {/* Entity Cards */}
        <section>
          <SectionHeader
            title="Entity Cards"
            description="Business unit cards with staff, tags, and budget progress"
            className="mb-4"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <EntityCard
              title="Carbon Sydney"
              subtitle="Carbon Group Pty Ltd"
              state="NSW"
              attainment={{ percent: 94, status: "success" }}
              staff={{ initials: ["JD", "AK", "MP", "SR", "TW"], count: 24 }}
              tags={[
                { id: "tax", label: "Tax", color: "#2563eb" },
                { id: "audit", label: "Audit", color: "#7c3aed" },
                { id: "advisory", label: "Advisory", color: "#16a34a" },
              ]}
              budgetProgress={{ percent: 72, status: "healthy", label: "$280k remaining" }}
              stats={[
                { label: "Payroll/yr", value: "$1.2M" },
                { label: "Staff", value: 24 },
                { label: "Pods", value: 4 },
              ]}
            />
            <EntityCard
              title="Carbon Melbourne"
              subtitle="Carbon Victoria Pty Ltd"
              state="VIC"
              attainment={{ percent: 82, status: "warning" }}
              staff={{ initials: ["LM", "KC", "RB"], count: 18 }}
              tags={[
                { id: "tax", label: "Tax", color: "#2563eb" },
                { id: "wealth", label: "Wealth", color: "#ca8a04" },
              ]}
              budgetProgress={{ percent: 91, status: "warning", label: "$45k remaining" }}
              stats={[
                { label: "Payroll/yr", value: "$890k" },
                { label: "Staff", value: 18 },
                { label: "Pods", value: 3 },
              ]}
            />
            <EntityCard
              title="Carbon Brisbane"
              subtitle="Carbon QLD Pty Ltd"
              state="QLD"
              attainment={{ percent: 68, status: "error" }}
              staff={{ initials: ["PH", "NW"], count: 12 }}
              tags={[{ id: "advisory", label: "Advisory", color: "#16a34a" }]}
              budgetProgress={{ percent: 108, status: "over", label: "$32k over" }}
              stats={[
                { label: "Payroll/yr", value: "$540k" },
                { label: "Staff", value: 12 },
                { label: "Pods", value: 2 },
              ]}
            />
          </div>
        </section>

        {/* Person Cards */}
        <section>
          <SectionHeader
            title="Person Cards"
            description="Staff member cards with roles and metadata"
            className="mb-4"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PersonCard
              name="James Davidson"
              initials="JD"
              role="Senior Tax Accountant"
              department={{ label: "Tax", color: "#2563eb" }}
              badges={[
                { label: "NSW", variant: "outline" },
                { label: "FT" },
              ]}
              salary="$145,000"
            />
            <PersonCard
              name="Sarah Mitchell"
              initials="SM"
              role="Audit Manager"
              department={{ label: "Audit", color: "#7c3aed" }}
              badges={[
                { label: "VIC", variant: "outline" },
                { label: "FT" },
              ]}
              salary="$165,000"
              avatarColor="#7c3aed"
            />
            <PersonCard
              name="Michael Chen"
              initials="MC"
              role="Financial Advisor"
              department={{ label: "Advisory", color: "#16a34a" }}
              badges={[
                { label: "QLD", variant: "outline" },
                { label: "PT", variant: "outline" },
              ]}
              salary="$95,000"
              avatarColor="#0891b2"
            />
          </div>
        </section>

        {/* Scenario Cards */}
        <section>
          <SectionHeader
            title="Scenario Cards"
            description="What-if scenario displays with impact metrics"
            className="mb-4"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ScenarioCard
              name="Hire 2 Senior Accountants"
              description="Add capacity for Q3 workload increase"
              color="#16a34a"
              metrics={[
                {
                  label: "Billing Capacity",
                  base: "$3.8M",
                  revised: "$4.2M",
                  delta: "+$400k",
                  isPositive: true,
                },
                {
                  label: "Revenue Gap",
                  base: "-$180k",
                  revised: "+$220k",
                  delta: "+$400k",
                  isPositive: true,
                },
              ]}
              summary={{ payroll: "+$290k", headcount: 2 }}
            />
            <ScenarioCard
              name="Contract Team Extension"
              description="Extend contractor engagement through EOFY"
              color="#2563eb"
              metrics={[
                {
                  label: "Payroll",
                  base: "$2.4M",
                  revised: "$2.6M",
                  delta: "+$200k",
                  isPositive: false,
                  invertColor: true,
                },
                {
                  label: "Utilization",
                  base: "78%",
                  revised: "85%",
                  delta: "+7%",
                  isPositive: true,
                },
              ]}
              summary={{ payroll: "+$200k", headcount: 4 }}
            />
          </div>
        </section>

        {/* Loading States */}
        <section>
          <SectionHeader
            title="Loading States"
            description="Skeleton loading indicators"
            className="mb-4"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Loading..." value="" loading />
            <MetricCard label="Loading..." value="" loading />
            <StatRow
              className="col-span-2"
              stats={[
                { label: "Loading", value: "", loading: true },
                { label: "Loading", value: "", loading: true },
                { label: "Loading", value: "", loading: true },
              ]}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
