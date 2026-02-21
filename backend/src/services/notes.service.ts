import { notesRepository } from '../repositories/notes.repository';
import { embeddingQueue } from '../queues/embedding.queue';
import { type CreateNote, type UpdateNote } from '../../../shared/schemas/note';
import { NotFoundError } from '../utils/errors';

interface ListNotesOptions {
  page?: number;
  limit?: number;
  tags?: string[];
  is_archived?: boolean;
  sort?: 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

export class NotesService {
  async create(userId: string, input: CreateNote) {
    // Input is already validated by Elysia's body schema
    // Create note object with user_id and defaults
    const note = await notesRepository.create({
      user_id: userId,
      title: input.title,
      content: input.content,
      tags: input.tags || [],
      is_archived: false,
      embedding_status: 'pending',
    });

    if (!note) {
      throw new Error('Failed to create note');
    }

    // Queue embedding asynchronously (non-blocking)
    embeddingQueue.enqueue(note.id);

    return note;
  }

  async getById(noteId: string, userId: string) {
    // Fetch note with ownership check (WHERE id=$1 AND user_id=$2)
    const note = await notesRepository.findByUserAndId(userId, noteId);

    // If not found, throw NotFoundError (covers both "doesn't exist" and "belongs to different user" cases)
    if (!note) {
      throw new NotFoundError('Note');
    }

    return note;
  }

  async update(noteId: string, userId: string, input: UpdateNote) {
    // Fetch current note with ownership check
    const currentNote = await notesRepository.findByUserAndId(userId, noteId);

    // If not found, throw NotFoundError
    if (!currentNote) {
      throw new NotFoundError('Note');
    }

    // Prepare update data
    const updateData: Partial<{
      title: string;
      content: string;
      tags: string[];
      is_archived: boolean;
      embedding_status: 'pending' | 'processing' | 'completed' | 'failed';
      embedding: number[] | null;
    }> = { ...input };

    // Detect content change
    const contentChanged =
      input.content !== undefined && input.content !== currentNote.content;

    if (contentChanged) {
      // Reset embedding status to pending
      updateData.embedding_status = 'pending';
      // Clear embedding vector
      updateData.embedding = null;
    }
    // If content not changed, preserve embedding_status (don't modify)

    // Update note in repository
    const updatedNote = await notesRepository.update(noteId, updateData);

    if (!updatedNote) {
      throw new Error('Failed to update note');
    }

    // If content changed, queue embedding asynchronously
    if (contentChanged) {
      embeddingQueue.enqueue(noteId);
    }

    return updatedNote;
  }

  async delete(noteId: string, userId: string) {
    // Fetch note with ownership check
    const note = await notesRepository.findByUserAndId(userId, noteId);

    // If not found, throw NotFoundError
    if (!note) {
      throw new NotFoundError('Note');
    }

    // Soft delete (set is_archived=true)
    await notesRepository.softDelete(noteId);

    // Return null for consistency
    return null;
  }

  async list(userId: string, options: ListNotesOptions = {}) {
    // Validate and normalize query parameters
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const is_archived = options.is_archived ?? false;
    const sort = options.sort || 'created_at';
    const order = options.order || 'desc';

    // Validate sort field
    if (sort !== 'created_at' && sort !== 'updated_at') {
      throw new Error('Invalid sort field. Must be created_at or updated_at');
    }

    // Validate order
    if (order !== 'asc' && order !== 'desc') {
      throw new Error('Invalid order. Must be asc or desc');
    }

    // Call repository to get paginated results
    const result = await notesRepository.list(userId, {
      page,
      limit,
      tags: options.tags,
      is_archived,
      sort,
      order,
    });

    // Calculate total_pages
    const total_pages = Math.ceil(result.total / limit);

    return {
      notes: result.notes,
      pagination: {
        page,
        limit,
        total: result.total,
        total_pages,
      },
    };
  }
}

export const notesService = new NotesService();
