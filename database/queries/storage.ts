/**
 * Storage-related database queries
 */

import type { SupabaseServerClient } from './types';
import { getErrorMessage } from './types';

/**
 * Create a signed URL for a single file
 */
export async function createSignedUrl(
  supabase: SupabaseServerClient,
  bucket: string,
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

/**
 * Create signed URLs for multiple files
 */
export async function createSignedUrls(
  supabase: SupabaseServerClient,
  bucket: string,
  paths: string[],
  expiresIn = 3600,
): Promise<Array<{ path: string; signedUrl: string | null }>> {
  if (paths.length === 0) {
    return [];
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, expiresIn);

  if (error || !data) {
    // Fallback: sign individually
    const results = await Promise.all(
      paths.map(async (path) => {
        const signedUrl = await createSignedUrl(supabase, bucket, path, expiresIn);
        return {
          path,
          signedUrl,
        };
      }),
    );
    return results;
  }

  return data
    .map((item) => ({
      path: item.path ?? '',
      signedUrl: item.signedUrl ?? null,
    }))
    .filter((item) => item.path !== '') as Array<{
    path: string;
    signedUrl: string | null;
  }>;
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  supabase: SupabaseServerClient,
  bucket: string,
  path: string,
  file: Buffer | ArrayBuffer | Blob,
  options?: {
    contentType?: string;
    upsert?: boolean;
  },
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: options?.contentType,
    upsert: options?.upsert ?? false,
  });

  if (error) {
    throw new Error(`Failed to upload file: ${getErrorMessage(error)}`);
  }
}

/**
 * Delete files from storage
 */
export async function deleteStorageFiles(
  supabase: SupabaseServerClient,
  bucket: string,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw new Error(`Failed to delete storage files: ${getErrorMessage(error)}`);
  }
}

/**
 * Create photo URLs with optional watermark support
 * If useWatermark is true, returns watermark API URLs instead of signed URLs
 */
export async function createPhotoUrls(
  supabase: SupabaseServerClient,
  bucket: string,
  paths: string[],
  options?: {
    expiresIn?: number;
    useWatermark?: boolean;
    baseUrl?: string;
  },
): Promise<Array<{ path: string; signedUrl: string | null }>> {
  const { useWatermark = false, baseUrl, expiresIn = 3600 } = options ?? {};

  if (useWatermark && baseUrl) {
    // Return watermark API URLs
    return paths.map((path) => ({
      path,
      signedUrl: `${baseUrl}/api/watermark/${path}`,
    }));
  }

  // Return regular signed URLs
  return createSignedUrls(supabase, bucket, paths, expiresIn);
}
