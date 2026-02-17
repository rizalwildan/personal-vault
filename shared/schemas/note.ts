import { z } from 'zod';

export const EmbeddingStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const NoteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  embedding_status: EmbeddingStatusSchema,
  tags: z.array(z.string()).default([]),
  is_archived: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Note = z.infer<typeof NoteSchema>;

export const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

export const UpdateNoteSchema = CreateNoteSchema.partial();

export type CreateNote = z.infer<typeof CreateNoteSchema>;
export type UpdateNote = z.infer<typeof UpdateNoteSchema>;
export type EmbeddingStatus = z.infer<typeof EmbeddingStatusSchema>;
