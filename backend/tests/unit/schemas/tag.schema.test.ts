import { describe, test, expect } from 'bun:test';
import {
  TagSchema,
  CreateTagSchema,
  UpdateTagSchema,
} from '@/shared/schemas/tag';

describe('TagSchema', () => {
  test('should validate complete tag object', () => {
    const validTag = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Test Tag',
      color: '#FF0000',
      created_at: new Date(),
    };
    expect(() => TagSchema.parse(validTag)).not.toThrow();
  });

  test('should validate tag without color', () => {
    const validTag = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Test Tag',
      created_at: new Date(),
    };
    expect(() => TagSchema.parse(validTag)).not.toThrow();
  });

  test('should reject tag with invalid color format', () => {
    const invalidTag = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Test Tag',
      color: '#GGG', // invalid
      created_at: new Date(),
    };
    expect(() => TagSchema.parse(invalidTag)).toThrow();
  });

  test('should reject tag with name too long', () => {
    const invalidTag = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'a'.repeat(51), // too long
      created_at: new Date(),
    };
    expect(() => TagSchema.parse(invalidTag)).toThrow();
  });
});

describe('CreateTagSchema', () => {
  test('should validate valid create input', () => {
    const validCreate = {
      name: 'New Tag',
      color: '#00FF00',
    };
    expect(() => CreateTagSchema.parse(validCreate)).not.toThrow();
  });

  test('should validate create without color', () => {
    const validCreate = {
      name: 'New Tag',
    };
    expect(() => CreateTagSchema.parse(validCreate)).not.toThrow();
  });

  test('should reject create with missing name', () => {
    const invalidCreate = {
      color: '#00FF00',
    };
    expect(() => CreateTagSchema.parse(invalidCreate)).toThrow();
  });

  test('should reject create with invalid color', () => {
    const invalidCreate = {
      name: 'New Tag',
      color: 'red', // not hex
    };
    expect(() => CreateTagSchema.parse(invalidCreate)).toThrow();
  });
});

describe('UpdateTagSchema', () => {
  test('should allow partial updates', () => {
    const partialUpdate = {
      name: 'Updated Name',
    };
    expect(() => UpdateTagSchema.parse(partialUpdate)).not.toThrow();
  });

  test('should allow empty update', () => {
    const emptyUpdate = {};
    expect(() => UpdateTagSchema.parse(emptyUpdate)).not.toThrow();
  });
});
