/**
 * Profile-related database queries
 */

import type { UserRole } from "@/lib/roles";
import type { SupabaseServerClient } from "./types";
import { getErrorMessage } from "./types";

export interface Profile {
  id: string;
  display_name?: string | null;
  bio?: string | null;
  active_role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileSelect {
  display_name?: string | null;
  active_role?: UserRole | null;
  bio?: string | null;
}

/**
 * Get a user's profile by ID
 */
export async function getProfile(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get profile: ${getErrorMessage(error)}`);
  }

  return data as Profile | null;
}

/**
 * Get specific fields from a user's profile
 */
export async function getProfileFields<T extends keyof ProfileSelect>(
  supabase: SupabaseServerClient,
  userId: string,
  fields: T[],
): Promise<Pick<ProfileSelect, T> | null> {
  const selectFields = fields.join(", ");
  const { data, error } = await supabase
    .from("profiles")
    .select(selectFields)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get profile fields: ${getErrorMessage(error)}`);
  }

  return data as Pick<ProfileSelect, T> | null;
}

/**
 * Get a user's active role from their profile
 */
export async function getProfileActiveRole(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get active role: ${getErrorMessage(error)}`);
  }

  return (data?.active_role as UserRole) ?? null;
}

/**
 * Update or insert a profile's active role
 */
export async function upsertProfileRole(
  supabase: SupabaseServerClient,
  userId: string,
  role: UserRole,
): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(
    { id: userId, active_role: role },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    throw new Error(`Failed to upsert profile role: ${getErrorMessage(error)}`);
  }
}

/**
 * Update profile fields
 */
export async function updateProfile(
  supabase: SupabaseServerClient,
  userId: string,
  updates: Partial<Pick<Profile, "display_name" | "bio">>,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update profile: ${getErrorMessage(error)}`);
  }
}

/**
 * Upsert profile (update or insert)
 */
export async function upsertProfile(
  supabase: SupabaseServerClient,
  userId: string,
  profile: Partial<Profile>,
): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(
    { id: userId, ...profile },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    throw new Error(`Failed to upsert profile: ${getErrorMessage(error)}`);
  }
}
