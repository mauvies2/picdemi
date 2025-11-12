/**
 * Shared types and utilities for database queries
 */

export type SupabaseServerClient = Awaited<
  ReturnType<typeof import("../server").createClient>
>;

/**
 * Helper function to extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return String(error);
}
