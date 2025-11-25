"use server";

import {
  createAISearchProfile,
  deleteAISearchProfile,
  getAISearchProfile,
  getAISearchProfiles,
  updateAISearchProfile,
} from "@/database/queries/ai-search-profiles";
import {
  getAISearchUsageCount,
  incrementAISearchUsage,
} from "@/database/queries/ai-search-usage";
import {
  findSimilarPhotos,
  type SimilaritySearchFilters,
} from "@/database/queries/ai-similarity-search";
import { getProfile } from "@/database/queries/profiles";
import { getSubscription } from "@/database/queries/subscriptions";
import { tagPhotosForTalent } from "@/database/queries/talent-photo-tags";
import { createClient } from "@/database/server";
import { generateImageEmbedding } from "@/lib/ai/embedding-provider";
import {
  getRateLimitForPlan,
  hasExceededRateLimit,
} from "@/lib/ai/rate-limits";
import type { PlanId } from "@/lib/plans";

export interface AISearchProfile {
  id: string;
  name: string;
  activity_type: string | null;
  country: string | null;
  region: string | null;
  date_from: string | null;
  date_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface SimilarityMatch {
  photo_id: string;
  similarity_score: number;
  photo_url: string | null;
  event_id: string | null;
  event_name: string | null;
  event_date: string | null;
  event_city: string | null;
  event_country: string | null;
  photographer_id: string;
  photographer_username: string | null;
  photographer_display_name: string | null;
}

export interface CreateAISearchProfileInput {
  name: string;
  selfieFile?: File;
  activity_type?: string | null;
  country?: string | null;
  region?: string | null;
  date_from?: string | null;
  date_to?: string | null;
}

export interface UpdateAISearchProfileInput {
  name?: string;
  selfieFile?: File;
  activity_type?: string | null;
  country?: string | null;
  region?: string | null;
  date_from?: string | null;
  date_to?: string | null;
}

/**
 * Get all AI search profiles for the current user
 */
export async function getMyAISearchProfiles(): Promise<AISearchProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to view AI search profiles.");
  }

  const profiles = await getAISearchProfiles(supabase, user.id);

  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    activity_type: profile.activity_type,
    country: profile.country,
    region: profile.region,
    date_from: profile.date_from,
    date_to: profile.date_to,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  }));
}

/**
 * Get a single AI search profile
 */
export async function getMyAISearchProfile(
  profileId: string,
): Promise<AISearchProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to view AI search profiles.");
  }

  const profile = await getAISearchProfile(supabase, profileId, user.id);
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    name: profile.name,
    activity_type: profile.activity_type,
    country: profile.country,
    region: profile.region,
    date_from: profile.date_from,
    date_to: profile.date_to,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

/**
 * Create a new AI search profile
 */
export async function createMyAISearchProfile(
  input: CreateAISearchProfileInput,
): Promise<AISearchProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to create AI search profiles.");
  }

  // Generate embedding from selfie if provided
  let embedding: number[] | null = null;
  if (input.selfieFile) {
    const { embedding: generatedEmbedding } = await generateImageEmbedding(
      input.selfieFile,
    );
    embedding = generatedEmbedding;
  }

  const profile = await createAISearchProfile(supabase, user.id, {
    name: input.name,
    selfie_embedding: embedding,
    activity_type: input.activity_type ?? null,
    country: input.country ?? null,
    region: input.region ?? null,
    date_from: input.date_from ?? null,
    date_to: input.date_to ?? null,
  });

  return {
    id: profile.id,
    name: profile.name,
    activity_type: profile.activity_type,
    country: profile.country,
    region: profile.region,
    date_from: profile.date_from,
    date_to: profile.date_to,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

/**
 * Update an AI search profile
 */
export async function updateMyAISearchProfile(
  profileId: string,
  input: UpdateAISearchProfileInput,
): Promise<AISearchProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to update AI search profiles.");
  }

  // Generate embedding from selfie if provided
  let embedding: number[] | undefined;
  if (input.selfieFile) {
    const { embedding: generatedEmbedding } = await generateImageEmbedding(
      input.selfieFile,
    );
    embedding = generatedEmbedding;
  }

  const updateData: Parameters<typeof updateAISearchProfile>[2] = {};
  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  if (embedding !== undefined) {
    updateData.selfie_embedding = embedding;
  }
  if (input.activity_type !== undefined) {
    updateData.activity_type = input.activity_type;
  }
  if (input.country !== undefined) {
    updateData.country = input.country;
  }
  if (input.region !== undefined) {
    updateData.region = input.region;
  }
  if (input.date_from !== undefined) {
    updateData.date_from = input.date_from;
  }
  if (input.date_to !== undefined) {
    updateData.date_to = input.date_to;
  }

  const profile = await updateAISearchProfile(
    supabase,
    profileId,
    user.id,
    updateData,
  );

  return {
    id: profile.id,
    name: profile.name,
    activity_type: profile.activity_type,
    country: profile.country,
    region: profile.region,
    date_from: profile.date_from,
    date_to: profile.date_to,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

/**
 * Delete an AI search profile
 */
export async function deleteMyAISearchProfile(
  profileId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to delete AI search profiles.");
  }

  await deleteAISearchProfile(supabase, profileId, user.id);
}

