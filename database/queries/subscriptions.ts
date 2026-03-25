/**
 * Subscription-related database queries
 * For managing Stripe subscriptions
 */

import type { SupabaseServerClient } from './types';
import { getErrorMessage } from './types';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan_id: 'free' | 'starter' | 'pro';
  status:
    | 'incomplete'
    | 'incomplete_expired'
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'unpaid'
    | 'paused';
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get subscription for a user
 */
export async function getSubscription(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get subscription: ${getErrorMessage(error)}`);
  }

  return data as Subscription | null;
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeId(
  supabase: SupabaseServerClient,
  stripeSubscriptionId: string,
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get subscription by Stripe ID: ${getErrorMessage(error)}`);
  }

  return data as Subscription | null;
}
