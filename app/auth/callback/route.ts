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
