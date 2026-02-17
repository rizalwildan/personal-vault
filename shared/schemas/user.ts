import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  avatar_url: z.string().url().optional(),
  terms_accepted_at: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const UserWithPasswordSchema = UserSchema.extend({
  password_hash: z.string(),
});

export type UserWithPassword = z.infer<typeof UserWithPasswordSchema>;

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/\d/, 'Password must contain number'),
  name: z.string().min(1).max(100),
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept terms and conditions' }),
  }),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
