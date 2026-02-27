import { db } from "@carbon-wfp/db";
import { carbonites } from "@carbon-wfp/db/schema/carbonites";
import { entities } from "@carbon-wfp/db/schema/entities";
import { wfpEntitySettings, wfpRevenue, wfpStaffMeta } from "@carbon-wfp/db/schema/wfp";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

const WRITE_ROLES = ["admin", "practice_manager", "sl_lead", "state_manager"];

function assertWriter(role: string | undefined | null) {
  if (!role || !WRITE_ROLES.includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
  }
}

export const wfpRouter = router({
  // ── Staff meta ──────────────────────────────────────────────────────────────

  getStaffWithMeta: protectedProcedure.query(async () => {
    const staff = await db.select().from(carbonites).orderBy(asc(carbonites.state), asc(carbonites.office), asc(carbonites.name));
    const meta = await db.select().from(wfpStaffMeta);
    const metaMap = new Map(meta.map((m) => [m.cbId, m]));
    return staff.map((s) => ({ ...s, meta: metaMap.get(s.id) ?? null }));
  }),

  upsertStaffMeta: protectedProcedure
    .input(
      z.object({
        cbId: z.string(),
        billingTarget: z.string().optional(),
        billingActual: z.string().optional(),
        perfRating: z.string().optional(),
        promoFlag: z.boolean().optional(),
        promoEta: z.string().optional(),
        staffRole: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertWriter((ctx.session.user as { role?: string }).role);
      const existing = await db.select().from(wfpStaffMeta).where(eq(wfpStaffMeta.cbId, input.cbId));
      if (existing.length > 0) {
        const [row] = await db
          .update(wfpStaffMeta)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(wfpStaffMeta.cbId, input.cbId))
          .returning();
        return row;
      }
      const [row] = await db.insert(wfpStaffMeta).values(input).returning();
      return row;
    }),

  // ── Entity settings ─────────────────────────────────────────────────────────

  getEntitySettings: protectedProcedure.query(async () => {
    const ents = await db.select().from(entities).orderBy(asc(entities.state), asc(entities.biz));
    const settings = await db.select().from(wfpEntitySettings);
    const settingsMap = new Map(settings.map((s) => [s.entId, s]));
    return ents.map((e) => ({ ...e, settings: settingsMap.get(e.id) ?? null }));
  }),

  upsertEntitySettings: protectedProcedure
    .input(
      z.object({
        entId: z.string(),
        billingMultiplier: z.string().optional(),
        fy: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertWriter((ctx.session.user as { role?: string }).role);
      const existing = await db.select().from(wfpEntitySettings).where(eq(wfpEntitySettings.entId, input.entId));
      if (existing.length > 0) {
        const [row] = await db
          .update(wfpEntitySettings)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(wfpEntitySettings.entId, input.entId))
          .returning();
        return row;
      }
      const [row] = await db.insert(wfpEntitySettings).values(input).returning();
      return row;
    }),

  // ── Revenue ─────────────────────────────────────────────────────────────────

  getRevenue: protectedProcedure
    .input(z.object({ fy: z.string() }))
    .query(async ({ input }) => {
      const ents = await db.select().from(entities).orderBy(asc(entities.state), asc(entities.biz));
      const revenue = await db.select().from(wfpRevenue).where(eq(wfpRevenue.fy, input.fy));
      const revenueMap = new Map(revenue.map((r) => [r.entId, r]));
      return ents.map((e) => ({ ...e, revenue: revenueMap.get(e.id) ?? null }));
    }),

  upsertRevenue: protectedProcedure
    .input(
      z.object({
        entId: z.string(),
        fy: z.string(),
        target: z.string().optional(),
        actual: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertWriter((ctx.session.user as { role?: string }).role);
      const existing = await db
        .select()
        .from(wfpRevenue)
        .where(and(eq(wfpRevenue.entId, input.entId), eq(wfpRevenue.fy, input.fy)));
      if (existing.length > 0) {
        const [row] = await db
          .update(wfpRevenue)
          .set({ ...input, updatedAt: new Date() })
          .where(and(eq(wfpRevenue.entId, input.entId), eq(wfpRevenue.fy, input.fy)))
          .returning();
        return row;
      }
      const [row] = await db.insert(wfpRevenue).values(input).returning();
      return row;
    }),
});
