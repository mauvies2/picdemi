import { CreditCard, Database } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getSubscription } from '@/database/queries';
import { createClient } from '@/database/server';
import { type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { formatPlanPrice, PLANS, type PlanId } from '@/lib/plans';
import { getDashboardData } from '../actions';
import { UpgradeHandler } from './upgrade-handler';
import { UpgradePlanButton } from './upgrade-plan-button';

function formatStorage(gb: number): string {
  if (gb < 1) {
    return `${(gb * 1024).toFixed(0)} MB`;
  }
  return `${gb.toFixed(2)} GB`;
}

export default async function PhotographerSettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const dashboardData = await getDashboardData();
  const { storage } = dashboardData;

  // Fetch actual subscription from database
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlanId: PlanId = 'free';
  if (user) {
    const subscription = await getSubscription(supabase, user.id);
    // Only show subscription as current plan if it's active, trialing, or past_due
    // Don't show incomplete subscriptions as the current plan
    if (subscription?.status && ['active', 'trialing', 'past_due'].includes(subscription.status)) {
      currentPlanId = subscription.plan_id as PlanId;
    }
  }

  const currentPlan = PLANS.find((p) => p.id === currentPlanId) || PLANS[0];

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <UpgradeHandler />
      <DashboardHeader title={dict.photographerDashboard.settingsTitle} />

      <div className="flex flex-1 flex-col gap-6">
        {/* Billing & Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>{dict.photographerDashboard.billingPlan}</CardTitle>
            </div>
            <CardDescription>{dict.photographerDashboard.billingPlanDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{dict.photographerDashboard.currentPlan}</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlan.name} Plan
                  {currentPlan.price !== null && ` • ${formatPlanPrice(currentPlan)}`}
                </p>
              </div>
              {currentPlanId !== 'pro' && <UpgradePlanButton planId="pro" />}
            </div>

            {/* Storage Usage */}
            {currentPlan.storageGB !== null && (
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{dict.photographerDashboard.storageUsage}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatStorage(storage.usedGB)} / {formatStorage(currentPlan.storageGB)}
                  </p>
                </div>
                <Progress
                  value={Math.min((storage.usedGB / currentPlan.storageGB) * 100, 100)}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {storage.totalPhotos} {dict.photographerDashboard.photosUploaded}
                </p>
                {storage.usedGB >= currentPlan.storageGB && (
                  <p className="mt-2 text-xs font-medium text-destructive">
                    {dict.photographerDashboard.storageLimitReached}
                  </p>
                )}
              </div>
            )}

            {/* Current Plan Features */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{dict.photographerDashboard.planFeatures}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {currentPlan.features.map((feature, i) => {
                  const text = typeof feature === 'string' ? feature : feature.text;
                  return (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {text}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Available Plans */}
            <div className="space-y-4">
              <p className="text-sm font-medium">{dict.photographerDashboard.availablePlans}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {PLANS.filter((plan) => plan.id !== currentPlanId).map((plan) => (
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
                              {dict.photographerDashboard.popular}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                        <p className="mt-2 text-lg font-bold">{formatPlanPrice(plan)}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <UpgradePlanButton planId={plan.id as 'starter' | 'pro'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {dict.photographerDashboard.billingHelpText}
            </p>
            <Button variant="outline" size="sm">
              {dict.photographerDashboard.viewBillingHistory}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
