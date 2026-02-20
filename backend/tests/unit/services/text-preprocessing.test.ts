import { describe, test, expect } from 'bun:test';
import { preprocessText } from '../../../src/services/embedding.service';

describe('preprocessText', () => {
  test('should remove markdown symbols correctly', () => {
    const input = '# Title with *bold* and _italic_';
    const expected = 'Title with bold and italic';
    expect(preprocessText(input)).toBe(expected);
  });

  test('should extract link text and remove URLs', () => {
    const input = 'See [this guide](https://example.com) for more';
    const expected = 'See this guide for more';
    expect(preprocessText(input)).toBe(expected);
  });

  test('should collapse multiple newlines to single space', () => {
    const input = 'Line 1\n\nLine 2';
    const expected = 'Line 1 Line 2';
    expect(preprocessText(input)).toBe(expected);
  });

  test('should truncate text to 2000 characters', () => {
    const input = 'a'.repeat(3000);
    const result = preprocessText(input);
    expect(result.length).toBe(2000);
    expect(result).toBe('a'.repeat(2000));
  });

  test('should trim leading and trailing whitespace', () => {
    const input = '  leading and trailing spaces  ';
    const expected = 'leading and trailing spaces';
    expect(preprocessText(input)).toBe(expected);
  });

  test('should remove backtick code markers but preserve other characters', () => {
    // Only #*_~` are removed; pipe | is not a listed markdown symbol and is preserved
    const input = 'Some `code` and | table | cells |';
    const expected = 'Some code and | table | cells |';
    expect(preprocessText(input)).toBe(expected);
  });

  test('should handle empty string', () => {
    const input = '';
    const expected = '';
    expect(preprocessText(input)).toBe(expected);
  });

  test('should handle text with only markdown symbols', () => {
    const input = '#*_~`';
    const expected = '';
    expect(preprocessText(input)).toBe(expected);
  });

  test('should handle multiple links', () => {
    const input = '[link1](url1) and [link2](url2)';
    const expected = 'link1 and link2';
    expect(preprocessText(input)).toBe(expected);
  });
});
