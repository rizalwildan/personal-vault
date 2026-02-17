import { NoteSchema } from './schemas/note';

const validNote = {
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

const result = NoteSchema.safeParse(validNote);
console.log('Validation result:', result.success);
