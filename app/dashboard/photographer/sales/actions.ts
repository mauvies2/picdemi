"use server";

import {
  getRecentSales,
  getSalesOverTime,
  getSalesSummary,
  getTopSellingEvents,
} from "@/database/queries";
import { createClient } from "@/database/server";

export async function getSalesDataAction(startDate?: string, endDate?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const [summary, salesOverTime, topEvents, recentSales] = await Promise.all([
    getSalesSummary(supabase, user.id, startDate, endDate),
    getSalesOverTime(supabase, user.id, startDate, endDate, "day"),
    getTopSellingEvents(supabase, user.id, 10, startDate, endDate),
    getRecentSales(supabase, user.id, 20, startDate, endDate),
  ]);

  return {
    summary,
    salesOverTime,
    topEvents,
    recentSales,
  };
}
