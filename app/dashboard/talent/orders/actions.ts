'use server';

import { getUserOrders, type OrderStatus } from '@/database/queries/orders';
import { getErrorMessage } from '@/database/queries/types';
import { createClient } from '@/database/server';

export interface OrderWithItemCount {
  id: string;
  status: OrderStatus;
  total_amount_cents: number;
  currency: string;
  created_at: string;
  completed_at: string | null;
  item_count: number;
}

export async function getTalentOrders(): Promise<OrderWithItemCount[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get all orders for the user
  const orders = await getUserOrders(supabase, user.id, 100);

  if (orders.length === 0) {
    return [];
  }

  // Get item counts for all orders in a single query
  const orderIds = orders.map((o) => o.id);
  const { data: itemCounts, error } = await supabase
    .from('order_items')
    .select('order_id')
    .in('order_id', orderIds);

  if (error) {
    throw new Error(`Failed to get order item counts: ${getErrorMessage(error)}`);
  }

  // Count items per order
  const countsByOrderId = new Map<string, number>();
  (itemCounts ?? []).forEach((item) => {
    const current = countsByOrderId.get(item.order_id) ?? 0;
    countsByOrderId.set(item.order_id, current + 1);
  });

  // Map orders with item counts
  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    total_amount_cents: order.total_amount_cents,
    currency: order.currency,
    created_at: order.created_at,
    completed_at: order.completed_at,
    item_count: countsByOrderId.get(order.id) ?? 0,
  }));
}

export async function getTalentOrderStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get all orders
  const orders = await getUserOrders(supabase, user.id, 1000);

  // Calculate stats
  const completedOrders = orders.filter((o) => o.status === 'completed');

  // Count total purchased photos
  let totalPurchasedPhotos = 0;
  if (completedOrders.length > 0) {
    const { count } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .in(
        'order_id',
        completedOrders.map((o) => o.id),
      );
    totalPurchasedPhotos = count ?? 0;
  }

  return {
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    totalPurchasedPhotos,
    totalSpentCents: completedOrders.reduce((sum, order) => sum + order.total_amount_cents, 0),
  };
}
