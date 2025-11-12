import Link from "next/link";
import { getActiveRole, switchRole } from "@/app/actions/roles";
import { DashboardHeader } from "@/components/dashboard-header";

const links = [
  { href: "/dashboard/talent", label: "Overview" },
  { href: "/dashboard/talent/photos", label: "Your photos" },
  { href: "/dashboard/talent/explore", label: "Explore" },
  { href: "/dashboard/talent/profile", label: "Profile" },
  { href: "/dashboard/talent/settings", label: "Settings" },
];

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

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <DashboardHeader title="Dashboard" />
      <nav className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
