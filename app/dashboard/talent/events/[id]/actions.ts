'use server';

import { revalidatePath } from 'next/cache';
import { getActiveRole } from '@/app/actions/roles';
import { tagPhotoForTalent, untagPhotoForTalent } from '@/database/queries/talent-photo-tags';
import { createClient } from '@/database/server';

/**
 * Add a photo to "My Photos" (tag it for the current talent user)
 */
export async function addPhotoToMyPhotosAction(photoId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in to add photos to your library.');
  }

  // Verify user is talent
  const { activeRole } = await getActiveRole();
  if (activeRole !== 'talent') {
    throw new Error('Only talent users can add photos to their library.');
  }

  // Tag the photo for the current user (tagged by themselves)
  await tagPhotoForTalent(supabase, photoId, user.id, user.id);
  revalidatePath('/dashboard/talent/events/[id]', 'page');
  revalidatePath('/dashboard/talent/photos', 'page');
}

/**
 * Remove a photo from "My Photos" (untag it for the current talent user)
 */
export async function removePhotoFromMyPhotosAction(photoId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in to remove photos from your library.');
  }

  // Verify user is talent
  const { activeRole } = await getActiveRole();
  if (activeRole !== 'talent') {
    throw new Error('Only talent users can remove photos from their library.');
  }

  // Untag the photo for the current user
  await untagPhotoForTalent(supabase, photoId, user.id);
  revalidatePath('/dashboard/talent/events/[id]', 'page');
  revalidatePath('/dashboard/talent/photos', 'page');
}
