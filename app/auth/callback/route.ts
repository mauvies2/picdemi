import { NextResponse } from "next/server";
import { getDashboardPath } from "@/app/actions/roles";
import { createClient } from "@/database/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("active_role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.active_role) {
      const dashboardPath = await getDashboardPath();
      return NextResponse.redirect(`${origin}${dashboardPath}`);
    }

    const { data: roles } = await supabase
      .from("user_role_memberships")
      .select("role")
      .eq("user_id", user.id);

    if (roles && roles.length > 0) {
      const dashboardPath = await getDashboardPath();
      return NextResponse.redirect(`${origin}${dashboardPath}`);
    }

    return NextResponse.redirect(`${origin}/onboarding/role`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
