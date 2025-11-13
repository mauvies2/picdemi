import { DashboardHeader } from "@/components/dashboard-header";

export default async function SalesPage() {
  return (
    <div className="p-4">
      <DashboardHeader title="Sales" />
      <p className="text-muted-foreground mt-2">Sales data coming soon.</p>
    </div>
  );
}
