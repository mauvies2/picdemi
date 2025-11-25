/**
 * AI Search Usage database queries
 * For tracking and rate limiting AI searches
 */

import type { SupabaseServerClient } from "./types";
import { getErrorMessage } from "./types";

/**
 * Get current month's search count for a user
 */
export async function getAISearchUsageCount(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<number> {
  // Use the database function we created
  const { data, error } = await supabase.rpc("get_ai_search_usage_count", {
    p_user_id: userId,
  });

  if (error) {
    // Fallback to manual query if function doesn't exist
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const { data: usageData, error: queryError } = await supabase
      .from("ai_search_usage")
      .select("search_count")
      .eq("user_id", userId)
      .eq("period_year", currentYear)
      .eq("period_month", currentMonth)
      .maybeSingle();

    if (queryError && queryError.code !== "PGRST116") {
      throw new Error(
        `Failed to get AI search usage: ${getErrorMessage(queryError)}`,
      );
    }

    return usageData?.search_count ?? 0;
  }

  return (data as number) ?? 0;
}

/**
 * Increment search count for current month
 */
export async function incrementAISearchUsage(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<number> {
  // Use the database function we created
  const { data, error } = await supabase.rpc("increment_ai_search_usage", {
    p_user_id: userId,
  });

  if (error) {
    // Fallback to manual query if function doesn't exist
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const { data: existingUsage, error: selectError } = await supabase
      .from("ai_search_usage")
      .select("id, search_count")
      .eq("user_id", userId)
      .eq("period_year", currentYear)
      .eq("period_month", currentMonth)
      .maybeSingle();

    if (selectError && selectError.code !== "PGRST116") {
      throw new Error(
        `Failed to get AI search usage: ${getErrorMessage(selectError)}`,
      );
    }

    if (existingUsage) {
      // Update existing record
      const { data: updatedUsage, error: updateError } = await supabase
        .from("ai_search_usage")
        .update({ search_count: existingUsage.search_count + 1 })
        .eq("id", existingUsage.id)
        .select("search_count")
        .single();

      if (updateError) {
        throw new Error(
          `Failed to increment AI search usage: ${getErrorMessage(updateError)}`,
        );
      }

      return updatedUsage.search_count;
    } else {
      // Create new record
      const { data: newUsage, error: insertError } = await supabase
        .from("ai_search_usage")
        .insert({
          user_id: userId,
          period_year: currentYear,
          period_month: currentMonth,
          search_count: 1,
        })
        .select("search_count")
        .single();

      if (insertError) {
        throw new Error(
          `Failed to create AI search usage: ${getErrorMessage(insertError)}`,
        );
      }

      return newUsage.search_count;
    }
  }

  return (data as number) ?? 0;
}
