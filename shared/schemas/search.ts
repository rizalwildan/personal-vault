import { z } from 'zod';

export const SearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  tags: z.array(z.string()).optional(),
});

// Note object returned in search results (subset of full Note schema)
export const SearchNoteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  created_at: z.date(),
  updated_at: z.date(),
});

export const SearchResultSchema = z.object({
  note: SearchNoteSchema,
  similarity: z.number(),
  rank: z.number().int(),
});

export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  query_metadata: z.object({
    query: z.string(),
    processing_time_ms: z.number(),
    total_results: z.number().int(),
  }),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
