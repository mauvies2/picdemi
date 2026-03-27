'use server';

import exifReader from 'exif-reader';
import jsQR from 'jsqr';
import { revalidateTag } from 'next/cache';
import sharp from 'sharp';
import type { SupabaseServerClient } from '@/database/queries';
import {
  batchUpdateCorrectedTakenAt,
  createTimeSyncToken,
  getTimeSyncToken,
  markTokenUsed,
  updateEvent,
} from '@/database/queries';
import { createClient } from '@/database/server';
import { supabaseAdmin } from '@/database/supabase-admin';

// ─── Create Token ─────────────────────────────────────────────────────────────

/**
 * Create a new time sync token for the given event.
 * Returns the token id (UUID) to be encoded in the QR code.
 */
export async function createTimeSyncTokenAction(
  eventId: string,
): Promise<{ id: string; server_time: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Verify event ownership
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (!event) throw new Error('Event not found or access denied');

  return createTimeSyncToken(supabase, eventId);
}

// ─── Complete Sync ────────────────────────────────────────────────────────────

export type CompleteSyncResult =
  | { success: true; offsetMs: number }
  | { success: false; error: string };

/**
 * Process the sync photo:
 * 1. Scan for QR code → extract token UUID
 * 2. Validate the token (not expired, not used)
 * 3. Extract EXIF DateTimeOriginal from the photo
 * 4. Calculate camera-to-server offset
 * 5. Update the event with time_offset
 * 6. Batch-recalculate corrected_taken_at for all existing photos
 */
export async function completeSyncAction(
  eventId: string,
  formData: FormData,
): Promise<CompleteSyncResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Not authenticated' };

    // Verify event ownership
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!event) return { success: false, error: 'Event not found or access denied' };

    // ── 1. Get photo buffer ──────────────────────────────────────────────────
    const file = formData.get('photo') as File | null;
    if (!file) return { success: false, error: 'No photo provided' };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── 2. Extract camera timestamp (EXIF → fileLastModified fallback) ───────
    let cameraTimeMs: number | null = null;
    try {
      const { exif: exifBuffer } = await sharp(buffer).metadata();
      if (exifBuffer) {
        const exif = exifReader(exifBuffer);
        const raw =
          exif.Photo?.DateTimeOriginal ??
          exif.Photo?.DateTimeDigitized ??
          exif.Image?.DateTime;
        if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
          cameraTimeMs = raw.getTime();
        }
      }
    } catch {
      // EXIF parsing failed — fall through to fileLastModified
    }

    // Fallback: use file.lastModified sent from the client (reliable for phone photos —
    // the OS sets this to the capture time when the photo is saved)
    if (!cameraTimeMs) {
      const lastModifiedStr = formData.get('fileLastModified');
      if (lastModifiedStr) {
        const ms = Number(lastModifiedStr);
        if (!Number.isNaN(ms) && ms > 0) cameraTimeMs = ms;
      }
    }

    if (!cameraTimeMs) {
      return {
        success: false,
        error: 'Could not read the photo timestamp. Make sure the photo has EXIF data.',
      };
    }

    // ── 3. Scan for QR code ──────────────────────────────────────────────────
    const { data: pixelData, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const qrResult = jsQR(new Uint8ClampedArray(pixelData), info.width, info.height);

    if (!qrResult?.data) {
      return {
        success: false,
        error: 'No QR code found in the photo. Make sure the QR code is clearly visible.',
      };
    }

    const tokenId = qrResult.data;

    // ── 4. Validate the token ────────────────────────────────────────────────
    const token = await getTimeSyncToken(supabase, tokenId);

    if (!token) return { success: false, error: 'Invalid QR code. Please generate a new one.' };
    if (token.used) return { success: false, error: 'This QR code has already been used.' };
    if (new Date(token.expires_at) < new Date()) {
      return { success: false, error: 'QR code has expired. Please generate a new one.' };
    }
    if (token.event_id !== eventId) {
      return { success: false, error: 'QR code does not belong to this event.' };
    }

    // ── 5. Calculate offset ──────────────────────────────────────────────────
    const serverTimeMs = new Date(token.server_time).getTime();
    const offsetMs = serverTimeMs - cameraTimeMs;

    // ── 6. Update event ──────────────────────────────────────────────────────
    await updateEvent(supabase, eventId, user.id, { time_offset: offsetMs });
    await markTokenUsed(supabase, tokenId);

    // ── 7. Batch recalculate corrected_taken_at for all existing photos ──────
    const { data: photos } = await (supabaseAdmin as unknown as SupabaseServerClient)
      .from('photos')
      .select('id, taken_at')
      .eq('event_id', eventId)
      .not('taken_at', 'is', null);

    if (photos && photos.length > 0) {
      const updates = (photos as { id: string; taken_at: string }[])
        .filter((p) => p.taken_at)
        .map((p) => ({
          id: p.id,
          corrected_taken_at: new Date(new Date(p.taken_at).getTime() + offsetMs).toISOString(),
        }));

      if (updates.length > 0) {
        await batchUpdateCorrectedTakenAt(
          supabaseAdmin as unknown as SupabaseServerClient,
          updates,
        );
      }
    }

    // ── 8. Invalidate caches ─────────────────────────────────────────────────
    revalidateTag(`photos-${eventId}`, 'max');
    revalidateTag(`event-${eventId}`, 'max');

    return { success: true, offsetMs };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}
