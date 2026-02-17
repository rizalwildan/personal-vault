import { NoteSchema } from '@/shared/schemas/note';
import type { Note } from '@/shared/schemas/note';

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
// Validate the test object with the shared Zod schema to ensure imports are used.
const validated = NoteSchema.parse(testNote);
console.log('Frontend import test passed', validated.title);
