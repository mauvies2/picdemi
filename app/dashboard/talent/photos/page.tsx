import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { createClient } from "@/database/server";
import { getActiveRole } from "@/app/actions/roles";
import { listMyTaggedPhotos } from "./actions";
import { TalentPhotosGrid } from "./talent-photos-grid";

export const dynamic = "force-dynamic";

export default async function TalentPhotosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Ensure user is in talent role
  const { activeRole } = await getActiveRole();
  if (activeRole !== "talent") {
    return redirect("/dashboard");
  }

  const result = await listMyTaggedPhotos({ limit: 50, offset: 0 });

  return (
    <div className="p-4">
      <DashboardHeader title="Photos you're tagged in" />
      <p className="mt-2 text-sm text-muted-foreground">
        Photos where photographers have tagged you, organized by event and date.
      </p>
      <div className="mt-6">
        <TalentPhotosGrid
          initialGroups={result.groups}
          totalCount={result.totalCount}
          hasMore={result.hasMore}
        />
      </div>
    </div>
  );
}
