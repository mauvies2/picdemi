import { createClient } from '@/database/server';
import { localizedRedirect } from '@/lib/i18n/redirect';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return localizedRedirect(lang, '/login');
  }

  return <>{children}</>;
}
