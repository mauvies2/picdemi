import Link from "next/link";

const actions = [
  {
    title: "Explore photographers",
    description: "Discover photographers, events, and curated collections.",
    href: "/dashboard/talent/explore",
  },
  {
    title: "Your photos",
    description: "Organise personal uploads and portfolio imagery.",
    href: "/dashboard/talent/photos",
  },
  {
    title: "Profile",
    description: "Update your bio, avatar, and social links.",
    href: "/dashboard/talent/profile",
  },
  {
    title: "Settings",
    description: "Manage account preferences and notifications.",
    href: "/dashboard/talent/settings",
  },
];

export default function TalentDashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <Link
          key={action.title}
          href={action.href}
          className="group rounded-xl border p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <h2 className="text-lg font-semibold">{action.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {action.description}
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
            Open
            <span className="ml-1 transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
