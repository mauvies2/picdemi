import { DashboardHeader } from "@/components/dashboard-header";
import { getProfile } from "@/database/queries/profiles";
import { createClient } from "@/database/server";
import { PayoutProfileForm } from "./payout-profile-form";

export default async function PayoutProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existingProfile = null;
  if (user) {
    existingProfile = await getProfile(supabase, user.id);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <div>
        <DashboardHeader title="Complete Payout Profile" />
        <p className="text-sm text-muted-foreground">
          Complete your payout profile to enable withdrawal requests. This
          information is required for tax compliance and payment processing.
        </p>
      </div>
      <PayoutProfileForm initialData={existingProfile} />
    </div>
  );
}
