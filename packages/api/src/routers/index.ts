import { protectedProcedure, publicProcedure, router } from "../index";
import { carboniteRouter } from "./carbonite";
import { dashboardRouter } from "./dashboard";
import { hiringRouter } from "./hiring";
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
  dashboard: dashboardRouter,
  carbonite: carboniteRouter,
  hiring: hiringRouter,
});
export type AppRouter = typeof appRouter;
