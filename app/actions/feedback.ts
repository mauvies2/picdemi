'use server';

import { Buffer } from 'node:buffer';
import {
  createFeedback,
  getUserRoadmapVotes,
  toggleRoadmapVote,
  uploadFile,
} from '@/database/queries';
import { createClient } from '@/database/server';

export async function submitFeedbackAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to submit feedback.');

  const category = formData.get('category')?.toString() ?? '';
  const ratingRaw = formData.get('rating')?.toString();
  const rating = ratingRaw && Number(ratingRaw) > 0 ? Number(ratingRaw) : null;
  const subject = formData.get('subject')?.toString() ?? '';
  const description = formData.get('description')?.toString() ?? '';
  const role = formData.get('role')?.toString() ?? '';
  const pageUrl = formData.get('pageUrl')?.toString() ?? null;
  const screenshotFile = formData.get('screenshot');

  if (!category || !subject || !description) {
    throw new Error('Category, subject, and description are required.');
  }

  let screenshotUrl: string | null = null;
  if (screenshotFile instanceof File && screenshotFile.size > 0) {
    const ext = screenshotFile.name.split('.').pop()?.toLowerCase() ?? 'png';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await screenshotFile.arrayBuffer());
    await uploadFile(supabase, 'feedback', path, buffer, {
      contentType: screenshotFile.type || undefined,
      upsert: false,
    });
    screenshotUrl = path;
  }

  await createFeedback(supabase, {
    user_id: user.id,
    role,
    category,
    rating,
    subject,
    description,
    screenshot_url: screenshotUrl,
    page_url: pageUrl,
  });
}

export async function toggleVoteAction(featureKey: string): Promise<{ voted: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to vote.');
  return toggleRoadmapVote(supabase, user.id, featureKey);
}

export async function getInitialVotesAction(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return getUserRoadmapVotes(supabase, user.id);
}
