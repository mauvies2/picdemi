import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/database/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (!roles || roles.length === 0) {
    return redirect("/onboarding/role");
  }

  const cookieStore = await cookies();
  const cookieRole = cookieStore.get("active_role")?.value as
    | "photographer"
    | "model"
    | undefined;
  const hasPhotographer = roles.some((r) => r.role === "photographer");
  const hasModel = roles.some((r) => r.role === "model");
  const activeRole: "photographer" | "model" =
    cookieRole &&
    ((cookieRole === "photographer" && hasPhotographer) ||
      (cookieRole === "model" && hasModel))
      ? cookieRole
      : hasPhotographer
        ? "photographer"
        : "model";

  return (
    <SidebarProvider>
      <AppSidebar activeRole={activeRole} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
