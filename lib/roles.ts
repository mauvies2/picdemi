export const USER_ROLES = ["PHOTOGRAPHER", "MODEL"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type RoleSlug = "photographer" | "model";

export const roleSlugToEnum = (slug: RoleSlug): UserRole =>
  slug === "photographer" ? "PHOTOGRAPHER" : "MODEL";

export const roleEnumToSlug = (role: UserRole): RoleSlug =>
  role === "PHOTOGRAPHER" ? "photographer" : "model";

export function resolveRoleSwitch(
  existing: UserRole[],
  target: UserRole,
): {
  needsEnableModel: boolean;
} {
  const normalized = new Set(existing);
  if (target === "MODEL" && !normalized.has("MODEL")) {
    return { needsEnableModel: true };
  }
  return { needsEnableModel: false };
}
