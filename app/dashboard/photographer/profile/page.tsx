import { format } from "date-fns";
import { Calendar, Mail, User as UserIcon } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import { ProfileForm } from "@/components/profile-form";
import { ROLES } from "@/lib/roles";
import { getProfileData } from "./actions";
import { PayoutProfileSection } from "./payout-profile-section";
import { updateProfileAction } from "./update-action";

export default async function PhotographerProfilePage() {
  const data = await getProfileData();
  const { profile, email, createdAt } = data;

  if (!profile) {
    return (
      <div className="flex flex-1 flex-col px-3 py-4 sm:px-4 sm:py-6">
        <DashboardHeader title="Profile" />
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">Profile not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full flex-col gap-6">
        <div>
          <DashboardHeader title="Profile" />
          <p className="text-sm text-muted-foreground">
            Manage your profile information, account details, and payout
            settings.
          </p>
        </div>

        {/* Main content grid */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-stretch">
          {/* Left: Profile form */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6 lg:h-full lg:flex lg:flex-col">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg font-semibold sm:text-xl">User Details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Control how your photographer profile appears across Shootea:
                your username, public name, and short bio.
              </p>
            </div>

            <div className="flex-1">
              <ProfileForm
                initialValues={{
                  username: profile.username,
                  display_name: profile.display_name,
                  bio: profile.bio,
                }}
                onSubmit={updateProfileAction}
              />
            </div>
          </div>

          {/* Right: account + payout profile */}
          <div className="flex flex-col gap-4 sm:gap-6 lg:h-full">
            {/* Account info card */}
            <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6 lg:flex-1 lg:flex lg:flex-col">
              <h2 className="mb-3 text-lg font-semibold sm:text-xl">
                Account information
              </h2>
              <div className="space-y-4 text-sm lg:flex-1">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="truncate font-medium">{email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      Member since
                    </p>
                    <p className="font-medium">
                      {format(new Date(createdAt), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">
                      {profile.active_role === ROLES.TALENT
                        ? "Talent"
                        : "Photographer"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payout profile card */}
            <div className="lg:flex-1 lg:flex lg:flex-col">
              <PayoutProfileSection profile={profile} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
