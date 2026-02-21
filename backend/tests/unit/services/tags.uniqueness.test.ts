// Set test environment variables before importing
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

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { TagsService } from '../../../src/services/tags.service';
import { tagsRepository } from '../../../src/repositories/tags.repository';
import { ConflictError } from '../../../src/utils/errors';

// Store original methods to restore after each test, preventing mock pollution
const originalMethods = {
  findByName: tagsRepository.findByName.bind(tagsRepository),
  findByUserAndId: tagsRepository.findByUserAndId.bind(tagsRepository),
  create: tagsRepository.create.bind(tagsRepository),
  update: tagsRepository.update.bind(tagsRepository),
};

describe('TagsService - Uniqueness Validation', () => {
  let tagsService: TagsService;
  const mockUserId = 'user-123';

  beforeEach(() => {
    tagsService = new TagsService();
  });

  afterEach(() => {
    // Restore original methods after each test to prevent cross-test mock pollution
    tagsRepository.findByName = originalMethods.findByName;
    tagsRepository.findByUserAndId = originalMethods.findByUserAndId;
    tagsRepository.create = originalMethods.create;
    tagsRepository.update = originalMethods.update;
  });

  test('can create first tag with name', async () => {
    const mockTag = {
      id: 'tag-1',
      user_id: mockUserId,
      name: 'docker',
      color: '#3B82F6',
      created_at: new Date(),
    };

    const findByNameMock = mock(() => Promise.resolve(null));
    const createMock = mock(() => Promise.resolve(mockTag));

    tagsRepository.findByName = findByNameMock as any;
    tagsRepository.create = createMock as any;

    const result = await tagsService.create(mockUserId, {
      name: 'docker',
      color: '#3B82F6',
    });

    expect(findByNameMock).toHaveBeenCalledWith(mockUserId, 'docker');
    expect(createMock).toHaveBeenCalledWith({
      user_id: mockUserId,
      name: 'docker',
      color: '#3B82F6',
    });
    expect(result).toEqual(mockTag);
  });

  test('cannot create duplicate tag name', async () => {
    const existingTag = {
      id: 'tag-1',
      user_id: mockUserId,
      name: 'docker',
      color: '#3B82F6',
      created_at: new Date(),
    };

    const findByNameMock = mock(() => Promise.resolve(existingTag));

    tagsRepository.findByName = findByNameMock as any;

    await expect(
      tagsService.create(mockUserId, { name: 'docker', color: '#FF0000' }),
    ).rejects.toThrow(ConflictError);

    expect(findByNameMock).toHaveBeenCalledWith(mockUserId, 'docker');
  });

  test('same tag name allowed for different users', async () => {
    const mockTag = {
      id: 'tag-2',
      user_id: 'user-456',
      name: 'docker',
      color: '#3B82F6',
      created_at: new Date(),
    };

    const findByNameMock = mock(() => Promise.resolve(null));
    const createMock = mock(() => Promise.resolve(mockTag));

    tagsRepository.findByName = findByNameMock;
    tagsRepository.create = createMock;

    const result = await tagsService.create('user-456', {
      name: 'docker',
      color: '#3B82F6',
    });

    expect(findByNameMock).toHaveBeenCalledWith('user-456', 'docker');
    expect(createMock).toHaveBeenCalled();
    expect(result).toEqual(mockTag);
  });

  test('can rename tag to different name', async () => {
    const existingTag = {
      id: 'tag-1',
      user_id: mockUserId,
      name: 'docker',
      color: '#3B82F6',
      created_at: new Date(),
    };

    const updatedTag = {
      ...existingTag,
      name: 'container',
    };

    const findByUserAndIdMock = mock(() => Promise.resolve(existingTag));
    const findByNameMock = mock(() => Promise.resolve(null));
    const updateMock = mock(() => Promise.resolve(updatedTag));

    tagsRepository.findByUserAndId = findByUserAndIdMock as any;
    tagsRepository.findByName = findByNameMock as any;
    tagsRepository.update = updateMock as any;

    const result = await tagsService.update('tag-1', mockUserId, {
      name: 'container',
    });

    expect(findByUserAndIdMock).toHaveBeenCalledWith(mockUserId, 'tag-1');
    expect(findByNameMock).toHaveBeenCalledWith(mockUserId, 'container');
    expect(updateMock).toHaveBeenCalledWith('tag-1', mockUserId, {
      name: 'container',
    });
    expect(result).toEqual(updatedTag);
  });

  test('cannot rename to duplicate', async () => {
    const existingTag = {
      id: 'tag-1',
      user_id: mockUserId,
      name: 'docker',
      color: '#3B82F6',
      created_at: new Date(),
    };

    const conflictingTag = {
      id: 'tag-2',
      user_id: mockUserId,
      name: 'kubernetes',
      color: '#FF0000',
      created_at: new Date(),
    };

    const findByUserAndIdMock = mock(() => Promise.resolve(existingTag));
    const findByNameMock = mock(() => Promise.resolve(conflictingTag));

    tagsRepository.findByUserAndId = findByUserAndIdMock as any;
    tagsRepository.findByName = findByNameMock as any;

    await expect(
      tagsService.update('tag-1', mockUserId, { name: 'kubernetes' }),
    ).rejects.toThrow(ConflictError);

    expect(findByUserAndIdMock).toHaveBeenCalledWith(mockUserId, 'tag-1');
    expect(findByNameMock).toHaveBeenCalledWith(mockUserId, 'kubernetes');
  });
});
