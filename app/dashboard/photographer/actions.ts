'use server';

import { getUserEvents } from '@/database/queries/events';
import { getSalesOverTime, getSalesSummary, getTopSellingEvents } from '@/database/queries/sales';
import { createClient } from '@/database/server';

export async function getDashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Calculate date range for last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();

  // Fetch all data in parallel
  const [salesSummary, salesOverTime, topEvents, allEvents] = await Promise.all([
    getSalesSummary(supabase, user.id, startDateStr, endDateStr),
    getSalesOverTime(supabase, user.id, startDateStr, endDateStr, 'day'),
    getTopSellingEvents(supabase, user.id, 1, startDateStr, endDateStr),
    getUserEvents(supabase, user.id),
  ]);

  // Calculate total photos count (estimate storage)
  const { count: totalPhotosCount } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Estimate storage: assume average 5MB per photo
  const estimatedStorageMB = (totalPhotosCount ?? 0) * 5;
  const estimatedStorageGB = estimatedStorageMB / 1024;

  // For now, assume a free plan (can be fetched from user subscription later)
  const { getPlanById } = await import('@/lib/plans');
  const currentPlan = getPlanById('free');
  const storageLimitGB = currentPlan?.storageGB ?? 1;
  const storageUsedGB = estimatedStorageGB;
  const storageUsedPercent = Math.min((storageUsedGB / storageLimitGB) * 100, 100);

  return {
    salesSummary,
    salesOverTime,
    topEvent: topEvents[0] || null,
    totalEvents: allEvents.length,
    storage: {
      usedGB: storageUsedGB,
      limitGB: storageLimitGB,
      usedPercent: storageUsedPercent,
      totalPhotos: totalPhotosCount ?? 0,
    },
  };
}
