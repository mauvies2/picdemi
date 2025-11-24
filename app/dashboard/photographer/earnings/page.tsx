import { DashboardHeader } from "@/components/dashboard-header";
import { EarningsContent } from "./earnings-content";

export default async function EarningsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6 px-3 sm:px-4 py-3 sm:py-4">
      <div>
        <DashboardHeader title="Earnings & Payouts" />
        <p className="text-sm text-muted-foreground">
          Track your earnings and request payouts
        </p>
      </div>
      <EarningsContent />
    </div>
  );
}
