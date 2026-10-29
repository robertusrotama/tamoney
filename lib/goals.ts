import type { Goal } from "./types";

// Savings goals (spec §6). Progress = tagged transfers, never the wallet's balance.

export type GoalStatus = "tercapai" | "tertinggal" | "sesuai";
export type GoalWithProgress = Goal & { saved: number; need: number; depositedThisPeriod: number; status: GoalStatus };
