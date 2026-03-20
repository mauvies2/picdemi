'use client';

export function DashboardHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
    </div>
  );
}
