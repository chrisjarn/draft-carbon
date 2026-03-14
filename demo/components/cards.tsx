"use client";

import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from "lucide-react";

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  trend,
  icon,
  variant = "default",
  className,
}: StatCardProps) {
  const valueColors = {
    default: "text-[hsl(var(--text-strong-950))]",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    error: "text-red-600 dark:text-red-400",
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border border-[hsl(var(--stroke-soft-200))]/80 bg-[hsl(var(--bg-white-0))] p-4 transition-all duration-150",
        "hover:border-[hsl(var(--stroke-soft-200))] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
        "dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-[11px] text-[hsl(var(--text-soft-400))] uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <span className="text-[hsl(var(--text-soft-400))]/60">{icon}</span>
        )}
      </div>

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
              trend.positive
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
            )}
          >
            {trend.positive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <span className="text-xs text-[hsl(var(--text-soft-400))]">
          {subtitle}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// ENTITY CARD
// ============================================================================

interface EntityCardProps {
  name: string;
  subtitle?: string;
  state?: string;
  stateColor?: string;
  attainment?: number;
  avatars?: { initials: string; name: string }[];
  tags?: { label: string; color?: string }[];
  budget?: { used: number; total: number };
  stats: { label: string; value: string | number }[];
  onClick?: () => void;
  className?: string;
}

export function EntityCard({
  name,
  subtitle,
  state,
  stateColor,
  attainment,
  avatars = [],
  tags = [],
  budget,
  stats,
  onClick,
  className,
}: EntityCardProps) {
  const budgetPct = budget ? Math.min((budget.used / budget.total) * 100, 100) : 0;
  const budgetOver = budget ? budget.used > budget.total : false;
  const budgetRemaining = budget ? budget.total - budget.used : 0;
  const budgetBarColor = budgetOver
    ? "bg-red-500"
    : budgetPct >= 90
    ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group flex h-full min-h-52 flex-col rounded-xl border border-[hsl(var(--stroke-soft-200))]/80 bg-[hsl(var(--bg-white-0))] transition-all duration-150",
        "hover:border-[hsl(var(--stroke-soft-200))] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
        "dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-base text-[hsl(var(--text-strong-950))] leading-tight tracking-tight">
            {name}
          </h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-[hsl(var(--text-soft-400))]">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {attainment != null && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 font-semibold text-xs tabular-nums",
                attainment >= 95
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : attainment >= 80
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                  : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
              )}
            >
              {attainment}%
            </span>
          )}
          {state && (
            <span
              className="rounded-md border px-1.5 py-0.5 font-medium text-[10px] uppercase tracking-wide"
              style={{
                borderColor: stateColor ? `${stateColor}40` : undefined,
                color: stateColor,
              }}
            >
              {state}
            </span>
          )}
        </div>
      </div>

      {/* Avatars + Tags */}
      <div className="flex flex-1 flex-col gap-2.5 px-4 pt-2 pb-3">
        {avatars.length > 0 && (
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {avatars.slice(0, 4).map((avatar, i) => (
                <div
                  key={i}
                  className="flex size-7 items-center justify-center rounded-full border-2 border-[hsl(var(--bg-white-0))] bg-emerald-600 font-semibold text-[10px] text-white dark:border-neutral-900"
                  title={avatar.name}
                >
                  {avatar.initials}
                </div>
              ))}
              {avatars.length > 4 && (
                <div className="flex size-7 items-center justify-center rounded-full border-2 border-[hsl(var(--bg-white-0))] bg-neutral-200 font-medium text-[10px] text-neutral-600 dark:border-neutral-900 dark:bg-neutral-700 dark:text-neutral-300">
                  +{avatars.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="rounded-md border border-[hsl(var(--stroke-soft-200))]/60 bg-[hsl(var(--bg-weak-50))]/40 px-1.5 py-0.5 font-medium text-[10px] text-[hsl(var(--text-soft-400))] dark:border-neutral-700 dark:bg-neutral-800/50"
                style={tag.color ? { color: tag.color, borderColor: `${tag.color}40` } : undefined}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Budget bar */}
      {budget && budget.total > 0 && (
        <div className="px-4 pb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] text-[hsl(var(--text-soft-400))] uppercase tracking-wider">
              Budget
            </span>
            <span
              className={cn(
                "text-[11px] tabular-nums",
                budgetOver ? "text-red-500" : "text-[hsl(var(--text-soft-400))]"
              )}
            >
              {budgetOver
                ? `$${Math.abs(budgetRemaining).toLocaleString()} over`
                : `$${budgetRemaining.toLocaleString()} remaining`}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className={cn("h-full rounded-full transition-all", budgetBarColor)}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center divide-x divide-[hsl(var(--stroke-soft-200))]/60 border-t border-[hsl(var(--stroke-soft-200))]/60 dark:divide-neutral-800 dark:border-neutral-800">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-0.5 py-2.5">
            <span className="font-semibold text-sm tabular-nums tracking-tight text-[hsl(var(--text-strong-950))]">
              {stat.value}
            </span>
            <span className="text-[10px] text-[hsl(var(--text-soft-400))]">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PERSON CARD
// ============================================================================

interface PersonCardProps {
  name: string;
  role?: string;
  avatarColor?: string;
  tags?: { label: string; color?: string; variant?: "outline" | "filled" }[];
  salary?: number;
  onClick?: () => void;
  className?: string;
}

export function PersonCard({
  name,
  role,
  avatarColor = "#16a34a",
  tags = [],
  salary,
  onClick,
  className,
}: PersonCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl border border-[hsl(var(--stroke-soft-200))]/80 bg-[hsl(var(--bg-white-0))] p-3 text-left transition-all duration-150",
        "hover:border-[hsl(var(--stroke-soft-200))] hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
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
        <div className="truncate font-semibold text-sm text-[hsl(var(--text-strong-950))]">
          {name}
        </div>
        <div className="mt-0.5 truncate text-xs text-[hsl(var(--text-soft-400))]">
          {role ?? "—"}
        </div>

        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <span
                key={i}
                className={cn(
                  "rounded-md px-1.5 py-0.5 font-medium text-[10px]",
                  tag.variant === "filled"
                    ? "bg-neutral-100 text-[hsl(var(--text-sub-600))] dark:bg-neutral-800 dark:text-neutral-300"
                    : "border border-[hsl(var(--stroke-soft-200))]/80 text-[hsl(var(--text-soft-400))] dark:border-neutral-700"
                )}
                style={
                  tag.color
                    ? {
                        borderColor: `${tag.color}40`,
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

        {salary != null && (
          <div className="mt-2 text-xs tabular-nums text-[hsl(var(--text-soft-400))]">
            ${salary.toLocaleString()}
          </div>
        )}
      </div>
    </button>
  );
}

// ============================================================================
// SCENARIO CARD
// ============================================================================

interface ScenarioCardProps {
  name: string;
  description?: string;
  color?: string;
  metrics: {
    current: { payroll: number; capacity: number; multiple: number };
    projected: { payroll: number; capacity: number; multiple: number };
  };
  className?: string;
}

export function ScenarioCard({
  name,
  description,
  color = "#6366f1",
  metrics,
  className,
}: ScenarioCardProps) {
  const payrollDiff = metrics.projected.payroll - metrics.current.payroll;
  const multipleDiff = metrics.projected.multiple - metrics.current.multiple;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[hsl(var(--stroke-soft-200))]/80 bg-[hsl(var(--bg-white-0))] transition-all duration-150",
        "hover:border-[hsl(var(--stroke-soft-200))] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
        "dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
        className
      )}
    >
      <div
        className="absolute top-0 left-0 h-full w-1"
        style={{ backgroundColor: color }}
      />

      {/* Header */}
      <div className="p-4 pb-2 pl-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-[hsl(var(--text-strong-950))]">
            {name}
          </h3>
          <button className="rounded-md p-1 opacity-0 transition-opacity hover:bg-neutral-100 group-hover:opacity-100 dark:hover:bg-neutral-800">
            <MoreHorizontal className="size-4 text-[hsl(var(--text-soft-400))]" />
          </button>
        </div>
        {description && (
          <p className="mt-1 text-xs text-[hsl(var(--text-soft-400))]">
            {description}
          </p>
        )}
      </div>

      {/* Metrics Comparison */}
      <div className="space-y-2 px-4 pb-4 pl-5">
        <div className="rounded-lg border border-[hsl(var(--stroke-soft-200))]/60 dark:border-neutral-800">
          <div className="grid grid-cols-2 gap-4 border-b border-[hsl(var(--stroke-soft-200))]/60 bg-neutral-50/50 px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-800/30">
            <span className="font-medium text-[10px] text-[hsl(var(--text-soft-400))] uppercase tracking-wider">
              Current
            </span>
            <span className="font-medium text-[10px] text-[hsl(var(--text-soft-400))] uppercase tracking-wider">
              Projected
            </span>
          </div>

          {/* Payroll Row */}
          <div className="grid grid-cols-2 gap-4 border-b border-[hsl(var(--stroke-soft-200))]/60 px-3 py-2 dark:border-neutral-800">
            <div>
              <span className="text-[10px] text-[hsl(var(--text-soft-400))]">
                Payroll
              </span>
              <div className="font-semibold text-sm tabular-nums">
                ${metrics.current.payroll.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[hsl(var(--text-soft-400))]">
                Payroll
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-sm tabular-nums">
                  ${metrics.projected.payroll.toLocaleString()}
                </span>
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    payrollDiff > 0 ? "text-red-500" : "text-emerald-500"
                  )}
                >
                  {payrollDiff > 0 ? "+" : ""}
                  ${payrollDiff.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Multiple Row */}
          <div className="grid grid-cols-2 gap-4 px-3 py-2">
            <div>
              <span className="text-[10px] text-[hsl(var(--text-soft-400))]">
                Multiple
              </span>
              <div className="font-semibold text-sm tabular-nums">
                {metrics.current.multiple.toFixed(2)}x
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[hsl(var(--text-soft-400))]">
                Multiple
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-sm tabular-nums">
                  {metrics.projected.multiple.toFixed(2)}x
                </span>
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    multipleDiff > 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {multipleDiff > 0 ? "+" : ""}
                  {multipleDiff.toFixed(2)}x
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KPI CARD
// ============================================================================

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  valueClass?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function KpiCard({
  title,
  value,
  valueClass,
  icon,
  children,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border border-[hsl(var(--stroke-soft-200))]/80 bg-[hsl(var(--bg-white-0))] p-4 text-left transition-all duration-150",
        "hover:border-[hsl(var(--stroke-soft-200))] hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
        "dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <dt className="font-medium text-[11px] text-[hsl(var(--text-soft-400))] uppercase tracking-wider">
          {title}
        </dt>
        {icon && (
          <span className="text-[hsl(var(--text-soft-400))]/60">{icon}</span>
        )}
      </div>

      <dd
        className={cn(
          "mt-2 font-semibold text-xl tabular-nums tracking-tight",
          valueClass ?? "text-[hsl(var(--text-strong-950))]"
        )}
      >
        {value}
      </dd>

      {children && (
        <div className="mt-3 border-t border-[hsl(var(--stroke-soft-200))]/60 pt-3 dark:border-neutral-800">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PAGE STATS BAR
// ============================================================================

interface PageStat {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  indicator?: number;
  fraction?: string;
}

interface PageStatsBarProps {
  stats: PageStat[];
  children?: React.ReactNode;
  className?: string;
}

function StatIndicator({ value }: { value: number }) {
  const category = value < 0.3 ? "red" : value < 0.7 ? "amber" : "emerald";
  const activeBars = value < 0.3 ? 1 : value < 0.7 ? 2 : 3;
  const activeClass = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
  }[category];

  return (
    <div className="flex gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "h-3 w-1 rounded-sm transition-colors",
            i < activeBars ? activeClass : "bg-neutral-200 dark:bg-neutral-700"
          )}
        />
      ))}
    </div>
  );
}

export function PageStatsBar({ stats, children, className }: PageStatsBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6 border-b border-[hsl(var(--stroke-soft-200))]/60 bg-[hsl(var(--bg-white-0))] px-6 py-2.5",
        "dark:border-neutral-800 dark:bg-neutral-900/50",
        className
      )}
    >
      <div className="flex items-center divide-x divide-[hsl(var(--stroke-soft-200))]/60 dark:divide-neutral-800">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col gap-0.5 px-8 first:pl-0">
            <span className="font-medium text-[10px] text-[hsl(var(--text-soft-400))] uppercase tracking-wider">
              {stat.label}
            </span>
            <div className="flex items-center gap-1.5">
              {stat.indicator !== undefined && (
                <StatIndicator value={stat.indicator} />
              )}
              <span
                className={cn(
                  "font-semibold text-sm tabular-nums tracking-tight",
                  stat.valueClass ?? "text-[hsl(var(--text-strong-950))]"
                )}
              >
                {stat.value}
              </span>
              {stat.fraction && (
                <span className="text-xs tabular-nums text-[hsl(var(--text-soft-400))]">
                  {stat.fraction}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// ============================================================================
// SECTION HEADER
// ============================================================================

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div>
        <h2 className="font-semibold text-lg text-[hsl(var(--text-strong-950))] tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-[hsl(var(--text-soft-400))]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
