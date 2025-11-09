import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/database/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const role = body?.role as string | undefined;

  if (role !== "photographer" && role !== "model") {
    return NextResponse.json({ ok: false, error: "invalid_role" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Ensure the selected role exists for the user; allow multiple roles.
  await supabase
    .from("user_roles")
    .upsert({ user_id: user.id, role }, { onConflict: "user_id,role" });

  // Persist active role preference in a cookie for quick server reads.
  const response = NextResponse.json({ ok: true });
  const cookieStore = await cookies();
  cookieStore.set("active_role", role, { path: "/", httpOnly: false });
  return response;
}


