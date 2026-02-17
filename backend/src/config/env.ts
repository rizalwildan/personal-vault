import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  FRONTEND_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_EXPIRY: z.string().default('1h'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment variables:');
  console.error(result.error.format());
  process.exit(1);
}

export const env = result.data;
export type Env = z.infer<typeof envSchema>;
