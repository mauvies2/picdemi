/**
 * Admin API endpoint for managing payouts
 * POST /api/admin/payouts/[id] - Update payout status
 */

import { NextResponse } from 'next/server';
import type { PayoutStatus } from '@/database/queries/payouts';
import { updatePayoutStatus } from '@/database/queries/payouts';
import { createClient } from '@/database/server';
import { supabaseAdmin } from '@/database/supabase-admin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, admin_notes } = body;

    if (!status || !['pending', 'approved', 'paid', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update payout status using admin client
    const payout = await updatePayoutStatus(supabaseAdmin, id, status as PayoutStatus, admin_notes);

    return NextResponse.json({ payout });
  } catch (error) {
    console.error('Error updating payout:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update payout',
      },
      { status: 500 },
    );
  }
}
