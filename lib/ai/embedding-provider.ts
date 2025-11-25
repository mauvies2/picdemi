/**
 * AI Embedding Provider Abstraction
 *
 * This module provides an abstraction layer for generating image embeddings.
 * Currently uses a mock implementation that can be replaced with real AI models.
 *
 * TODO: Replace mock implementation with actual AI provider (e.g., OpenAI CLIP, Google Vision API, etc.)
 */

export interface EmbeddingProvider {
  /**
   * Generate an embedding vector from an image
   * @param imageData - Image data as ArrayBuffer, Blob, or base64 string
   * @param options - Optional configuration
   * @returns Promise resolving to embedding vector (array of numbers)
   */
  generateEmbedding(
    imageData: ArrayBuffer | Blob | string,
    options?: EmbeddingOptions,
  ): Promise<number[]>;
}

export interface EmbeddingOptions {
  /**
   * Dimension of the embedding vector
   * Default: 512
   */
  dimension?: number;

  /**
   * Model version identifier
   * Default: 'v1.0'
   */
  modelVersion?: string;
}

/**
 * Mock embedding provider for development/testing
 * Generates deterministic pseudo-random embeddings based on image hash
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  private readonly dimension: number;
  private readonly modelVersion: string;

  constructor(options?: EmbeddingOptions) {
    this.dimension = options?.dimension ?? 512;
    this.modelVersion = options?.modelVersion ?? "v1.0";
  }

  async generateEmbedding(
    imageData: ArrayBuffer | Blob | string,
  ): Promise<number[]> {
    // TODO: Replace with actual AI model inference
    // For now, generate a deterministic pseudo-random vector based on image hash

    // Convert image data to a hash-like value for deterministic generation
    const hash = await this.hashImageData(imageData);

    // Generate deterministic pseudo-random vector
    const embedding: number[] = [];
    for (let i = 0; i < this.dimension; i++) {
      // Use hash + index to generate deterministic values
      const seed = hash + i;
      const value = this.pseudoRandom(seed);
      // Normalize to [-1, 1] range and then normalize vector
      embedding.push(value * 2 - 1);
    }

    // Normalize the vector to unit length (cosine similarity requirement)
    return this.normalizeVector(embedding);
  }

  /**
   * Generate a hash-like value from image data
   */
  private async hashImageData(
    imageData: ArrayBuffer | Blob | string,
  ): Promise<number> {
    let buffer: ArrayBuffer;

    if (typeof imageData === "string") {
      // Assume base64 string
      const binaryString = atob(imageData.split(",")[1] ?? imageData);
      buffer = new ArrayBuffer(binaryString.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < binaryString.length; i++) {
        view[i] = binaryString.charCodeAt(i);
      }
    } else if (imageData instanceof Blob) {
      buffer = await imageData.arrayBuffer();
    } else {
      buffer = imageData;
    }

    // Simple hash: sum of first 100 bytes
    const view = new Uint8Array(buffer);
    let hash = 0;
    const maxBytes = Math.min(100, view.length);
    for (let i = 0; i < maxBytes; i++) {
      hash += view[i]!;
    }

    return hash;
  }

  /**
   * Pseudo-random number generator (deterministic)
   */
  private pseudoRandom(seed: number): number {
    // Simple LCG (Linear Congruential Generator)
    const a = 1664525;
    const c = 1013904223;
    const m = 2 ** 32;
    return ((a * seed + c) % m) / m;
  }

  /**
   * Normalize vector to unit length
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0),
    );
    if (magnitude === 0) {
      return vector;
    }
    return vector.map((val) => val / magnitude);
  }

  getModelVersion(): string {
    return this.modelVersion;
  }

  getDimension(): number {
    return this.dimension;
  }
}

/**
 * Get the embedding provider instance
 * TODO: Replace with actual AI provider initialization
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  // For now, return mock provider
  // In production, initialize with actual AI provider based on env config
  return new MockEmbeddingProvider({
    dimension: 512,
    modelVersion: "v1.0",
  });
}

/**
 * Convert image file to embedding vector
 * Helper function that handles file conversion and calls the provider
 */
export async function generateImageEmbedding(
  imageFile: File | Blob,
): Promise<{ embedding: number[]; modelVersion: string; dimension: number }> {
  const provider = getEmbeddingProvider();
  const embedding = await provider.generateEmbedding(imageFile);

  return {
    embedding,
    modelVersion:
      provider instanceof MockEmbeddingProvider
        ? provider.getModelVersion()
        : "v1.0",
    dimension:
      provider instanceof MockEmbeddingProvider ? provider.getDimension() : 512,
  };
}
