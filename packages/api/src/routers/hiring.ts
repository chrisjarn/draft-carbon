import { db } from "@carbon-wfp/db";
import { hiringNeeds } from "@carbon-wfp/db/schema/hiring-needs";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

const WRITE_ROLES = ["admin", "practice_manager", "sl_lead", "state_manager"];

function assertWriter(role: string | undefined | null) {
  if (!role || !WRITE_ROLES.includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
  }
}

const hiringInput = z.object({
  role: z.string().min(1),
  sl: z.string().optional(),
  sg: z.string().optional(),
  state: z.string().optional(),
  office: z.string().optional(),
  location: z.string().optional(),
  positions: z.number().int().min(1).optional(),
  type: z.enum(["FT", "PT", "Contract"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  targetStart: z.string().optional(),
  approvedBy: z.string().optional(),
  managedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const hiringRouter = router({
  getAll: protectedProcedure
    .input(z.object({ status: z.enum(["open", "closed", "all"]).optional() }).optional())
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(hiringNeeds)
        .orderBy(asc(hiringNeeds.priority), asc(hiringNeeds.targetStart));

      const status = input?.status ?? "open";
      if (status === "all") return rows;
      return rows.filter((r) => r.status === status);
    }),

  create: protectedProcedure
    .input(hiringInput)
    .mutation(async ({ ctx, input }) => {
      assertWriter((ctx.session.user as { role?: string }).role);
      const id = `h${Date.now()}`;
      const [row] = await db
        .insert(hiringNeeds)
        .values({ id, ...input, status: "open" })
        .returning();
      return row;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(hiringInput.partial()))
    .mutation(async ({ ctx, input }) => {
      assertWriter((ctx.session.user as { role?: string }).role);
      const { id, ...fields } = input;
      const [row] = await db
        .update(hiringNeeds)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(hiringNeeds.id, id))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  close: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        closedHow: z.enum(["hired", "cancelled", "deferred"]),
        closedDate: z.string(),
        closedName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertWriter((ctx.session.user as { role?: string }).role);
      const { id, ...fields } = input;
      const [row] = await db
        .update(hiringNeeds)
        .set({ ...fields, status: "closed", updatedAt: new Date() })
        .where(eq(hiringNeeds.id, id))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  reopen: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      assertWriter((ctx.session.user as { role?: string }).role);
      const [row] = await db
        .update(hiringNeeds)
        .set({ status: "open", closedHow: null, closedDate: null, closedName: null, updatedAt: new Date() })
        .where(eq(hiringNeeds.id, input.id))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      assertWriter((ctx.session.user as { role?: string }).role);
      await db.delete(hiringNeeds).where(eq(hiringNeeds.id, input.id));
      return { deleted: input.id };
    }),
});
