import type {
	FormAsyncValidateOrFn,
	FormValidateOrFn,
	ReactFormExtendedApi,
} from "@tanstack/react-form";

// ---------------------------------------------------------------------------
// Create payload sent to the server
// ---------------------------------------------------------------------------

export type CreatePayload = {
	name: string;
	role?: string;
	sl?: string;
	sg?: string;
	state?: string;
	office?: string;
	pod?: string;
	salary?: number;
	type?: "FT" | "PT";
	seniority?: number;
	location?: string;
	hours?: number;
	isPartner?: boolean;
	entity?: string;
	reportsTo?: string;
	startDate?: string;
};

// ---------------------------------------------------------------------------
// Form values (all strings for controlled inputs, coerced on submit)
// ---------------------------------------------------------------------------

export type CreateFormValues = {
	firstName: string;
	lastName: string;
	type: "FT" | "PT";
	startDate: string;
	hours: string;
	location: string;
	state: string;
	office: string;
	sl: string;
	sg: string;
	role: string;
	seniority: string;
	pod: string;
	reportsTo: string;
	salary: string;
	isPartner: boolean;
};

export const defaultCreateValues: CreateFormValues = {
	firstName: "",
	lastName: "",
	type: "FT",
	startDate: "",
	hours: "",
	location: "",
	state: "",
	office: "",
	sl: "",
	sg: "",
	role: "",
	seniority: "5",
	pod: "",
	reportsTo: "",
	salary: "",
	isPartner: false,
};

// ---------------------------------------------------------------------------
// Shared form type — matches what useForm() returns when called without
// explicit form-level validators (each position is `Validator | undefined`).
// ---------------------------------------------------------------------------

type V = FormValidateOrFn<CreateFormValues> | undefined;
type A = FormAsyncValidateOrFn<CreateFormValues> | undefined;

export type CreateForm = ReactFormExtendedApi<
	CreateFormValues,
	V, // TOnMount
	V, // TOnChange
	A, // TOnChangeAsync
	V, // TOnBlur
	A, // TOnBlurAsync
	V, // TOnSubmit
	A, // TOnSubmitAsync
	V, // TOnDynamic
	A, // TOnDynamicAsync
	A, // TOnServer
	unknown // TSubmitMeta
>;
