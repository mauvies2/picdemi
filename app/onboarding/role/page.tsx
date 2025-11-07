import { redirect } from "next/navigation";
import OnboardingRoleForm from "@/components/onboarding-role-form";
import { createClient } from "@/database/server";

export default async function OnboardingRolePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // If role already exists, skip onboarding
  const { data: existingRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingRole?.role) {
    return redirect("/dashboard");
  }

  const saveRole = async (formData: FormData) => {
    "use server";

    const role = (formData.get("role") as string | null)?.toLowerCase();
    if (role !== "photographer" && role !== "model") {
      return redirect("/onboarding/role?message=invalid_role");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/login");
    }

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role });

    if (error) {
      // If role already exists or any other error, just proceed to target dashboard
      // to avoid blocking the user due to a race condition.
      // You may log this error in a real app.
    }

    return redirect("/dashboard");
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
