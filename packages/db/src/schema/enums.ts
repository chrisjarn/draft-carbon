import { pgEnum } from "drizzle-orm/pg-core";

export const STATE_VALUES = ["nsw", "vic", "qld", "wa", "sa"] as const;
export const SL_VALUES = ["acc", "bkcfo", "fin", "wm", "rd", "ins"] as const;
export const OFFICE_VALUES = [
	"parramatta",
	"st-leonards",
	"elsternwick",
	"monash",
	"mornington",
	"mount-waverley",
	"brisbane",
	"bundaberg",
	"fraser-coast",
	"gympie",
	"ipswich",
	"toowoomba",
	"osborne-park",
	"swan-valley",
	"adelaide",
	"barossa",
	"gawler",
	"parafield",
] as const;

export const stateEnum = pgEnum("state_enum", STATE_VALUES);
export const slEnum = pgEnum("sl_enum", SL_VALUES);
export const officeEnum = pgEnum("office_enum", OFFICE_VALUES);
