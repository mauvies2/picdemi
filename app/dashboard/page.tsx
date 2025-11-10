import { DashboardHeader } from "@/components/dashboard-header";

export default async function Dashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-3">
      <DashboardHeader title="Overview" />
      <div className="flex flex-1 flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Sales (30d)</div>
            <div className="mt-2 text-3xl font-semibold">$4,320</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Bookings</div>
            <div className="mt-2 text-3xl font-semibold">12</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-muted-foreground">Top Photo</div>
            <div className="mt-2 text-3xl font-semibold">"Sunset Wave"</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-6 md:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Performance</h2>
              <span className="text-sm text-muted-foreground">
                Last 30 days
              </span>
            </div>
            <div className="mt-6 h-40 rounded-lg bg-muted/40" />
          </div>
          <div className="rounded-xl border p-6">
            <h2 className="text-xl font-semibold">Quick actions</h2>
            <div className="mt-4 grid gap-2">
              <a
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
                href="/dashboard/events/new"
              >
                Create New Event
              </a>
              <a
                className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm"
                href="/dashboard/events"
              >
                View Events
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
