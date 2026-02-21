import { tagsRepository } from '../repositories/tags.repository';
import { type CreateTag, type UpdateTag } from '../../../shared/schemas/tag';
import { NotFoundError, ConflictError } from '../utils/errors';

export class TagsService {
  async list(userId: string) {
    const tags = await tagsRepository.list(userId);
    return tags;
  }

  async create(userId: string, input: CreateTag) {
    // Check uniqueness
    const existing = await tagsRepository.findByName(userId, input.name);
    if (existing) {
      throw new ConflictError('Tag name already exists');
    }

    const tag = await tagsRepository.create({
      user_id: userId,
      name: input.name,
      color: input.color,
    });

    return tag;
  }

  async update(tagId: string, userId: string, input: UpdateTag) {
    // Fetch existing tag
    const existingTag = await tagsRepository.findByUserAndId(userId, tagId);
    if (!existingTag) {
      throw new NotFoundError('Tag');
    }

    // Check uniqueness if name is being changed
    if (input.name && input.name !== existingTag.name) {
      const existingWithNewName = await tagsRepository.findByName(
        userId,
        input.name,
      );
      if (existingWithNewName) {
        throw new ConflictError('Tag name already exists');
      }
    }

    const updatedTag = await tagsRepository.update(tagId, userId, input);
    return updatedTag;
  }

  async delete(tagId: string, userId: string) {
    // Fetch tag to get name
    const tag = await tagsRepository.findByUserAndId(userId, tagId);
    if (!tag) {
      throw new NotFoundError('Tag');
    }

    const tagName = tag.name;

    // Remove tag from all notes
    const notesUpdated = await tagsRepository.removeTagFromNotes(
      userId,
      tagName,
    );

    // Delete tag
    await tagsRepository.delete(tagId);

    return { notes_updated: notesUpdated };
  }
}

export const tagsService = new TagsService();
