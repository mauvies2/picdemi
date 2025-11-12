"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/database/server";
import {
  type RoleSlug,
  resolveRoleSwitch,
  roleEnumToSlug,
  roleSlugToEnum,
  type UserRole,
} from "@/lib/roles";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const userRoleSchema = z.enum(["PHOTOGRAPHER", "MODEL"]);
const roleSlugSchema = z.enum(["photographer", "model"]);

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

async function upsertProfileRole(
  supabase: SupabaseServerClient,
  userId: string,
  role: UserRole,
) {
  const { error } = await supabase.from("profiles").upsert(
    { id: userId, active_role: role },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertUserRole(
  supabase: SupabaseServerClient,
  userId: string,
  role: UserRole,
) {
  const { error } = await supabase.from("user_role_memberships").upsert(
    { user_id: userId, role },
    {
      onConflict: "user_id,role",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function enableModelRoleInternal(
  supabase: SupabaseServerClient,
  userId: string,
) {
  await upsertUserRole(supabase, userId, "MODEL");
  await upsertProfileRole(supabase, userId, "MODEL");
}

export async function completeOnboarding(initialRole: UserRole) {
  const role = userRoleSchema.parse(initialRole);
  const { supabase, user } = await getAuthenticatedClient();

  await upsertProfileRole(supabase, user.id, role);
  await upsertUserRole(supabase, user.id, role);

  revalidatePath("/dashboard");
  // Redirect to the role-specific dashboard
  const dashboardPath =
    role === "MODEL" ? "/dashboard/model" : "/dashboard/photographer";
  redirect(dashboardPath);
}

export async function enableModelRole(): Promise<SwitchRoleResult> {
  const { supabase, user } = await getAuthenticatedClient();
  await enableModelRoleInternal(supabase, user.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/model");

  return { activeRole: roleEnumToSlug("MODEL") };
}

export async function switchRole(
  input: RoleSlug,
  options?: { skipRevalidation?: boolean },
): Promise<SwitchRoleResult> {
  const slug = roleSlugSchema.parse(input);
  const targetRole = roleSlugToEnum(slug);
  const { supabase, user } = await getAuthenticatedClient();

  const { data: rolesData, error: rolesError } = await supabase
    .from("user_role_memberships")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    throw new Error(rolesError.message);
  }

  const existingRoles = rolesData?.map((r) => r.role as UserRole) ?? [];
  const { needsEnableModel } = resolveRoleSwitch(existingRoles, targetRole);

  if (needsEnableModel) {
    await enableModelRoleInternal(supabase, user.id);
  } else {
    const hasRole = existingRoles.includes(targetRole);
    if (!hasRole) {
      throw new Error("Role is not enabled for this user.");
    }
    await upsertProfileRole(supabase, user.id, targetRole);
  }

  // Only revalidate if not called during render (e.g., from user action)
  if (!options?.skipRevalidation) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/model");
    revalidatePath("/dashboard/photographer");
  }

  return { activeRole: slug };
}

export async function getActiveRole(): Promise<{
  activeRole: RoleSlug;
}> {
  const { supabase, user } = await getAuthenticatedClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  // If profile exists, it should always have an active_role (NOT NULL with default)
  // Use it directly if present
  if (profile?.active_role) {
    return { activeRole: roleEnumToSlug(profile.active_role as UserRole) };
  }

  // Profile doesn't exist - check user roles to determine what to set
  const { data: rolesData, error: rolesError } = await supabase
    .from("user_role_memberships")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    throw new Error(rolesError.message);
  }

  // Prefer PHOTOGRAPHER as fallback (default role), then MODEL, then first available
  const fallback =
    rolesData?.find((record) => record.role === "PHOTOGRAPHER")?.role ??
    rolesData?.find((record) => record.role === "MODEL")?.role ??
    rolesData?.[0]?.role ??
    "PHOTOGRAPHER";

  // Create/update profile with the fallback role
  await upsertProfileRole(supabase, user.id, fallback as UserRole);

  return { activeRole: roleEnumToSlug(fallback as UserRole) };
}

/**
 * Gets the dashboard path for the user's active role
 * @returns The dashboard path (e.g., "/dashboard/model" or "/dashboard/photographer")
 */
export async function getDashboardPath(): Promise<string> {
  const { activeRole } = await getActiveRole();
  return activeRole === "model"
    ? "/dashboard/model"
    : "/dashboard/photographer";
}
