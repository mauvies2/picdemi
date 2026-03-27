'use client';

import { AlertTriangle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TimeSyncModal } from '@/components/time-sync-modal';
import { Button } from '@/components/ui/button';

const T = {
  en: {
    pending: 'Time sync pending',
    pendingDesc: "Attendees won't be able to filter photos by time until you complete the sync.",
    syncNow: 'Sync now',
  },
  es: {
    pending: 'Sincronización pendiente',
    pendingDesc:
      'Los talentos no podrán filtrar fotos por hora hasta que completes la sincronización.',
    syncNow: 'Sincronizar ahora',
  },
} as const;

interface TimeSyncSectionProps {
  eventId: string;
  timeSyncEnabled: boolean;
  timeOffset: number | null;
  autoOpen?: boolean;
}

export function TimeSyncSection({
  eventId,
  timeSyncEnabled,
  timeOffset,
  autoOpen = false,
}: TimeSyncSectionProps) {
  const { lang } = useParams<{ lang?: string }>();
  const t = T[lang === 'en' ? 'en' : 'es'];

  const [modalOpen, setModalOpen] = useState(false);
  const [synced, setSynced] = useState(timeOffset !== null);

  useEffect(() => {
    if (autoOpen) {
      setModalOpen(true);
    }
  }, [autoOpen]);

  if (!timeSyncEnabled) return null;

  return (
    <>
      {!synced && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-500" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">{t.pending}</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-500">{t.pendingDesc}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-yellow-500/40 text-yellow-800 hover:bg-yellow-500/10 dark:text-yellow-400"
            onClick={() => setModalOpen(true)}
          >
            {t.syncNow}
          </Button>
        </div>
      )}

      <TimeSyncModal
        eventId={eventId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSynced={() => setSynced(true)}
      />
    </>
  );
}
