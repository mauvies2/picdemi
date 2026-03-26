import { getActiveRole } from '@/app/[lang]/actions/roles';
import { localizedRedirect } from '@/lib/i18n/redirect';

// Force dynamic rendering to ensure we always read fresh role data
export const dynamic = 'force-dynamic';

export default async function Dashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { activeRole } = await getActiveRole();
  if (activeRole === 'talent') {
    localizedRedirect(lang, '/dashboard/talent');
  }
  localizedRedirect(lang, '/dashboard/photographer');
}
