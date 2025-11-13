import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getFilterOptionsAction } from "./actions";
import { ExplorePageContent } from "./explore-page-content";

export default async function TalentExplorePage() {
  const filterOptions = await getFilterOptionsAction();

  return (
    <div className="space-y-4">
      <div>
        <DashboardHeader title="Explore Events" />
        <p className="mt-1 text-sm text-muted-foreground">
          Discover public events and find photos from your favorite activities
          and locations.
        </p>
      </div>

      <Suspense fallback={<ExplorePageSkeleton />}>
        <ExplorePageContent initialFilterOptions={filterOptions} />
      </Suspense>
    </div>
  );
}

function ExplorePageSkeleton() {
  const skeletonKeys = [
    "skeleton-1",
    "skeleton-2",
    "skeleton-3",
    "skeleton-4",
    "skeleton-5",
    "skeleton-6",
    "skeleton-7",
    "skeleton-8",
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {skeletonKeys.map((key) => (
          <Skeleton key={key} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
