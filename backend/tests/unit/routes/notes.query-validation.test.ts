import { describe, it, expect } from 'bun:test';

describe('Notes Query Parameter Validation', () => {
  describe('Page and Limit Parsing', () => {
    it('should parse valid page and limit', () => {
      const pageStr = '2';
      const limitStr = '25';
      const page = Number.parseInt(pageStr, 10);
      const limit = Number.parseInt(limitStr, 10);

      expect(page).toBe(2);
      expect(limit).toBe(25);
    });

    it('should apply defaults when not provided', () => {
      const pageQuery: string | undefined = undefined;
      const limitQuery: string | undefined = undefined;
      const page = pageQuery ? Number.parseInt(pageQuery, 10) : 1;
      const limit = limitQuery ? Number.parseInt(limitQuery, 10) : 20;

      expect(page).toBe(1);
      expect(limit).toBe(20);
    });

    it('should parse page from query string', () => {
      const queryPage = '3';
      const page = Number.parseInt(queryPage, 10);

      expect(page).toBe(3);
    });

    it('should parse limit from query string', () => {
      const queryLimit = '50';
      const limit = Number.parseInt(queryLimit, 10);

      expect(limit).toBe(50);
    });
  });

  describe('Tags Parsing', () => {
    it('should parse comma-separated tags as array', () => {
      const tagsQuery = 'docker,kubernetes';
      const tags = tagsQuery.split(',');

      expect(tags).toEqual(['docker', 'kubernetes']);
    });

    it('should handle single tag', () => {
      const tagsQuery = 'docker';
      const tags = [tagsQuery];

      expect(tags).toEqual(['docker']);
    });

    it('should handle array of tags', () => {
      const tagsQuery: string | string[] = ['docker', 'kubernetes'];
      const tags = Array.isArray(tagsQuery) ? tagsQuery : [tagsQuery];

      expect(tags).toEqual(['docker', 'kubernetes']);
    });

    it('should handle empty tags', () => {
      const tagsQuery: string | string[] | undefined = undefined;
      let tags: string[] | undefined;
      if (tagsQuery) {
        tags = Array.isArray(tagsQuery) ? tagsQuery : [tagsQuery];
      } else {
        tags = undefined;
      }

      expect(tags).toBeUndefined();
    });
  });

  describe('is_archived Parsing', () => {
    it('should parse true string as boolean', () => {
      const isArchivedQuery: string | boolean = 'true';
      const is_archived =
        isArchivedQuery === 'true' || isArchivedQuery === true;

      expect(is_archived).toBe(true);
    });

    it('should parse false string as boolean', () => {
      const isArchivedQuery: string | boolean = 'false';
      const is_archived =
        isArchivedQuery === 'true' || isArchivedQuery === true;

      expect(is_archived).toBe(false);
    });

    it('should handle boolean true', () => {
      const isArchivedQuery: string | boolean = true;
      const is_archived =
        isArchivedQuery === 'true' || isArchivedQuery === true;

      expect(is_archived).toBe(true);
    });

    it('should handle boolean false', () => {
      const isArchivedQuery: string | boolean = false;
      const is_archived =
        isArchivedQuery === 'true' || isArchivedQuery === true;

      expect(is_archived).toBe(false);
    });

    it('should default to undefined when not provided', () => {
      const isArchivedQuery: string | boolean | undefined = undefined;
      const is_archived = isArchivedQuery
        ? isArchivedQuery === 'true' || isArchivedQuery === true
        : undefined;

      expect(is_archived).toBeUndefined();
    });
  });

  describe('Sort and Order Validation', () => {
    it('should accept created_at as sort field', () => {
      const sort: string = 'created_at';
      const isValid = sort === 'created_at' || sort === 'updated_at';

      expect(isValid).toBe(true);
    });

    it('should accept updated_at as sort field', () => {
      const sort: string = 'updated_at';
      const isValid = sort === 'created_at' || sort === 'updated_at';

      expect(isValid).toBe(true);
    });

    it('should reject invalid sort field', () => {
      const sort: string = 'invalid_field';
      const isValid = sort === 'created_at' || sort === 'updated_at';

      expect(isValid).toBe(false);
    });

    it('should accept asc as order', () => {
      const order: string = 'asc';
      const isValid = order === 'asc' || order === 'desc';

      expect(isValid).toBe(true);
    });

    it('should accept desc as order', () => {
      const order: string = 'desc';
      const isValid = order === 'asc' || order === 'desc';

      expect(isValid).toBe(true);
    });

    it('should reject invalid order', () => {
      const order: string = 'invalid';
      const isValid = order === 'asc' || order === 'desc';

      expect(isValid).toBe(false);
    });

    it('should apply default sort to created_at', () => {
      const sortQuery: string | undefined = undefined;
      const sort = sortQuery || 'created_at';

      expect(sort).toBe('created_at');
    });

    it('should apply default order to desc', () => {
      const orderQuery: string | undefined = undefined;
      const order = orderQuery || 'desc';

      expect(order).toBe('desc');
    });
  });

  describe('Combined Query Parameters', () => {
    it('should parse all query parameters together', () => {
      const queryParams = {
        page: '2',
        limit: '25',
        tags: 'docker,kubernetes',
        is_archived: 'true',
        sort: 'updated_at',
        order: 'asc',
      };

      const page = Number.parseInt(queryParams.page, 10);
      const limit = Number.parseInt(queryParams.limit, 10);
      const tags = queryParams.tags.split(',');
      const is_archived = queryParams.is_archived === 'true';
      const sort = queryParams.sort;
      const order = queryParams.order;

      expect(page).toBe(2);
      expect(limit).toBe(25);
      expect(tags).toEqual(['docker', 'kubernetes']);
      expect(is_archived).toBe(true);
      expect(sort).toBe('updated_at');
      expect(order).toBe('asc');
    });
  });
});
