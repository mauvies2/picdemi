import { getActiveRole, switchRole } from '@/app/actions/roles';
import { AppSidebar } from '@/components/app-sidebar';
import { DashboardTopHeader } from '@/components/dashboard-top-header';
import { MobileHeader } from '@/components/mobile-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getProfileFields } from '@/database/queries';
import { createClient } from '@/database/server';

export default async function PhotographerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, { activeRole: currentRole }] = await Promise.all([
    getProfileFields(supabase, user?.id ?? '', ['display_name', 'active_role']),
    getActiveRole(),
  ]);

  let activeRole = currentRole;
  if (activeRole !== 'photographer') {
    await switchRole('photographer', { skipRevalidation: true });
    activeRole = 'photographer';
  }

  const sidebarUser = {
    name: profile?.display_name ?? user?.user_metadata?.full_name ?? user?.email ?? 'Member',
    email: user?.email ?? '',
    avatar: user?.user_metadata?.avatar_url ?? null,
  };

  return (
    <SidebarProvider>
      <AppSidebar activeRole={activeRole} user={sidebarUser} />
      <SidebarInset>
        <MobileHeader />
        <DashboardTopHeader user={sidebarUser} activeRole={activeRole} />
        <div className="flex flex-1 flex-col gap-6 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
