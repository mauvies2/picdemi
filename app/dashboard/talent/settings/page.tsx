import { format } from 'date-fns';
import { Calendar, Mail, User } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';
import { ProfileForm } from '@/components/profile-form';
import { ROLES } from '@/lib/roles';
import { getProfileData } from './actions';
import { updateProfileAction } from './update-action';

export default async function TalentSettingsPage() {
  const data = await getProfileData();
  const { profile, email, createdAt } = data;

  if (!profile) {
    return (
      <div className="flex flex-1 flex-col gap-4 sm:gap-6">
        <DashboardHeader title="Settings" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <DashboardHeader title="Settings" />

      <div className="flex flex-1 flex-col gap-6">
        {/* Profile Form and Account Information - Side by Side */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Profile Form */}
          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Profile Details</h2>
            </div>
            <ProfileForm
              initialValues={{
                username: profile.username,
                display_name: profile.display_name,
                bio: profile.bio,
              }}
              onSubmit={updateProfileAction}
            />
          </div>

          {/* Account Information */}
          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-medium">
                    {format(new Date(createdAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-medium capitalize">
                    {profile.active_role === ROLES.TALENT ? 'Talent' : 'Photographer'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
