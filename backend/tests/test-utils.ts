import { app } from '../src/app';

export const testClient = {
  post: (path: string) => ({
    json: async (data: any) => {
      const response = await app.handle(
        new Request(`http://localhost${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
      );
      return {
        status: response.status,
        json: () => response.json(),
      };
    },
  }),
};
