import { format } from 'date-fns';
import { Calendar, Mail, User } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';
import { ProfileForm } from '@/components/profile-form';
import type { Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { TranslationsProvider } from '@/lib/i18n/translations-provider';
import { ROLES } from '@/lib/roles';
import { getProfileData } from './actions';
import { updateProfileAction } from './update-action';

export default async function TalentSettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const data = await getProfileData();
  const { profile, email, createdAt } = data;

  if (!profile) {
    return (
      <div className="flex flex-1 flex-col gap-4 sm:gap-6">
        <DashboardHeader title={dict.talentDashboard.settings} />
        <div className="text-center py-12">
          <p className="text-muted-foreground">{dict.talentDashboard.profileNotFound}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <DashboardHeader title={dict.talentDashboard.settings} />

      <div className="flex flex-1 flex-col gap-6">
        {/* Profile Form and Account Information - Side by Side */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Profile Form */}
          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">
                {dict.talentDashboard.profileDetails}
              </h2>
            </div>
            <TranslationsProvider translations={dict.profileForm}>
              <ProfileForm
                initialValues={{
                  username: profile.username,
                  display_name: profile.display_name,
                  bio: profile.bio,
                }}
                onSubmit={updateProfileAction}
              />
            </TranslationsProvider>
          </div>

          {/* Account Information */}
          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              {dict.talentDashboard.accountInformation}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{dict.talentDashboard.email}</p>
                  <p className="text-sm font-medium truncate">{email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {dict.talentDashboard.memberSince}
                  </p>
                  <p className="text-sm font-medium">
                    {format(new Date(createdAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{dict.talentDashboard.role}</p>
                  <p className="text-sm font-medium capitalize">
                    {profile.active_role === ROLES.TALENT
                      ? dict.talentDashboard.talentRole
                      : dict.talentDashboard.photographerRole}
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
