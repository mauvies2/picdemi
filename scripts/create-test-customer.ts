#!/usr/bin/env tsx
/**
 * Script to create a test Stripe customer with metadata
 *
 * Usage:
 *   tsx scripts/create-test-customer.ts <user_id> [email]
 *
 * Example:
 *   tsx scripts/create-test-customer.ts 07cf6833-ba80-4d56-8f90-96c9c4c2868e test@example.com
 */

import Stripe from 'stripe';
import { env } from '../env.mjs';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',
});

async function main() {
  const userId = process.argv[2];
  const email = process.argv[3] || `test-${Date.now()}@example.com`;

  if (!userId) {
    console.error('Error: User ID is required');
    console.error('Usage: tsx scripts/create-test-customer.ts <user_id> [email]');
    process.exit(1);
  }

  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        supabase_user_id: userId,
      },
    });

    console.log('\n✅ Test customer created successfully!');
    console.log(`Customer ID: ${customer.id}`);
    console.log(`Email: ${customer.email}`);
    console.log('Metadata:', customer.metadata);
    console.log('\nNow you can trigger subscription events:');
    console.log('  stripe trigger customer.subscription.created');
    console.log('\nOr create a subscription for this customer:');
    console.log(
      `  stripe subscriptions create --customer ${customer.id} --items[0][price]=YOUR_PRICE_ID`,
    );
  } catch (error) {
    console.error('Error creating customer:', error);
    process.exit(1);
  }
}

void main();
