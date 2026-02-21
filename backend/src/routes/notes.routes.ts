import { Elysia, t } from 'elysia';
import { notesService } from '../services/notes.service';
import { authMiddleware } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';
import { db } from '../db/client';
import { notes } from '../db/schema';
import { eq } from 'drizzle-orm';
import { embeddingQueue } from '../queues/embedding.queue';

// Type for auth-derived context
type AuthContext = {
  currentUser: {
    id: string;
    email: string;
    name: string;
    password_hash: string;
    avatar_url: string | null;
    terms_accepted_at: Date;
    created_at: Date;
    updated_at: Date;
  };
};

export const notesRoutes = new Elysia({ prefix: '/api/v1/notes' })
  .post(
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
        // Create note via service (validation happens at Elysia schema level)
        const note = await notesService.create(currentUser.id, body);

        // Set response status
        set.status = 201;

        // Return success response
        return {
          success: true,
          data: {
            note,
          },
        };
      } catch (error) {
        // Handle other errors
        console.error('Error creating note:', error);
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create note',
          },
        };
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
        content: t.String({ minLength: 1 }),
        tags: t.Optional(t.Array(t.String())),
      }),
      detail: {
        tags: ['notes'],
        summary: 'Create a new note',
        description: 'Creates a new note for the authenticated user',
      },
    },
  )
  .get(
    '/',
    async (ctx) => {
      // Apply auth middleware
      const authResult = await authMiddleware(ctx);
      if (authResult) {
        // If authResult is returned, it's an error response
        return authResult;
      }
      const { query, set } = ctx;
      const { currentUser } = ctx as typeof ctx & AuthContext;

      try {
        // Parse and validate query parameters
        const page = query.page ? Number.parseInt(String(query.page), 10) : 1;
        const limit = query.limit
          ? Number.parseInt(String(query.limit), 10)
          : 20;

        // Parse tags parameter
        let tags: string[] | undefined;
        if (query.tags) {
          tags = Array.isArray(query.tags) ? query.tags : [query.tags];
        }

        const is_archived =
          query.is_archived === 'true' || query.is_archived === true;
        const sort =
          (query.sort as 'created_at' | 'updated_at') || 'created_at';
        const order = (query.order as 'asc' | 'desc') || 'desc';

        // Validate sort field
        if (sort !== 'created_at' && sort !== 'updated_at') {
          set.status = 400;
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid sort field. Must be created_at or updated_at',
            },
          };
        }

        // Validate order
        if (order !== 'asc' && order !== 'desc') {
          set.status = 400;
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid order. Must be asc or desc',
            },
          };
        }

        // Get notes list via service
        const result = await notesService.list(currentUser.id, {
          page,
          limit,
          tags,
          is_archived,
          sort,
          order,
        });

        // Return success response
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('Error listing notes:', error);
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to list notes',
          },
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
        tags: t.Optional(t.Union([t.String(), t.Array(t.String())])),
        is_archived: t.Optional(t.Union([t.Boolean(), t.String()])),
        sort: t.Optional(t.String()),
        order: t.Optional(t.String()),
      }),
      detail: {
        tags: ['notes'],
        summary: 'List notes',
        description:
          'Retrieves a paginated list of notes for the authenticated user with filtering and sorting options',
      },
    },
  )
  .post(
    '/reindex',
    async (ctx) => {
      const authResult = await authMiddleware(ctx);
      if (authResult) return authResult;

      const { set } = ctx;
      const { currentUser } = ctx as typeof ctx & AuthContext;

      try {
        const userNotes = await db
          .select()
          .from(notes)
          .where(eq(notes.user_id, currentUser.id));

        for (const note of userNotes) {
          await db
            .update(notes)
            .set({ embedding_status: 'pending' })
            .where(eq(notes.id, note.id));

          embeddingQueue.enqueue(note.id);
        }

        set.status = 200;
        return {
          success: true,
          data: {
            message: 'Re-indexing started',
            queued_count: userNotes.length,
          },
        };
      } catch (error) {
        console.error('Error re-indexing notes:', error);
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to start re-indexing',
          },
        };
      }
    },
    {
      detail: {
        tags: ['notes'],
        summary: 'Re-index all notes',
        description: 'Queues all user notes for embedding re-indexing',
      },
    },
  )
  .get(
    '/:id',
    async (ctx) => {
      // Apply auth middleware
      const authResult = await authMiddleware(ctx);
      if (authResult) {
        return authResult;
      }

      const { params, set } = ctx;
      const { currentUser } = ctx as typeof ctx & AuthContext;

      try {
        // Get note by ID via service (ownership enforced at DB level)
        const note = await notesService.getById(params.id, currentUser.id);

        // Return success response
        return {
          success: true,
          data: note,
        };
      } catch (error) {
        // Handle NotFoundError (404)
        if (error instanceof NotFoundError) {
          set.status = 404;
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          };
        }

        // Handle other errors
        console.error('Error getting note:', error);
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to get note',
          },
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['notes'],
        summary: 'Get a single note',
        description: 'Retrieves a single note by ID for the authenticated user',
      },
    },
  )
  .patch(
    '/:id',
    async (ctx) => {
      // Apply auth middleware
      const authResult = await authMiddleware(ctx);
      if (authResult) {
        return authResult;
      }

      const { params, body, set } = ctx;
      const { currentUser } = ctx as typeof ctx & AuthContext;

      try {
        // Update note via service (ownership enforced, content change detection)
        const updatedNote = await notesService.update(
          params.id,
          currentUser.id,
          body,
        );

        // Return success response
        return {
          success: true,
          data: updatedNote,
        };
      } catch (error) {
        // Handle NotFoundError (404)
        if (error instanceof NotFoundError) {
          set.status = 404;
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          };
        }

        // Handle other errors
        console.error('Error updating note:', error);
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update note',
          },
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Partial(
        t.Object({
          title: t.String({ minLength: 1, maxLength: 200 }),
          content: t.String({ minLength: 1 }),
          tags: t.Array(t.String()),
          is_archived: t.Boolean(),
        }),
      ),
      detail: {
        tags: ['notes'],
        summary: 'Update a note',
        description:
          'Updates a note by ID for the authenticated user. Supports partial updates.',
      },
    },
  )
  .delete(
    '/:id',
    async (ctx) => {
      // Apply auth middleware
      const authResult = await authMiddleware(ctx);
      if (authResult) {
        return authResult;
      }

      const { params, set } = ctx;
      const { currentUser } = ctx as typeof ctx & AuthContext;

      try {
        // Delete note via service (soft delete - sets is_archived=true)
        await notesService.delete(params.id, currentUser.id);

        // Return success response with null data
        return {
          success: true,
          data: null,
        };
      } catch (error) {
        // Handle NotFoundError (404)
        if (error instanceof NotFoundError) {
          set.status = 404;
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          };
        }

        // Handle other errors
        console.error('Error deleting note:', error);
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete note',
          },
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['notes'],
        summary: 'Delete a note',
        description:
          'Soft deletes a note by ID for the authenticated user (sets is_archived=true)',
      },
    },
  );
