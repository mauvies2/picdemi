'use client';

import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const T = {
  en: { from: 'From', to: 'To', reset: 'Reset' },
  es: { from: 'Desde', to: 'Hasta', reset: 'Restablecer' },
} as const;

interface TimeFilterBarProps {
  minTime: string; // ISO timestamp — earliest corrected_taken_at
  maxTime: string; // ISO timestamp — latest corrected_taken_at
}

function toMinutesSinceMidnight(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function minutesToISO(minutes: number, referenceIso: string): string {
  const ref = new Date(referenceIso);
  const d = new Date(ref);
  d.setHours(Math.floor(minutes / 60) % 24, minutes % 60, 0, 0);
  return d.toISOString();
}

export function TimeFilterBar({ minTime, maxTime }: TimeFilterBarProps) {
  const { lang } = useParams<{ lang?: string }>();
  const t = T[lang === 'en' ? 'en' : 'es'];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const minMinutes = toMinutesSinceMidnight(minTime);
  const maxMinutes = toMinutesSinceMidnight(maxTime);

  const startParam = searchParams.get('startTime');
  const endParam = searchParams.get('endTime');

  const initialStart = startParam ? toMinutesSinceMidnight(startParam) : minMinutes;
  const initialEnd = endParam ? toMinutesSinceMidnight(endParam) : maxMinutes;

  const [range, setRange] = useState([initialStart, initialEnd]);

  // Sync when URL params change externally
  useEffect(() => {
    const s = startParam ? toMinutesSinceMidnight(startParam) : minMinutes;
    const e = endParam ? toMinutesSinceMidnight(endParam) : maxMinutes;
    setRange([s, e]);
  }, [startParam, endParam, minMinutes, maxMinutes]);

  const applyFilter = useCallback(
    (values: number[]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('startTime', minutesToISO(values[0]!, minTime));
      params.set('endTime', minutesToISO(values[1]!, maxTime));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, minTime, maxTime],
  );

  const reset = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('startTime');
    params.delete('endTime');
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const isFiltered = startParam !== null || endParam !== null;

  // Don't render if min === max (no range to filter)
  if (minMinutes === maxMinutes) return null;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-input bg-muted/30 px-4 py-3">
      <div className="flex flex-col gap-1 min-w-[2.5rem]">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.from}</span>
        <span className="text-sm font-medium tabular-nums">{minutesToHHMM(range[0]!)}</span>
      </div>

      <div className="flex-1">
        <Slider
          min={minMinutes}
          max={maxMinutes}
          step={1}
          value={range}
          onValueChange={setRange}
          onValueCommit={applyFilter}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1 min-w-[2.5rem] text-right">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.to}</span>
        <span className="text-sm font-medium tabular-nums">{minutesToHHMM(range[1]!)}</span>
      </div>

      {isFiltered && (
        <Button type="button" variant="ghost" size="sm" onClick={reset} className="shrink-0">
          {t.reset}
        </Button>
      )}
    </div>
  );
}
