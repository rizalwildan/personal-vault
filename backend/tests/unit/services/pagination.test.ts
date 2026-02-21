import { describe, it, expect } from 'bun:test';

describe('Pagination Logic', () => {
  describe('Total Pages Calculation', () => {
    it('should calculate correct total_pages for 45 items with limit 20', () => {
      const total = 45;
      const limit = 20;
      const totalPages = Math.ceil(total / limit);
      expect(totalPages).toBe(3);
    });

    it('should calculate correct total_pages for 50 items with limit 20', () => {
      const total = 50;
      const limit = 20;
      const totalPages = Math.ceil(total / limit);
      expect(totalPages).toBe(3);
    });

    it('should calculate correct total_pages for 60 items with limit 20', () => {
      const total = 60;
      const limit = 20;
      const totalPages = Math.ceil(total / limit);
      expect(totalPages).toBe(3);
    });

    it('should calculate correct total_pages for exact multiple', () => {
      const total = 100;
      const limit = 20;
      const totalPages = Math.ceil(total / limit);
      expect(totalPages).toBe(5);
    });

    it('should return 0 pages when total is 0', () => {
      const total = 0;
      const limit = 20;
      const totalPages = Math.ceil(total / limit);
      expect(totalPages).toBe(0);
    });
  });

  describe('Offset Calculation', () => {
    it('should calculate correct offset for page 1 with limit 20', () => {
      const page = 1;
      const limit = 20;
      const offset = (page - 1) * limit;
      expect(offset).toBe(0);
    });

    it('should calculate correct offset for page 2 with limit 20', () => {
      const page = 2;
      const limit = 20;
      const offset = (page - 1) * limit;
      expect(offset).toBe(20);
    });

    it('should calculate correct offset for page 3 with limit 20', () => {
      const page = 3;
      const limit = 20;
      const offset = (page - 1) * limit;
      expect(offset).toBe(40);
    });

    it('should calculate correct offset for page 5 with limit 10', () => {
      const page = 5;
      const limit = 10;
      const offset = (page - 1) * limit;
      expect(offset).toBe(40);
    });
  });

  describe('Limit Clamping', () => {
    it('should clamp limit to maximum 100 when limit is 150', () => {
      const requestedLimit = 150;
      const maxLimit = 100;
      const limit = Math.min(maxLimit, Math.max(1, requestedLimit));
      expect(limit).toBe(100);
    });

    it('should keep limit as is when limit is 50', () => {
      const requestedLimit = 50;
      const maxLimit = 100;
      const limit = Math.min(maxLimit, Math.max(1, requestedLimit));
      expect(limit).toBe(50);
    });

    it('should clamp limit to minimum 1 when limit is 0', () => {
      const requestedLimit = 0;
      const maxLimit = 100;
      const limit = Math.min(maxLimit, Math.max(1, requestedLimit));
      expect(limit).toBe(1);
    });

    it('should clamp limit to minimum 1 when limit is negative', () => {
      const requestedLimit = -5;
      const maxLimit = 100;
      const limit = Math.min(maxLimit, Math.max(1, requestedLimit));
      expect(limit).toBe(1);
    });
  });

  describe('Page Validation', () => {
    it('should enforce page >= 1 when page is 0', () => {
      const requestedPage = 0;
      const page = Math.max(1, requestedPage);
      expect(page).toBe(1);
    });

    it('should enforce page >= 1 when page is negative', () => {
      const requestedPage = -1;
      const page = Math.max(1, requestedPage);
      expect(page).toBe(1);
    });

    it('should keep page as is when page is valid', () => {
      const requestedPage = 5;
      const page = Math.max(1, requestedPage);
      expect(page).toBe(5);
    });
  });
});
