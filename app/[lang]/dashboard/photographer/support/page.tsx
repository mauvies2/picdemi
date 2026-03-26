import { SupportPage } from '@/components/support-page';
import { getSubscription } from '@/database/queries';
import { createClient } from '@/database/server';
import { PLANS } from '@/lib/plans';

export default async function PhotographerSupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isPro = false;
  let planName = 'Free';

  if (user) {
    const subscription = await getSubscription(supabase, user.id);
    const isActive =
      subscription?.status && ['active', 'trialing', 'past_due'].includes(subscription.status);

    if (isActive && subscription?.plan_id) {
      const plan = PLANS.find((p) => p.id === subscription.plan_id);
      if (plan) {
        planName = plan.name;
        isPro = subscription.plan_id === 'pro';
      }
    }
  }

  return <SupportPage userRole="photographer" isPro={isPro} planName={planName} />;
}