/**
 * Check if user can perform AI search (rate limiting)
 */
export async function checkAISearchAvailability(): Promise<{
  available: boolean;
  currentUsage: number;
  limit: number | null;
  description: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to check AI search availability.");
  }

  // Get user's subscription
  const subscription = await getSubscription(supabase, user.id);
  const planId: PlanId = subscription?.plan_id ?? "free";

  // Get current usage
  const currentUsage = await getAISearchUsageCount(supabase, user.id);

  // Check rate limit
  const rateLimit = getRateLimitForPlan(planId);
  const available = !hasExceededRateLimit(planId, currentUsage);

  return {
    available,
    currentUsage,
    limit: rateLimit.maxSearchesPerMonth,
    description: rateLimit.description,
  };
}

/**
 * Run AI similarity search
 * This will increment usage count and perform the search
 */
export async function runAISimilaritySearch(
  selfieFile: File,
  filters?: SimilaritySearchFilters,
  profileId?: string,
): Promise<{
  matches: SimilarityMatch[];
  usageAfter: number;
  limit: number | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to run AI similarity search.");
  }

  // Check rate limit before proceeding
  const availability = await checkAISearchAvailability();
  if (!availability.available) {
    throw new Error(
      `AI search limit exceeded. ${availability.description}. Please upgrade your plan.`,
    );
  }

  // If profileId is provided, use its embedding and filters
  let embedding: number[];
  let searchFilters: SimilaritySearchFilters = filters ?? {};

  if (profileId) {
    const profile = await getAISearchProfile(supabase, profileId, user.id);
    if (!profile) {
      throw new Error("AI search profile not found.");
    }
    if (!profile.selfie_embedding) {
      throw new Error("Profile does not have a selfie embedding.");
    }
    embedding = profile.selfie_embedding;

    // Merge profile filters with provided filters (provided filters take precedence)
    searchFilters = {
      activity_type:
        filters?.activity_type ?? profile.activity_type ?? undefined,
      country: filters?.country ?? profile.country ?? undefined,
      region: filters?.region ?? profile.region ?? undefined,
      date_from: filters?.date_from ?? profile.date_from ?? undefined,
      date_to: filters?.date_to ?? profile.date_to ?? undefined,
      min_similarity: filters?.min_similarity,
      limit: filters?.limit,
    };
  } else {
    // Generate embedding from selfie file
    const { embedding: generatedEmbedding } =
      await generateImageEmbedding(selfieFile);
    embedding = generatedEmbedding;
  }

  // Run similarity search
  const matches = await findSimilarPhotos(supabase, embedding, searchFilters);

  // Increment usage count
  const usageAfter = await incrementAISearchUsage(supabase, user.id);

  // Get updated limit info
  const subscription = await getSubscription(supabase, user.id);
  const planId: PlanId = subscription?.plan_id ?? "free";
  const rateLimit = getRateLimitForPlan(planId);

  return {
    matches: matches.map((match) => ({
      photo_id: match.photo_id,
      similarity_score: match.similarity_score,
      photo_url: match.photo_url,
      event_id: match.event_id,
      event_name: match.event_name,
      event_date: match.event_date,
      event_city: match.event_city,
      event_country: match.event_country,
      photographer_id: match.photographer_id,
      photographer_username: match.photographer_username,
      photographer_display_name: match.photographer_display_name,
    })),
    usageAfter,
    limit: rateLimit.maxSearchesPerMonth,
  };
}

/**
 * Add matched photos to "Photos of You" (create talent_photo_tags)
 * This allows users to add AI-matched photos to their library
 */
export async function addMatchedPhotosToLibrary(
  photoIds: string[],
): Promise<{ added: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to add photos to your library.");
  }

  if (photoIds.length === 0) {
    return { added: 0 };
  }

  // Tag photos for the current user (tagged by themselves via AI matching)
  const added = await tagPhotosForTalent(supabase, photoIds, user.id, user.id);

  return { added };
}

/**
 * Get user's country from profile (for prefilling filters)
 */
export async function getUserCountry(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await getProfile(supabase, user.id);
  return profile?.country_code ?? null;
}
