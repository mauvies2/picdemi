"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  upsertProfileRole as dbUpsertProfileRole,
  upsertUserRole as dbUpsertUserRole,
  getProfileActiveRole,
  getUserRoles,
} from "@/database/queries";
import { createClient } from "@/database/server";
import {
  type RoleSlug,
  resolveRoleSwitch,
  roleEnumToSlug,
  roleSlugToEnum,
  type UserRole,
} from "@/lib/roles";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const userRoleSchema = z.enum(["PHOTOGRAPHER", "TALENT"]);
const roleSlugSchema = z.enum(["photographer", "talent"]);

type SwitchRoleResult = {
  activeRole: RoleSlug;
};

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to manage roles.");
  }

  return { supabase, user };
}

async function enableTalentRoleInternal(
  supabase: SupabaseServerClient,
  userId: string,
) {
  await dbUpsertUserRole(supabase, userId, "TALENT");
  await dbUpsertProfileRole(supabase, userId, "TALENT");
}

export async function completeOnboarding(
  initialRole: UserRole,
  username?: string,
) {
  const role = userRoleSchema.parse(initialRole);
  const { supabase, user } = await getAuthenticatedClient();

  // If username is provided, update profile with username
  if (username) {
    const { updateProfile } = await import("@/database/queries");
    await updateProfile(supabase, user.id, { username });
  }

  await dbUpsertProfileRole(supabase, user.id, role);
  await dbUpsertUserRole(supabase, user.id, role);

  revalidatePath("/dashboard");
  // Redirect to the role-specific dashboard
  const dashboardPath =
    role === "TALENT" ? "/dashboard/talent" : "/dashboard/photographer";
  redirect(dashboardPath);
}

export async function enableTalentRole(): Promise<SwitchRoleResult> {
  const { supabase, user } = await getAuthenticatedClient();
  await enableTalentRoleInternal(supabase, user.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/talent");

  return { activeRole: roleEnumToSlug("TALENT") };
}

export async function switchRole(
  input: RoleSlug,
  options?: { skipRevalidation?: boolean },
): Promise<SwitchRoleResult> {
  const slug = roleSlugSchema.parse(input);
  const targetRole = roleSlugToEnum(slug);
  const { supabase, user } = await getAuthenticatedClient();

  const existingRoles = await getUserRoles(supabase, user.id);
  const { needsEnableTalent } = resolveRoleSwitch(existingRoles, targetRole);

  if (needsEnableTalent) {
    await enableTalentRoleInternal(supabase, user.id);
  } else {
    const hasRole = existingRoles.includes(targetRole);
    if (!hasRole) {
      throw new Error("Role is not enabled for this user.");
    }
    await dbUpsertProfileRole(supabase, user.id, targetRole);
  }

  // Only revalidate if not called during render (e.g., from user action)
  if (!options?.skipRevalidation) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/talent");
    revalidatePath("/dashboard/photographer");
  }

  return { activeRole: slug };
}

export async function getActiveRole(): Promise<{
  activeRole: RoleSlug;
}> {
  const { supabase, user } = await getAuthenticatedClient();

  // If profile exists, it should always have an active_role (NOT NULL with default)
  // Use it directly if present
  const activeRole = await getProfileActiveRole(supabase, user.id);
  if (activeRole) {
    return { activeRole: roleEnumToSlug(activeRole) };
  }

  // Profile doesn't exist - check user roles to determine what to set
  const rolesData = await getUserRoles(supabase, user.id);

  // Prefer PHOTOGRAPHER as fallback (default role), then TALENT, then first available
  const fallback =
    rolesData.find((role) => role === "PHOTOGRAPHER") ??
    rolesData.find((role) => role === "TALENT") ??
    rolesData[0] ??
    ("PHOTOGRAPHER" as UserRole);

  // Create/update profile with the fallback role
  await dbUpsertProfileRole(supabase, user.id, fallback);

  return { activeRole: roleEnumToSlug(fallback) };
}

/**
 * Gets the dashboard path for the user's active role
 * @returns The dashboard path (e.g., "/dashboard/talent" or "/dashboard/photographer")
 */
export async function getDashboardPath(): Promise<string> {
  const { activeRole } = await getActiveRole();
  return activeRole === "talent"
    ? "/dashboard/talent"
    : "/dashboard/photographer";
}
