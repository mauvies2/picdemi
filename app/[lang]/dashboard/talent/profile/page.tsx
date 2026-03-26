import { DashboardHeader } from '@/components/dashboard-header';
import { getProfileData } from './actions';
import { ProfileContent } from './profile-content';

interface TalentProfilePageProps {
  searchParams: Promise<{ purchased?: string }>;
}

export default async function TalentProfilePage({ searchParams }: TalentProfilePageProps) {
  const data = await getProfileData();
  const params = await searchParams;
  const showSuccessMessage = params.purchased === 'true';

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <DashboardHeader title="Profile" />
      <ProfileContent initialData={data} showSuccessMessage={showSuccessMessage} />
    </div>
  );
}
