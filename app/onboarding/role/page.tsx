import { redirect } from "next/navigation";
import { completeOnboarding, getDashboardPath } from "@/app/actions/roles";
import OnboardingRoleForm from "@/components/onboarding-role-form";
import { createClient } from "@/database/server";
import { type RoleSlug, roleSlugToEnum } from "@/lib/roles";

export default async function OnboardingRolePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { getProfileActiveRole, getUserRole } = await import(
    "@/database/queries"
  );

  const activeRole = await getProfileActiveRole(supabase, user.id);
  if (activeRole) {
    const dashboardPath = await getDashboardPath();
    return redirect(dashboardPath);
  }

  const existingRole = await getUserRole(supabase, user.id);

  if (existingRole) {
    const dashboardPath = await getDashboardPath();
    return redirect(dashboardPath);
  }

  const saveRole = async (formData: FormData) => {
    "use server";

    const role = (
      formData.get("role") as string | null
    )?.toLowerCase() as RoleSlug | null;
    if (role !== "photographer" && role !== "talent") {
      return redirect("/onboarding/role?message=invalid_role");
    }

    await completeOnboarding(roleSlugToEnum(role));
  };

  return (
    <div className="mx-auto max-w-3xl py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">What best describes you?</h1>
        <p className="mt-2 text-muted-foreground">
          Select your role to get started. Whether you capture moments or bring
          them to life.
        </p>
      </div>
      <OnboardingRoleForm saveRole={saveRole} />
    </div>
  );
}
