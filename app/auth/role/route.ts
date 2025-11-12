import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { switchRole } from "@/app/actions/roles";
import type { RoleSlug } from "@/lib/roles";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const role = body?.role as string | undefined;

  if (role !== "photographer" && role !== "model") {
    return NextResponse.json(
      { ok: false, error: "invalid_role" },
      { status: 400 },
    );
  }

  await switchRole(role as RoleSlug);

  const response = NextResponse.json({ ok: true, activeRole: role });
  const cookieStore = await cookies();
  cookieStore.set("active_role", role, { path: "/", httpOnly: false });
  return response;
}
