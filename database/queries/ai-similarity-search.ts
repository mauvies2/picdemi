/**
 * AI Similarity Search database queries
 * For finding photos similar to a selfie embedding using pgvector
 */

import type { SupabaseServerClient } from "./types";
import { getErrorMessage } from "./types";

export interface SimilaritySearchResult {
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

export interface SimilaritySearchFilters {
  activity_type?: string | null;
  country?: string | null;
  region?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  min_similarity?: number; // 0.0 to 1.0
  limit?: number;
}

/**
 * Find photos similar to a selfie embedding
 * Uses pgvector cosine similarity search
 */
export async function findSimilarPhotos(
  supabase: SupabaseServerClient,
  selfieEmbedding: number[],
  filters?: SimilaritySearchFilters,
): Promise<SimilaritySearchResult[]> {
  const limit = filters?.limit ?? 50;
  const minSimilarity = filters?.min_similarity ?? 0.5;

  // TODO: Convert embedding array to pgvector format when using raw SQL
  // const embeddingString = `[${selfieEmbedding.join(",")}]`;

  // TODO: Build the similarity search query using pgvector
  // We'll use a raw SQL query for the similarity search since Supabase client
  // doesn't have built-in support for vector operations
  // This is a future optimization - for now we use application-layer filtering
  // const query = `
  //   SELECT
  //     p.id as photo_id,
  //     1 - (pe.embedding <=> $1::vector) as similarity_score,
  //     p.original_url as photo_url,
  //     p.event_id,
  //     e.name as event_name,
  //     e.date as event_date,
  //     e.city as event_city,
  //     e.country as event_country,
  //     p.photographer_id,
  //     prof.username as photographer_username,
  //     prof.display_name as photographer_display_name
  //   FROM photo_embeddings pe
  //   JOIN photos p ON p.id = pe.photo_id
  //   JOIN events e ON e.id = p.event_id
  //   LEFT JOIN profiles prof ON prof.id = p.photographer_id
  //   WHERE pe.embedding IS NOT NULL
  //     AND (1 - (pe.embedding <=> $1::vector)) >= $2
  // `;

  // Alternative approach: Use Supabase client with manual filtering
  // This is less efficient but works with the current Supabase client limitations
  // TODO: Consider creating a PostgreSQL function for better performance

  // For now, we'll fetch embeddings and calculate similarity in the application layer
  // This is not ideal for large datasets but works for MVP
  const { data: embeddings, error: embeddingsError } = await supabase
    .from("photo_embeddings")
    .select(
      `
      photo_id,
      embedding,
      photos!inner(
        id,
        original_url,
        event_id,
        user_id,
        events!inner(
          id,
          name,
          date,
          city,
          country,
          state,
          activity
        )
      )
    `,
    )
    .not("embedding", "is", null)
    .limit(1000); // Limit initial fetch to prevent memory issues

  if (embeddingsError) {
    throw new Error(
      `Failed to fetch photo embeddings: ${getErrorMessage(embeddingsError)}`,
    );
  }

  // Fetch photographer profiles separately
  const photographerIds = new Set<string>();
  const embeddingsData = embeddings ?? [];
  for (const item of embeddingsData) {
    const photo = Array.isArray(item.photos) ? item.photos[0] : item.photos;
    if (photo?.user_id) {
      photographerIds.add(photo.user_id);
    }
  }

  const photographerProfilesMap: Record<
    string,
    { username: string | null; display_name: string | null }
  > = {};

  if (photographerIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", Array.from(photographerIds));

    if (profiles) {
      for (const profile of profiles) {
        photographerProfilesMap[profile.id] = {
          username: profile.username,
          display_name: profile.display_name,
        };
      }
    }
  }

  // Filter by event filters first
  let filteredEmbeddings = embeddings ?? [];

  if (filters?.activity_type) {
    filteredEmbeddings = filteredEmbeddings.filter((item) => {
      const photo = Array.isArray(item.photos) ? item.photos[0] : item.photos;
      const event = Array.isArray(photo?.events)
        ? photo.events[0]
        : photo?.events;
      return event?.activity === filters.activity_type;
    });
  }

  if (filters?.country) {
    filteredEmbeddings = filteredEmbeddings.filter((item) => {
      const photo = Array.isArray(item.photos) ? item.photos[0] : item.photos;
      const event = Array.isArray(photo?.events)
        ? photo.events[0]
        : photo?.events;
      return event?.country === filters.country;
    });
  }

  if (filters?.region) {
    filteredEmbeddings = filteredEmbeddings.filter((item) => {
      const photo = Array.isArray(item.photos) ? item.photos[0] : item.photos;
      const event = Array.isArray(photo?.events)
        ? photo.events[0]
        : photo?.events;
      return event?.state === filters.region;
    });
  }

  if (filters?.date_from) {
    const dateFrom = filters.date_from;
    filteredEmbeddings = filteredEmbeddings.filter((item) => {
      const photo = Array.isArray(item.photos) ? item.photos[0] : item.photos;
      const event = Array.isArray(photo?.events)
        ? photo.events[0]
        : photo?.events;
      return event?.date && dateFrom && event.date >= dateFrom;
    });
  }

  if (filters?.date_to) {
    const dateTo = filters.date_to;
    filteredEmbeddings = filteredEmbeddings.filter((item) => {
      const photo = Array.isArray(item.photos) ? item.photos[0] : item.photos;
      const event = Array.isArray(photo?.events)
        ? photo.events[0]
        : photo?.events;
      return event?.date && dateTo && event.date <= dateTo;
    });
  }

  // Calculate cosine similarity for each embedding
  const results: Array<{
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
  }> = [];

  for (const item of filteredEmbeddings) {
    const photo = Array.isArray(item.photos) ? item.photos[0] : item.photos;
    const event = photo
      ? Array.isArray(photo.events)
        ? photo.events[0]
        : photo.events
      : null;

    if (!photo || !event) continue;

    const photoEmbedding = item.embedding ? (item.embedding as number[]) : null;
    if (!photoEmbedding) continue;

    // Get photographer profile from map
    const photographer = photo.user_id
      ? photographerProfilesMap[photo.user_id]
      : null;

    // Calculate cosine similarity
    const similarity = cosineSimilarity(selfieEmbedding, photoEmbedding);

    if (similarity >= minSimilarity) {
      results.push({
        photo_id: photo.id,
        similarity_score: similarity,
        photo_url: photo.original_url ?? null,
        event_id: event.id ?? null,
        event_name: event.name ?? null,
        event_date: event.date ?? null,
        event_city: event.city ?? null,
        event_country: event.country ?? null,
        photographer_id: photo.user_id,
        photographer_username: photographer?.username ?? null,
        photographer_display_name: photographer?.display_name ?? null,
      });
    }
  }

  // Sort by similarity (descending) and limit
  results.sort((a, b) => b.similarity_score - a.similarity_score);
  return results.slice(0, limit);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    if (a === undefined || b === undefined) {
      continue;
    }
    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}

/**
 * Store photo embedding (for when photos are uploaded)
 * TODO: Call this when photos are uploaded/processed
 */
export async function storePhotoEmbedding(
  supabase: SupabaseServerClient,
  photoId: string,
  embedding: number[],
  modelVersion: string = "v1.0",
): Promise<void> {
  const embeddingString = `[${embedding.join(",")}]`;

  const { error } = await supabase.from("photo_embeddings").upsert(
    {
      photo_id: photoId,
      embedding: embeddingString,
      model_version: modelVersion,
    },
    {
      onConflict: "photo_id,model_version",
    },
  );

  if (error) {
    throw new Error(
      `Failed to store photo embedding: ${getErrorMessage(error)}`,
    );
  }
}
