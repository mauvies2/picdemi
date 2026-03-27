/**
 * Time sync token queries
 */

import type { SupabaseServerClient } from './types';
import { getErrorMessage } from './types';

export interface TimeSyncToken {
  id: string;
  event_id: string;
  server_time: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

/**
 * Create a new time sync token for an event.
 * The token expires in 10 minutes and encodes the current server time.
 */
export async function createTimeSyncToken(
  supabase: SupabaseServerClient,
  eventId: string,
): Promise<{ id: string; server_time: string }> {
  const { data, error } = await supabase
    .from('time_sync_tokens')
    .insert({
      event_id: eventId,
      server_time: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    .select('id, server_time')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create time sync token: ${getErrorMessage(error)}`);
  }

  return data as { id: string; server_time: string };
}

/**
 * Get a time sync token by ID.
 */
export async function getTimeSyncToken(
  supabase: SupabaseServerClient,
  tokenId: string,
): Promise<TimeSyncToken | null> {
  const { data, error } = await supabase
    .from('time_sync_tokens')
    .select('*')
    .eq('id', tokenId)
    .single();

  if (error || !data) return null;
  return data as TimeSyncToken;
}

/**
 * Mark a time sync token as used so it cannot be replayed.
 */
export async function markTokenUsed(
  supabase: SupabaseServerClient,
  tokenId: string,
): Promise<void> {
  const { error } = await supabase
    .from('time_sync_tokens')
    .update({ used: true })
    .eq('id', tokenId);

  if (error) {
    throw new Error(`Failed to mark token as used: ${getErrorMessage(error)}`);
  }
}
