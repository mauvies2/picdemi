'use client';

import { FolderOpen, Plus } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  title: string;
  createEventLabel: string;
  viewEventsLabel: string;
}

export function QuickActions({ title, createEventLabel, viewEventsLabel }: QuickActionsProps) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{title}</h2>
      <div className="space-y-2 sm:space-y-3">
        <Link
          href="/dashboard/photographer/events/new"
          className={cn(
            buttonVariants({ variant: 'default', size: 'lg' }),
            'w-full justify-start text-sm sm:text-base',
          )}
        >
          <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          {createEventLabel}
        </Link>
        <Link
          href="/dashboard/photographer/events"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'lg' }),
            'w-full justify-start text-sm sm:text-base',
          )}
        >
          <FolderOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          {viewEventsLabel}
        </Link>
      </div>
    </div>
  );
}
