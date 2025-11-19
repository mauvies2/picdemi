/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 * 
 * Handles Stripe webhook events:
 * - checkout.session.completed: Create order and order_items
 * - payment_intent.succeeded: Update order status
 * - payment_intent.payment_failed: Update order status
 */

import { NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/config";
import { createClient } from "@/database/server";
import {
  createOrder,
  addOrderItems,
  updateOrderStatus,
  getOrderByCheckoutSessionId,
  getOrderByPaymentIntentId,
} from "@/database/queries/orders";
import { getCartItemsWithDetails } from "@/database/queries/carts";
import { clearCart } from "@/database/queries/carts";
import Stripe from "stripe";

export async function POST(request: Request) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Check if order already exists
        const existingOrder = await getOrderByCheckoutSessionId(
          supabase,
          session.id,
        );

        if (existingOrder) {
          console.log(`Order already exists for session ${session.id}`);
          break;
        }

        // Get user_id from metadata
        const userId = session.metadata?.user_id;
        const cartId = session.client_reference_id ?? session.metadata?.cart_id;

        if (!userId) {
          console.error("Missing user_id in session metadata");
          break;
        }

        // Get cart items
        if (!cartId) {
          console.error("Missing cart_id in session");
          break;
        }

        const cartItems = await getCartItemsWithDetails(
          supabase,
          cartId,
          userId,
        );

        if (cartItems.length === 0) {
          console.error("Cart is empty");
          break;
        }

        // Calculate total
        const totalAmountCents = cartItems.reduce(
          (sum, item) => sum + item.unit_price_cents,
          0,
        );

        // Create order
        const order = await createOrder(supabase, userId, {
          cart_id: cartId,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
          stripe_customer_id:
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id ?? null,
          status: "completed",
          total_amount_cents: totalAmountCents,
          metadata: {
            stripe_session_id: session.id,
            amount_total: session.amount_total,
            currency: session.currency,
          },
        });

        // Add order items
        await addOrderItems(
          supabase,
          order.id,
          cartItems.map((item) => ({
            photo_id: item.photo_id,
            photographer_id: item.photographer_id,
            unit_price_cents: item.unit_price_cents,
            quantity: 1,
          })),
        );

        // Clear cart after successful order
        await clearCart(supabase, cartId);

        console.log(`Order created: ${order.id} for user ${userId}`);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const order = await getOrderByPaymentIntentId(
          supabase,
          paymentIntent.id,
        );

        if (order && order.status !== "completed") {
          await updateOrderStatus(supabase, order.id, "completed", {
            payment_intent_succeeded_at: new Date().toISOString(),
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const order = await getOrderByPaymentIntentId(
          supabase,
          paymentIntent.id,
        );

        if (order && order.status === "pending") {
          await updateOrderStatus(supabase, order.id, "failed", {
            payment_intent_failed_at: new Date().toISOString(),
            failure_reason: paymentIntent.last_payment_error?.message,
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

