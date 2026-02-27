import { protectedProcedure, publicProcedure, router } from "../index";
import { carbonitesRouter } from "./carbonites";
import { entitiesRouter } from "./entities";
import { hiringRouter } from "./hiring";
import { podBudgetsRouter } from "./pod-budgets";
import { todoRouter } from "./todo";
import { wfpRouter } from "./wfp";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  todo: todoRouter,
  carbonites: carbonitesRouter,
  entities: entitiesRouter,
  podBudgets: podBudgetsRouter,
  hiring: hiringRouter,
  wfp: wfpRouter,
});
export type AppRouter = typeof appRouter;
