import { CreditCard, Database, Sparkles } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatPlanPrice, PLANS, type PlanId } from "@/lib/plans";
import { getDashboardData } from "../actions";

function formatStorage(gb: number): string {
  if (gb < 1) {
    return `${(gb * 1024).toFixed(0)} MB`;
  }
  return `${gb.toFixed(2)} GB`;
}

export default async function PhotographerSettingsPage() {
  const dashboardData = await getDashboardData();
  const { storage } = dashboardData;

  // For now, assume free plan - can be fetched from user subscription later
  const currentPlanId = "free" as PlanId;
  const currentPlan = PLANS.find((p) => p.id === currentPlanId) || PLANS[0];

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6 px-3 sm:px-4 py-3 sm:py-4">
      <DashboardHeader title="Settings" />

      <div className="flex flex-1 flex-col gap-6">
        {/* Billing & Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Billing & Plan</CardTitle>
            </div>
            <CardDescription>
              Manage your subscription and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Current Plan</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlan.name} Plan
                  {currentPlan.price !== null &&
                    ` • ${formatPlanPrice(currentPlan)}`}
                </p>
              </div>
              {currentPlanId !== "pro" && (
                <Link href="/signup?plan=pro">
                  <Button size="sm">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>

            {/* Storage Usage */}
            {currentPlan.storageGB !== null && (
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Storage Usage</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatStorage(storage.usedGB)} /{" "}
                    {formatStorage(currentPlan.storageGB)}
                  </p>
                </div>
                <Progress
                  value={Math.min(
                    (storage.usedGB / currentPlan.storageGB) * 100,
                    100,
                  )}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {storage.totalPhotos} photos uploaded
                </p>
                {storage.usedGB >= currentPlan.storageGB && (
                  <p className="mt-2 text-xs font-medium text-destructive">
                    Storage limit reached — upgrade to add more photos
                  </p>
                )}
              </div>
            )}

            {/* Current Plan Features */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Plan Features</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {currentPlan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Available Plans */}
            <div className="space-y-4">
              <p className="text-sm font-medium">Available Plans</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {PLANS.filter((plan) => plan.id !== currentPlanId).map(
                  (plan) => (
                    <div
                      key={plan.id}
                      className="rounded-lg border p-4 transition-all hover:border-primary/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{plan.name}</h4>
                            {plan.popular && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {plan.description}
                          </p>
                          <p className="mt-2 text-lg font-bold">
                            {formatPlanPrice(plan)}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/signup?plan=${plan.id}`}
                        className="mt-4 block"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          {currentPlanId === "free" ? "Upgrade" : "Switch Plan"}
                        </Button>
                      </Link>
                    </div>
                  ),
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Need help? Contact support for billing questions.
            </p>
            <Button variant="outline" size="sm">
              View Billing History
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
