export const USER_ROLES = ["PHOTOGRAPHER", "TALENT"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type RoleSlug = "photographer" | "talent";

export const roleSlugToEnum = (slug: RoleSlug): UserRole =>
  slug === "photographer" ? "PHOTOGRAPHER" : "TALENT";

export const roleEnumToSlug = (role: UserRole): RoleSlug =>
  role === "PHOTOGRAPHER" ? "photographer" : "talent";

export function resolveRoleSwitch(
  existing: UserRole[],
  target: UserRole,
): {
  needsEnableTalent: boolean;
} {
  const normalized = new Set(existing);
  if (target === "TALENT" && !normalized.has("TALENT")) {
    return { needsEnableTalent: true };
  }
  return { needsEnableTalent: false };
}
