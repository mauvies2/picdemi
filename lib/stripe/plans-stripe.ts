import { env } from "@/env.mjs";
import type { PlanId } from "../plans";

export const STRIPE_PRICE_TO_PLAN: Record<string, PlanId> = {
  [env.STRIPE_PRICE_AMATEUR]: "amateur",
  [env.STRIPE_PRICE_PRO]: "pro",
};
