import { redirect } from 'next/navigation';
import { getActiveRole } from '@/app/actions/roles';
import { DashboardHeader } from '@/components/dashboard-header';
import { createClient } from '@/database/server';
import { listMyTaggedPhotos } from './actions';
import { TalentPhotosGrid } from './talent-photos-grid';

export const dynamic = 'force-dynamic';

export default async function TalentPhotosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Ensure user is in talent role
  const { activeRole } = await getActiveRole();
  if (activeRole !== 'talent') {
    return redirect('/dashboard');
  }

  const result = await listMyTaggedPhotos({ limit: 50, offset: 0 });

  return (
    <div>
      <DashboardHeader title="Photos of you" />
      <p className="text-sm text-muted-foreground">Photos you have selected or tagged.</p>
      <TalentPhotosGrid
        initialGroups={result.groups}
        hasMore={result.hasMore}
        photosInCart={result.photosInCart}
      />
    </div>
  );
}
