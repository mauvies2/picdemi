import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getActiveRole, switchRole } from "@/app/actions/roles";
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

  const { getProfileFields } = await import("@/database/queries");
  const profile = await getProfileFields(supabase, user.id, ["display_name", "active_role"]);

  // Get current pathname to sync role based on URL
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  
  // Get current active role
  let { activeRole } = await getActiveRole();
  
  // Sync role based on URL path before passing to sidebar
  if (pathname.startsWith("/dashboard/talent")) {
    if (activeRole !== "talent") {
      await switchRole("talent", { skipRevalidation: true });
      activeRole = "talent";
    }
  } else if (pathname.startsWith("/dashboard/photographer")) {
    if (activeRole !== "photographer") {
      await switchRole("photographer", { skipRevalidation: true });
      activeRole = "photographer";
    }
  }

  const sidebarUser = {
    name:
      profile?.display_name ??
      user.user_metadata?.full_name ??
      user.email ??
      "Member",
    email: user.email ?? "",
    avatar: user.user_metadata?.avatar_url ?? null,
  };

  return (
    <SidebarProvider>
      <AppSidebar activeRole={activeRole} user={sidebarUser} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
