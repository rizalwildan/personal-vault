import { NoteSchema, CreateNoteSchema } from '@/shared/schemas/note';
import type { Note, CreateNote } from '@/shared/schemas/note';

const testNote: Note = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: '123e4567-e89b-12d3-a456-426614174001',
  title: 'Test',
  content: 'Test content',
  embedding_status: 'pending',
  tags: [],
  is_archived: false,
  created_at: new Date(),
  updated_at: new Date(),
};
console.log('Backend import test passed');
