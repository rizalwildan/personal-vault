import { describe, test, expect } from 'bun:test';
import {
  NoteSchema,
  CreateNoteSchema,
  UpdateNoteSchema,
  EmbeddingStatusSchema,
} from '@/shared/schemas/note';

describe('EmbeddingStatusSchema', () => {
  test('should accept valid enum values', () => {
    expect(() => EmbeddingStatusSchema.parse('pending')).not.toThrow();
    expect(() => EmbeddingStatusSchema.parse('processing')).not.toThrow();
    expect(() => EmbeddingStatusSchema.parse('completed')).not.toThrow();
    expect(() => EmbeddingStatusSchema.parse('failed')).not.toThrow();
  });

  test('should reject invalid enum values', () => {
    expect(() => EmbeddingStatusSchema.parse('invalid')).toThrow();
    expect(() => EmbeddingStatusSchema.parse('')).toThrow();
    expect(() => EmbeddingStatusSchema.parse(null)).toThrow();
  });
});

describe('NoteSchema', () => {
  test('should validate complete note object', () => {
    const validNote = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Test Note',
      content: 'Test content',
      embedding_status: 'pending' as const,
      tags: ['tag1', 'tag2'],
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    expect(() => NoteSchema.parse(validNote)).not.toThrow();
  });

  test('should reject note with missing required fields', () => {
    const invalidNote = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      // missing title, content, etc.
    };
    expect(() => NoteSchema.parse(invalidNote)).toThrow();
  });

  test('should reject note with invalid title length', () => {
    const invalidNote = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      title: '', // too short
      content: 'Test content',
      embedding_status: 'pending' as const,
      tags: [],
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    expect(() => NoteSchema.parse(invalidNote)).toThrow();
  });

  test('should reject note with title too long', () => {
    const longTitle = 'a'.repeat(201);
    const invalidNote = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      title: longTitle,
      content: 'Test content',
      embedding_status: 'pending' as const,
      tags: [],
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    expect(() => NoteSchema.parse(invalidNote)).toThrow();
  });
});

describe('CreateNoteSchema', () => {
  test('should validate valid create input', () => {
    const validCreate = {
      title: 'New Note',
      content: 'New content',
      tags: ['tag1'],
    };
    expect(() => CreateNoteSchema.parse(validCreate)).not.toThrow();
  });

  test('should validate create input without tags', () => {
    const validCreate = {
      title: 'New Note',
      content: 'New content',
    };
    expect(() => CreateNoteSchema.parse(validCreate)).not.toThrow();
  });

  test('should reject create with missing title', () => {
    const invalidCreate = {
      content: 'New content',
    };
    expect(() => CreateNoteSchema.parse(invalidCreate)).toThrow();
  });

  test('should reject create with empty content', () => {
    const invalidCreate = {
      title: 'New Note',
      content: '',
    };
    expect(() => CreateNoteSchema.parse(invalidCreate)).toThrow();
  });

  test('should reject create with title too long', () => {
    const invalidCreate = {
      title: 'a'.repeat(201),
      content: 'New content',
    };
    expect(() => CreateNoteSchema.parse(invalidCreate)).toThrow();
  });
});

describe('UpdateNoteSchema', () => {
  test('should allow partial updates', () => {
    const partialUpdate = {
      title: 'Updated Title',
    };
    expect(() => UpdateNoteSchema.parse(partialUpdate)).not.toThrow();
  });

  test('should allow empty update', () => {
    const emptyUpdate = {};
    expect(() => UpdateNoteSchema.parse(emptyUpdate)).not.toThrow();
  });

  test('should validate partial update with valid data', () => {
    const partialUpdate = {
      title: 'Updated',
      content: 'Updated content',
      tags: ['newtag'],
    };
    expect(() => UpdateNoteSchema.parse(partialUpdate)).not.toThrow();
  });
});
