import { db, sql } from '../db/client';
import { embeddingService } from './embedding.service';
import type { SearchResult } from '../../../shared/schemas/search';

/**
 * Raw SQL query result row shape for search operations.
 */
interface SearchRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  similarity: number;
}

export class SearchService {
  /**
   * Perform semantic search using pgvector cosine similarity.
   *
   * @param userId - The user ID to search notes for
   * @param query - Natural language search query
   * @param limit - Maximum number of results (default: 10, max: 50)
   * @param threshold - Minimum similarity score 0.0-1.0 (default: 0.7)
   * @param tags - Optional array of tags to filter by (contains-all)
   * @returns Array of search results with similarity scores and ranks
   *
   * @example
   * ```typescript
   * const results = await searchService.semanticSearch(
   *   'user-123',
   *   'python programming',
   *   10,
   *   0.7,
   *   ['tutorial']
   * );
   * ```
   */
  async semanticSearch(
    userId: string,
    query: string,
    limit: number = 10,
    threshold: number = 0.7,
    tags?: string[],
  ): Promise<{
    results: SearchResult[];
    query_metadata: {
      query: string;
      processing_time_ms: number;
      total_results: number;
    };
  }> {
    const startTime = Date.now();

    try {
      // Generate embedding for query
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Convert Float32Array to vector string format
      const queryVector = `[${Array.from(queryEmbedding).join(',')}]`;

      // Build query dynamically based on whether tags are provided
      let tagsCondition = sql``;
      if (tags && tags.length > 0) {
        const tagsSql = tags.map((t) =>
          sql.raw(`'${t.replaceAll("'", "''")}'`),
        );
        const tagsJoined = sql.join(tagsSql, sql`, `);
        tagsCondition = sql`AND tags @> ARRAY[${tagsJoined}]::text[]`;
      }

      const baseQuery = sql`
        SELECT
          id, user_id, title, content, tags, created_at, updated_at,
          1 - (embedding <=> ${queryVector}::vector) AS similarity
        FROM notes
        WHERE
          user_id = ${userId}
          AND is_archived = false
          AND embedding_status = 'completed'
          AND 1 - (embedding <=> ${queryVector}::vector) >= ${threshold}
          ${tagsCondition}
        ORDER BY embedding <=> ${queryVector}::vector
        LIMIT ${limit}
      `;

      const rows = await db.execute(baseQuery);

      // Map rows to SearchResult shape with rank
      const results: SearchResult[] = (rows as unknown as SearchRow[]).map(
        (row: SearchRow, index: number) => ({
          note: {
            id: row.id,
            user_id: row.user_id,
            title: row.title,
            content: row.content,
            tags: row.tags,
            created_at: row.created_at,
            updated_at: row.updated_at,
          },
          similarity: Number(row.similarity),
          rank: index + 1,
        }),
      );

      const processing_time_ms = Date.now() - startTime;

      return {
        results,
        query_metadata: {
          query,
          processing_time_ms,
          total_results: results.length,
        },
      };
    } catch (error) {
      // Fall back to full-text search on any error
      console.warn(
        '⚠️ Semantic search failed, falling back to full-text search:',
        error,
      );
      return this.fullTextSearch(userId, query, limit, tags, startTime);
    }
  }

  /**
   * Fallback full-text search using PostgreSQL's built-in text search.
   *
   * @param userId - The user ID to search notes for
   * @param query - Search query
   * @param limit - Maximum number of results
   * @param tags - Optional array of tags to filter by
   * @param startTime - Start timestamp for processing time calculation
   * @returns Array of search results with similarity scores and ranks
   */
  private async fullTextSearch(
    userId: string,
    query: string,
    limit: number,
    tags?: string[],
    startTime?: number,
  ): Promise<{
    results: SearchResult[];
    query_metadata: {
      query: string;
      processing_time_ms: number;
      total_results: number;
    };
  }> {
    const actualStartTime = startTime || Date.now();

    // Build tags condition for fallback
    let fallbackTagsCondition = sql``;
    if (tags && tags.length > 0) {
      const tagsSql = tags.map((t) => sql.raw(`'${t.replaceAll("'", "''")}'`));
      const tagsJoined = sql.join(tagsSql, sql`, `);
      fallbackTagsCondition = sql`AND tags @> ARRAY[${tagsJoined}]::text[]`;
    }

    const fallbackQuery = sql`
      SELECT id, user_id, title, content, tags, created_at, updated_at,
        ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${query})) AS similarity
      FROM notes
      WHERE user_id = ${userId}
        AND is_archived = false
        AND to_tsvector('english', content) @@ plainto_tsquery('english', ${query})
        ${fallbackTagsCondition}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    const rows = await db.execute(fallbackQuery);

    // Map rows to SearchResult shape with rank
    const results: SearchResult[] = (rows as unknown as SearchRow[]).map(
      (row: SearchRow, index: number) => ({
        note: {
          id: row.id,
          user_id: row.user_id,
          title: row.title,
          content: row.content,
          tags: row.tags,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        similarity: Number(row.similarity),
        rank: index + 1,
      }),
    );

    const processing_time_ms = Date.now() - actualStartTime;

    return {
      results,
      query_metadata: {
        query,
        processing_time_ms,
        total_results: results.length,
      },
    };
  }
}

export const searchService = new SearchService();
