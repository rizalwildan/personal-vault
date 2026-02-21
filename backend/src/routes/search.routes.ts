import { Elysia, t } from 'elysia';
import { searchService } from '../services/search.service';
import { authMiddleware } from '../middleware/auth';

// Type for auth-derived context - only includes fields actually used in this route
type AuthContext = {
  currentUser: {
    id: string;
  };
};

export const searchRoutes = new Elysia({ prefix: '/api/v1/search' }).post(
  '/',
  async (ctx) => {
    // Apply auth middleware
    const authResult = await authMiddleware(ctx);
    if (authResult) {
      // If authResult is returned, it's an error response
      return authResult;
    }

    const { body, set } = ctx;
    const { currentUser } = ctx as typeof ctx & AuthContext;

    try {
      // Validate query is not just whitespace
      const trimmedQuery = body.query.trim();
      if (trimmedQuery.length === 0) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Query cannot be empty or contain only whitespace',
          },
        };
      }

      // Perform semantic search
      const { results, query_metadata } = await searchService.semanticSearch(
        currentUser.id,
        body.query,
        body.limit,
        body.threshold,
        body.tags,
      );

      // Return success response
      set.status = 200;
      return {
        success: true,
        data: {
          results,
          query_metadata,
        },
      };
    } catch (error) {
      // Handle errors
      console.error('Error performing search:', error);
      set.status = 500;
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to perform search',
        },
      };
    }
  },
  {
    body: t.Object({
      query: t.String({ minLength: 1, maxLength: 500 }),
      limit: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 10 })),
      threshold: t.Optional(t.Number({ minimum: 0, maximum: 1, default: 0.7 })),
      tags: t.Optional(t.Array(t.String())),
    }),
    detail: {
      tags: ['search'],
      summary: 'Perform semantic search on notes',
      description:
        'Search notes using semantic similarity with pgvector cosine distance',
    },
  },
);
