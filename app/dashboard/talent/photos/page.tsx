import { redirect } from "next/navigation";
import { getActiveRole } from "@/app/actions/roles";
import { DashboardHeader } from "@/components/dashboard-header";
import { createClient } from "@/database/server";
import { listMyTaggedPhotos } from "./actions";
import { AIMatchingButton } from "./ai-matching/ai-matching-button";
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
    <div>
      <DashboardHeader title="Photos of you" />
      <div className="flex items-center justify-between gap-4 mb-2">
        <p className="text-sm text-muted-foreground">
          Photos of you or where photographers have tagged you.
        </p>
        <AIMatchingButton />
      </div>
      <div className="mt-6">
        <TalentPhotosGrid
          initialGroups={result.groups}
          hasMore={result.hasMore}
          photosInCart={result.photosInCart}
        />
      </div>
    </div>
  );
}
