import { getActiveRole, switchRole } from '@/app/[lang]/actions/roles';
import { TalentDashboardHeader } from '@/components/talent-dashboard-header';
import { getProfileFields } from '@/database/queries';
import { createClient } from '@/database/server';

export default async function TalentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, { activeRole: currentRole }] = await Promise.all([
    getProfileFields(supabase, user?.id ?? '', ['display_name', 'active_role']),
    getActiveRole(),
  ]);

  let activeRole = currentRole;
  if (activeRole !== 'talent') {
    await switchRole('talent', { skipRevalidation: true });
    activeRole = 'talent';
  }

  const sidebarUser = {
    name: profile?.display_name ?? user?.user_metadata?.full_name ?? user?.email ?? 'Member',
    email: user?.email ?? '',
    avatar: user?.user_metadata?.avatar_url ?? null,
  };

  return (
    <div className="flex min-h-svh flex-col">
      <TalentDashboardHeader user={sidebarUser} activeRole={activeRole} />
      <div className="mx-auto w-full max-w-screen-2xl flex flex-1 flex-col gap-6 px-4 py-6 pb-20 md:pb-6 md:px-6">
        {children}
      </div>
    </div>
  );
}
