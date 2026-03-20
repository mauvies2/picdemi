'use server';

import { getSubscription } from '@/database/queries/subscriptions';
import { createClient } from '@/database/server';
import { env } from '@/env.mjs';
import { stripe } from '@/lib/stripe/config';

const PLAN_TO_PRICE: Record<string, string> = {
  amateur: env.STRIPE_PRICE_AMATEUR,
  pro: env.STRIPE_PRICE_PRO,
};

/**
 * Create checkout session for subscription upgrade/change
 */
export async function createBillingCheckoutAction(
  planId: 'amateur' | 'pro',
): Promise<{ url: string } | { updated: boolean }> {
  const supabase = await createClient();

  // Get current user from Supabase Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  if (!planId || !PLAN_TO_PRICE[planId]) {
    throw new Error('Invalid plan');
  }

  // Check if we already have a Stripe customer and active subscription
  const subscription = await getSubscription(supabase, user.id);

  let stripeCustomerId = subscription?.stripe_customer_id;

  // If user has an active subscription, update it instead of creating new checkout
  if (
    subscription?.stripe_subscription_id &&
    subscription.status &&
    ['active', 'trialing', 'past_due'].includes(subscription.status)
  ) {
    // User already has an active subscription - update it
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id,
      );

      // Update subscription to new plan
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        items: [
          {
            id: stripeSubscription.items.data[0]?.id,
            price: PLAN_TO_PRICE[planId],
          },
        ],
        proration_behavior: 'always_invoice',
        metadata: {
          supabase_user_id: user.id,
          plan_id: planId,
        },
      });

      // Subscription will be updated via customer.subscription.updated webhook
      return {
        updated: true,
      };
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  // No active subscription - create new checkout session
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    stripeCustomerId = customer.id;

    // Insert initial row (status will be updated via webhook)
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
      plan_id: planId,
      status: 'incomplete',
    });
  }

  const priceId = PLAN_TO_PRICE[planId];
  const baseUrl = env.SITE_URL;

  const sessionStripe = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard/photographer/settings?status=success`,
    cancel_url: `${baseUrl}/dashboard/photographer/settings?status=cancelled`,
    metadata: {
      supabase_user_id: user.id,
      plan_id: planId,
    },
  });

  return { url: sessionStripe.url ?? '' };
}

/**
 * Cancel subscription
 */
export async function cancelSubscriptionAction(): Promise<void> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Get user's subscription
  const subscription = await getSubscription(supabase, user.id);

  if (!subscription || !subscription.stripe_subscription_id) {
    throw new Error('No active subscription found');
  }

  // Check if subscription is already canceled
  if (subscription.status === 'canceled') {
    throw new Error('Subscription is already canceled');
  }

  try {
    // Cancel subscription at period end (so user keeps access until period ends)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}
