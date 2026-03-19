import { ExplorePageContent } from "@/app/dashboard/talent/events/explore-page-content";
import { EventSearchBar } from "@/components/event-search-bar";
import { Footer } from "@/components/footer";
import {
  getEventFilterOptions,
  type SupabaseServerClient,
} from "@/database/queries";
import { supabaseAdmin } from "@/database/supabase-admin";

export default async function PublicEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ where?: string; activity?: string }>;
}) {
  const { where, activity } = await searchParams;
  const filterOptions = await getEventFilterOptions(
    supabaseAdmin as SupabaseServerClient,
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="mx-auto max-w-7xl w-full px-4 pt-6 pb-2">
        <div className="flex justify-center">
          <EventSearchBar
            key={`${where ?? ""}-${activity ?? ""}`}
            variant="hero"
            initialWhere={where ?? ""}
            initialActivity={activity ?? ""}
          />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl w-full flex-1 px-4 py-6">
        <ExplorePageContent
          key={`${where ?? ""}-${activity ?? ""}`}
          initialFilterOptions={filterOptions}
          eventLinkPrefix="/events"
          showInfoCards={true}
          loadOnMount={true}
          enableLocation={!where}
          initialWhere={where}
          initialActivity={activity}
          hideTopFilters={true}
          clearHref="/events"
        />
      </div>
      <Footer />
    </div>
  );
}
