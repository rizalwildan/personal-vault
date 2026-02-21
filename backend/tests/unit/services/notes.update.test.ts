import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { NotesService } from '../../../src/services/notes.service';
import { notesRepository } from '../../../src/repositories/notes.repository';
import { embeddingQueue } from '../../../src/queues/embedding.queue';
import { NotFoundError } from '../../../src/utils/errors';

describe('NotesService - Update Content Change Detection', () => {
  let notesService: NotesService;
  const mockUserId = 'user-123';
  const mockNoteId = 'note-456';

  beforeEach(() => {
    notesService = new NotesService();
  });

  test('Content changed - embedding_status reset to pending', async () => {
    // Mock current note
    const currentNote = {
      id: mockNoteId,
      user_id: mockUserId,
      title: 'Old Title',
      content: 'Old content',
      tags: [],
      is_archived: false,
      embedding_status: 'completed' as const,
      embedding: [0.1, 0.2, 0.3],
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Mock repository methods
    const findByUserAndIdMock = mock(() => Promise.resolve(currentNote));
    const updateMock = mock(() =>
      Promise.resolve({
        ...currentNote,
        content: 'New content',
        embedding_status: 'pending' as const,
        embedding: null,
      }),
    );

    // Mock embeddingQueue.enqueue
    const enqueueMock = mock(() => {});

    // Replace methods
    notesRepository.findByUserAndId = findByUserAndIdMock;
    notesRepository.update = updateMock;
    embeddingQueue.enqueue = enqueueMock;

    // Update content
    await notesService.update(mockNoteId, mockUserId, {
      content: 'New content',
    });

    // Assert update was called with correct data
    expect(updateMock).toHaveBeenCalledTimes(1);
    const updateCall = updateMock.mock.calls[0];
    expect(updateCall[0]).toBe(mockNoteId);
    expect(updateCall[1].content).toBe('New content');
    expect(updateCall[1].embedding_status).toBe('pending');
    expect(updateCall[1].embedding).toBe(null);

    // Assert embedding was queued
    expect(enqueueMock).toHaveBeenCalledTimes(1);
    expect(enqueueMock).toHaveBeenCalledWith(mockNoteId);
  });

  test('Only title changed - embedding_status unchanged', async () => {
    // Mock current note
    const currentNote = {
      id: mockNoteId,
      user_id: mockUserId,
      title: 'Old Title',
      content: 'Same content',
      tags: [],
      is_archived: false,
      embedding_status: 'completed' as const,
      embedding: [0.1, 0.2, 0.3],
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Mock repository methods
    const findByUserAndIdMock = mock(() => Promise.resolve(currentNote));
    const updateMock = mock(() =>
      Promise.resolve({
        ...currentNote,
        title: 'New Title',
      }),
    );

    // Mock embeddingQueue.enqueue
    const enqueueMock = mock(() => {});

    // Replace methods
    notesRepository.findByUserAndId = findByUserAndIdMock;
    notesRepository.update = updateMock;
    embeddingQueue.enqueue = enqueueMock;

    // Update only title
    await notesService.update(mockNoteId, mockUserId, {
      title: 'New Title',
    });

    // Assert update was called without embedding_status change
    expect(updateMock).toHaveBeenCalledTimes(1);
    const updateCall = updateMock.mock.calls[0];
    expect(updateCall[0]).toBe(mockNoteId);
    expect(updateCall[1].title).toBe('New Title');
    expect(updateCall[1].embedding_status).toBeUndefined();
    expect(updateCall[1].embedding).toBeUndefined();

    // Assert embedding was NOT queued
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  test('Tags changed - embedding_status unchanged', async () => {
    // Mock current note
    const currentNote = {
      id: mockNoteId,
      user_id: mockUserId,
      title: 'Title',
      content: 'Content',
      tags: ['oldtag'],
      is_archived: false,
      embedding_status: 'completed' as const,
      embedding: [0.1, 0.2, 0.3],
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Mock repository methods
    const findByUserAndIdMock = mock(() => Promise.resolve(currentNote));
    const updateMock = mock(() =>
      Promise.resolve({
        ...currentNote,
        tags: ['newtag'],
      }),
    );

    // Mock embeddingQueue.enqueue
    const enqueueMock = mock(() => {});

    // Replace methods
    notesRepository.findByUserAndId = findByUserAndIdMock;
    notesRepository.update = updateMock;
    embeddingQueue.enqueue = enqueueMock;

    // Update tags
    await notesService.update(mockNoteId, mockUserId, {
      tags: ['newtag'],
    });

    // Assert update was called without embedding_status change
    expect(updateMock).toHaveBeenCalledTimes(1);
    const updateCall = updateMock.mock.calls[0];
    expect(updateCall[0]).toBe(mockNoteId);
    expect(updateCall[1].tags).toEqual(['newtag']);
    expect(updateCall[1].embedding_status).toBeUndefined();

    // Assert embedding was NOT queued
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  test('Only is_archived changed - embedding_status unchanged', async () => {
    // Mock current note
    const currentNote = {
      id: mockNoteId,
      user_id: mockUserId,
      title: 'Title',
      content: 'Content',
      tags: [],
      is_archived: false,
      embedding_status: 'pending' as const,
      embedding: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Mock repository methods
    const findByUserAndIdMock = mock(() => Promise.resolve(currentNote));
    const updateMock = mock(() =>
      Promise.resolve({
        ...currentNote,
        is_archived: true,
      }),
    );

    // Mock embeddingQueue.enqueue
    const enqueueMock = mock(() => {});

    // Replace methods
    notesRepository.findByUserAndId = findByUserAndIdMock;
    notesRepository.update = updateMock;
    embeddingQueue.enqueue = enqueueMock;

    // Update is_archived
    await notesService.update(mockNoteId, mockUserId, {
      is_archived: true,
    });

    // Assert update was called without embedding_status change
    expect(updateMock).toHaveBeenCalledTimes(1);
    const updateCall = updateMock.mock.calls[0];
    expect(updateCall[0]).toBe(mockNoteId);
    expect(updateCall[1].is_archived).toBe(true);
    expect(updateCall[1].embedding_status).toBeUndefined();

    // Assert embedding was NOT queued
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  test('Partial content update - content changed detected', async () => {
    // Mock current note
    const currentNote = {
      id: mockNoteId,
      user_id: mockUserId,
      title: 'Title',
      content: 'Line 1\nLine 2',
      tags: [],
      is_archived: false,
      embedding_status: 'completed' as const,
      embedding: [0.1, 0.2, 0.3],
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Mock repository methods
    const findByUserAndIdMock = mock(() => Promise.resolve(currentNote));
    const updateMock = mock(() =>
      Promise.resolve({
        ...currentNote,
        content: 'Line 1\nLine 2 MODIFIED',
        embedding_status: 'pending' as const,
        embedding: null,
      }),
    );

    // Mock embeddingQueue.enqueue
    const enqueueMock = mock(() => {});

    // Replace methods
    notesRepository.findByUserAndId = findByUserAndIdMock;
    notesRepository.update = updateMock;
    embeddingQueue.enqueue = enqueueMock;

    // Update content with partial change
    await notesService.update(mockNoteId, mockUserId, {
      content: 'Line 1\nLine 2 MODIFIED',
    });

    // Assert update was called with embedding_status reset
    expect(updateMock).toHaveBeenCalledTimes(1);
    const updateCall = updateMock.mock.calls[0];
    expect(updateCall[0]).toBe(mockNoteId);
    expect(updateCall[1].content).toBe('Line 1\nLine 2 MODIFIED');
    expect(updateCall[1].embedding_status).toBe('pending');
    expect(updateCall[1].embedding).toBe(null);

    // Assert embedding was queued
    expect(enqueueMock).toHaveBeenCalledTimes(1);
    expect(enqueueMock).toHaveBeenCalledWith(mockNoteId);
  });

  test('Note not found - throws NotFoundError', async () => {
    // Mock repository to return null
    const findByUserAndIdMock = mock(() => Promise.resolve(null));

    // Replace method
    notesRepository.findByUserAndId = findByUserAndIdMock;

    // Expect NotFoundError to be thrown
    await expect(
      notesService.update(mockNoteId, mockUserId, {
        title: 'New Title',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
