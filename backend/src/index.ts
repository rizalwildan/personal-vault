import { Elysia } from 'elysia';

const PORT = Number(process.env.PORT) || 8000;

const app = new Elysia().get('/', () => ({
  message: 'BMad Personal Vault API',
}));

app.listen(PORT);

console.log(`🦊 Elysia is running on port ${PORT}`);
