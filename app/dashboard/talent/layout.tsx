import { getActiveRole, switchRole } from "@/app/actions/roles";

export default async function TalentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeRole } = await getActiveRole();

  // Sync role from URL - if active role is not "talent", switch it
  // Don't redirect here to avoid race conditions - the role is synced and page will render correctly
  // Skip revalidation during render to avoid Next.js error
  if (activeRole !== "talent") {
    await switchRole("talent", { skipRevalidation: true });
  }

  return <div className="flex flex-1 flex-col gap-6 p-4">{children}</div>;
}
