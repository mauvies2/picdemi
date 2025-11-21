#!/usr/bin/env node
/**
 * Script to create a test Stripe customer with metadata
 * 
 * Usage:
 *   node scripts/create-test-customer.js <user_id> [email]
 * 
 * Example:
 *   node scripts/create-test-customer.js 07cf6833-ba80-4d56-8f90-96c9c4c2868e test@example.com
 */

const Stripe = require("stripe");
require("dotenv").config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
  const userId = process.argv[2];
  const email = process.argv[3] || `test-${Date.now()}@example.com`;

  if (!userId) {
    console.error("Error: User ID is required");
    console.error("Usage: node scripts/create-test-customer.js <user_id> [email]");
    process.exit(1);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Error: STRIPE_SECRET_KEY not found in .env.local");
    process.exit(1);
  }

  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        supabase_user_id: userId,
      },
    });

    console.log("\n✅ Test customer created successfully!");
    console.log(`Customer ID: ${customer.id}`);
    console.log(`Email: ${customer.email}`);
    console.log(`Metadata:`, customer.metadata);
    console.log(`\nNow you can trigger subscription events:`);
    console.log(`  stripe trigger customer.subscription.created`);
    console.log(`\nOr create a subscription for this customer:`);
    console.log(`  stripe subscriptions create --customer ${customer.id} --items[0][price]=YOUR_PRICE_ID`);
  } catch (error) {
    console.error("Error creating customer:", error.message);
    process.exit(1);
  }
}

main();

