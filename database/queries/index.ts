/**
 * Database Query Functions
 *
 * Central export point for all database queries organized by domain.
 * This makes it easier to maintain, test, and potentially replace the database in the future.
 */

// Re-export event queries
export * from "./events";
// Re-export photo queries
export * from "./photos";

// Re-export profile queries
export * from "./profiles";
// Re-export storage queries
export * from "./storage";
// Re-export types
export type { SupabaseServerClient } from "./types";
export { getErrorMessage } from "./types";
// Re-export user role queries
export * from "./user-roles";
