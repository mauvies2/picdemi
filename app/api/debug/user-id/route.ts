import { NextResponse } from "next/server";
import { createClient } from "@/database/server";

/**
 * Debug endpoint to get the current user's ID
 * GET /api/debug/user-id
 * 
 * This is useful for testing Stripe webhooks locally
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Not authenticated. Please log in first." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    user_id: user.id,
    email: user.email,
    message: `Use this user_id to create a test Stripe customer:
    
stripe customers create \\
  --email "${user.email}" \\
  --metadata supabase_user_id="${user.id}"
    
Then you can trigger subscription events:
stripe trigger customer.subscription.created`,
  });
}

