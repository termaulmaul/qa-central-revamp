export interface EmbeddingVector {
  id: string;
  vector: number[];
  text: string;
  metadata: Record<string, unknown>;
}

// ponytail: lightweight cosine-similarity embedder for in-memory matching.
// Replace with actual embedding model (OpenAI / local SentenceTransformer) when scaling past 10k cases.
export class QaseEmbeddingEngine {
  private dimensions = 128;
  private cache = new Map<string, EmbeddingVector>();

  // Simple hash-based embedding for deterministic similarity.
  // NOT semantically meaningful — only for exact/near-exact match dedup.
  embed(text: string, id: string, metadata: Record<string, unknown> = {}): EmbeddingVector {
    const key = text.toLowerCase().replace(/\s+/g, ' ').trim();
    const existing = this.cache.get(key);
    if (existing) return existing;

    const vector = this.hashVector(key);
    const vec: EmbeddingVector = { id, vector, text: key, metadata };
    this.cache.set(key, vec);
    return vec;
  }

  similarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  findClosest(
    query: string,
    candidates: EmbeddingVector[],
    threshold = 0.85,
  ): Array<{ match: EmbeddingVector; score: number }> {
    const qVec = this.hashVector(query.toLowerCase().replace(/\s+/g, ' ').trim());
    return candidates
      .map((c) => ({ match: c, score: this.similarity(qVec, c.vector) }))
      .filter((r) => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private hashVector(text: string): number[] {
    const vec = new Array(this.dimensions).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const idx = i % this.dimensions;
      vec[idx] += Math.sin(code + i * 0.1) * 100;
    }
    // normalize
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }

  batchEmbed(
    items: Array<{ text: string; id: string; metadata?: Record<string, unknown> }>,
  ): EmbeddingVector[] {
    return items.map((item) => this.embed(item.text, item.id, item.metadata));
  }
}