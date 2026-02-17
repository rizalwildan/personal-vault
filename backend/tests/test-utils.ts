// Set test environment variables before importing app
process.env.JWT_ACCESS_SECRET =
  'test-access-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET =
  'test-refresh-secret-key-for-testing-purposes-only';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';
process.env.DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/personal_vault';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
process.env.PORT = '8000';

import { app } from '../src/app';

export const testClient = {
  post: (path: string) => ({
    json: async (data: any, headers?: Record<string, string>) => {
      const response = await app.handle(
        new Request(`http://localhost${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify(data),
        }),
      );
      return {
        status: response.status,
        json: () => response.json(),
      };
    },
  }),
  get: (path: string) => ({
    header: (header: string, value: string) => ({
      json: async () => {
        const response = await app.handle(
          new Request(`http://localhost${path}`, {
            method: 'GET',
            headers: {
              [header]: value,
            },
          }),
        );
        return {
          status: response.status,
          json: () => response.json(),
        };
      },
    }),
    json: async () => {
      const response = await app.handle(
        new Request(`http://localhost${path}`, {
          method: 'GET',
        }),
      );
      return {
        status: response.status,
        json: () => response.json(),
      };
    },
  }),
};
