import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
	fy: z.string().optional(),
	state: z.string().optional(),
});

export const Route = createFileRoute("/_app/dashboard")({
	validateSearch: searchSchema,
});
