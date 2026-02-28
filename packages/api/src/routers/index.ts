import { protectedProcedure, publicProcedure, router } from "../index";
import { adminRouter } from "./admin";
import { carbonitesRouter } from "./carbonites";
import { dashboardRouter } from "./dashboard";
import { entitiesRouter } from "./entities";
import { hiringRouter } from "./hiring";
import { podBudgetsRouter } from "./pod-budgets";
import { priorYearRouter } from "./prior-year";
import { salaryBracketsRouter } from "./salary-brackets";
import { todoRouter } from "./todo";
import { wfpRouter } from "./wfp";
import { wfpExtendedRouter } from "./wfp-extended";

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
	priorYear: priorYearRouter,
	hiring: hiringRouter,
	salaryBrackets: salaryBracketsRouter,
	wfp: wfpRouter,
	wfpExtended: wfpExtendedRouter,
	admin: adminRouter,
	dashboard: dashboardRouter,
});
export type AppRouter = typeof appRouter;
