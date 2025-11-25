import { DashboardHeader } from "@/components/dashboard-header";
import { SalesContent } from "./sales-content";

export default async function SalesPage() {
  return (
    <div>
      <DashboardHeader title="Sales" />
      <p className="text-sm text-muted-foreground">
        Track your sales performance and revenue
      </p>
      <div className="mt-6">
        <SalesContent />
      </div>
    </div>
  );
}
