import { format } from "date-fns";
import {
  Calendar,
  Camera,
  DollarSign,
  Mail,
  User,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import { ProfileForm } from "@/components/profile-form";
import { updateProfileAction } from "./update-action";
import { getProfileData } from "./actions";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default async function PhotographerProfilePage() {
  const data = await getProfileData();
  const { profile, email, createdAt, stats } = data;

  if (!profile) {
    return (
      <div className="flex flex-1 flex-col gap-4 sm:gap-6 px-3 sm:px-4 py-3 sm:py-4">
        <DashboardHeader title="Profile" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6 px-3 sm:px-4 py-3 sm:py-4">
      <DashboardHeader title="Profile" />

      <div className="flex flex-1 flex-col gap-6">
        {/* Profile Form and Account Information - Side by Side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Form */}
          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Profile Details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Update your profile information. Your username is how others will
                identify you.
              </p>
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
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              Account Information
            </h2>
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
                    {format(new Date(createdAt), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-medium capitalize">
                    {profile.active_role === "MODEL" ? "Talent" : "Photographer"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Statistics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 sm:p-3">
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Total Events</p>
                <p className="text-lg sm:text-xl font-bold">
                  {stats.totalEvents}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 sm:p-3">
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Total Photos</p>
                <p className="text-lg sm:text-xl font-bold">
                  {stats.totalPhotos}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 sm:p-3">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="text-lg sm:text-xl font-bold">
                  {stats.totalSales}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 sm:p-3">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-lg sm:text-xl font-bold">
                  {formatCurrency(stats.totalRevenueCents)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

