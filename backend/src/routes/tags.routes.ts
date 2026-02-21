import { Elysia, t } from 'elysia';
import { tagsService } from '../services/tags.service';
import { authMiddleware } from '../middleware/auth';
import { NotFoundError, ConflictError } from '../utils/errors';

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

export const tagsRoutes = new Elysia({ prefix: '/api/v1/tags' })
  .get(
    '/',
    async (ctx) => {
      const authResult = await authMiddleware(ctx);
      if (authResult) return authResult;

      const { set } = ctx;
      const { currentUser } = ctx as typeof ctx & AuthContext;

      try {
        const tags = await tagsService.list(currentUser.id);

        set.status = 200;
        return {
          success: true,
          data: {
            tags,
          },
        };
      } catch (error) {
        console.error('Error listing tags:', error);
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to list tags',
          },
        };
      }
    },
    {
      detail: {
        tags: ['tags'],
        summary: 'List user tags',
        description:
          'Returns all tags for the authenticated user, sorted alphabetically with note counts',
      },
    },
  )
  .post(
    '/',
    async (ctx) => {
      const authResult = await authMiddleware(ctx);
      if (authResult) return authResult;

      const { body, set } = ctx;
      const { currentUser } = ctx as typeof ctx & AuthContext;

      try {
        const tag = await tagsService.create(currentUser.id, body);

        set.status = 201;
        return {
          success: true,
          data: tag,
        };
      } catch (error) {
        if (error instanceof ConflictError) {
          set.status = 409;
          return {
            success: false,
            error: {
              code: 'CONFLICT',
              message: error.message,
            },
          };
        }

        console.error('Error creating tag:', error);
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create tag',
          },
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 50 }),
        color: t.Optional(t.String({ pattern: '^#[0-9A-Fa-f]{6}$' })),
      }),
      detail: {
        tags: ['tags'],
        summary: 'Create a new tag',
        description: 'Creates a new tag for the authenticated user',
      },
    },
  )
  .patch(
    '/:id',
    async (ctx) => {
      const authResult = await authMiddleware(ctx);
      if (authResult) return authResult;

      const { params, body, set } = ctx;
      const { currentUser } = ctx as typeof ctx & AuthContext;

      try {
        const tag = await tagsService.update(params.id, currentUser.id, body);

        set.status = 200;
        return {
          success: true,
          data: tag,
        };
      } catch (error) {
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

        if (error instanceof ConflictError) {
          set.status = 409;
          return {
            success: false,
            error: {
              code: 'CONFLICT',
              message: error.message,
            },
          };
        }

        console.error('Error updating tag:', error);
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update tag',
          },
        };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        color: t.Optional(t.String({ pattern: '^#[0-9A-Fa-f]{6}$' })),
      }),
      detail: {
        tags: ['tags'],
        summary: 'Update a tag',
        description:
          'Updates a tag name and/or color for the authenticated user',
      },
    },
  )
  .delete(
    '/:id',
    async (ctx) => {
      const authResult = await authMiddleware(ctx);
      if (authResult) return authResult;

      const { params, set } = ctx;
      const { currentUser } = ctx as typeof ctx & AuthContext;

      try {
        const result = await tagsService.delete(params.id, currentUser.id);

        set.status = 200;
        return {
          success: true,
          data: {
            message: 'Tag deleted',
            notes_updated: result.notes_updated,
          },
        };
      } catch (error) {
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

        console.error('Error deleting tag:', error);
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete tag',
          },
        };
      }
    },
    {
      detail: {
        tags: ['tags'],
        summary: 'Delete a tag',
        description:
          'Deletes a tag and removes it from all notes for the authenticated user',
      },
    },
  );
