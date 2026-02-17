import { z } from 'zod';

export const SessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  expires_at: z.date(),
  created_at: z.date(),
});

export type Session = z.infer<typeof SessionSchema>;
