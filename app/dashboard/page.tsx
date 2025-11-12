import { redirect } from "next/navigation";
import { getActiveRole } from "@/app/actions/roles";

// Force dynamic rendering to ensure we always read fresh role data
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { activeRole } = await getActiveRole();
  if (activeRole === "talent") {
    redirect("/dashboard/talent");
  }
  redirect("/dashboard/photographer");
}
