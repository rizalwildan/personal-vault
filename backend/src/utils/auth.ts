import { sign, verify } from 'jsonwebtoken';
import crypto from 'node:crypto';

const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not set');
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not set');
  return secret;
};

export interface JWTPayload {
  userId: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10,
  });
}

export async function comparePassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return await Bun.password.verify(plaintext, hash);
}

export async function signAccessToken(userId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    sign(
      { userId, type: 'access' },
      getAccessSecret(),
      { expiresIn: '1h' },
      (err, token) => {
        if (err) reject(err);
        else resolve(token!);
      },
    );
  });
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Add jti (JWT ID) claim for uniqueness - essential for refresh token rotation
    const jti = crypto.randomUUID();
    sign(
      { userId, type: 'refresh', jti },
      getRefreshSecret(),
      { expiresIn: '30d' },
      (err, token) => {
        if (err) reject(err);
        else resolve(token!);
      },
    );
  });
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  return new Promise((resolve, reject) => {
    verify(token, getAccessSecret(), (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded as JWTPayload);
    });
  });
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  return new Promise((resolve, reject) => {
    verify(token, getRefreshSecret(), (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded as JWTPayload);
    });
  });
}
