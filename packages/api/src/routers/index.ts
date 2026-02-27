import { protectedProcedure, publicProcedure, router } from "../index";
import { carbonitesRouter } from "./carbonites";
import { entitiesRouter } from "./entities";
import { podBudgetsRouter } from "./pod-budgets";
import { todoRouter } from "./todo";

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
});
export type AppRouter = typeof appRouter;
