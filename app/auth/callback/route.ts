import { NextResponse } from "next/server";
import { getDashboardPath } from "@/app/actions/roles";
import { createClient } from "@/database/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const plan = requestUrl.searchParams.get("plan");
  const downloadToken = requestUrl.searchParams.get("token");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login`);
    }

    // If user is logged in and has a plan parameter, redirect to billing checkout
    if (plan && (plan === "amateur" || plan === "pro")) {
      return NextResponse.redirect(
        `${origin}/dashboard/photographer/settings?upgrade=${plan}`,
      );
    }

    // Claim a guest download token if one was passed from signup flow
    if (downloadToken) {
      try {
        const { getDownloadTokenByToken, claimDownloadToken } = await import(
          "@/database/queries/download-tokens"
        );
        const { supabaseAdmin } = await import("@/database/supabase-admin");

        const tokenRow = await getDownloadTokenByToken(
          supabaseAdmin,
          downloadToken,
        );
        if (tokenRow && !tokenRow.claimed_by_user_id) {
          await claimDownloadToken(supabaseAdmin, tokenRow.id, user.id);
        }
        // Redirect to the download page so the user sees their photos
        return NextResponse.redirect(
          `${origin}/download/${downloadToken}?claimed=true`,
        );
      } catch (err) {
        console.error("Failed to claim download token:", err);
        // Fall through to normal redirect
      }
    }

    const { getProfileActiveRole, getUserRoles } = await import(
      "@/database/queries"
    );

    const activeRole = await getProfileActiveRole(supabase, user.id);
    if (activeRole) {
      const dashboardPath = await getDashboardPath();
      return NextResponse.redirect(`${origin}${dashboardPath}`);
    }

    const roles = await getUserRoles(supabase, user.id);

    if (roles.length > 0) {
      const dashboardPath = await getDashboardPath();
      return NextResponse.redirect(`${origin}${dashboardPath}`);
    }

    return NextResponse.redirect(`${origin}/onboarding/role`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
