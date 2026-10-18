import { describe, expect, it } from 'vitest';
import { formatFileSize, isPreviewableImage, MAX_ATTACHMENT_BYTES } from './attachments';

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('formats kilobytes with one decimal', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  it('treats garbage as empty', () => {
    expect(formatFileSize(-5)).toBe('0 B');
    expect(formatFileSize(NaN)).toBe('0 B');
  });
});

describe('isPreviewableImage', () => {
  it('accepts image types', () => {
    expect(isPreviewableImage('image/png')).toBe(true);
    expect(isPreviewableImage('image/jpeg')).toBe(true);
  });

  it('rejects non-images', () => {
    expect(isPreviewableImage('application/pdf')).toBe(false);
    expect(isPreviewableImage('text/plain')).toBe(false);
    expect(isPreviewableImage('')).toBe(false);
  });
});

describe('MAX_ATTACHMENT_BYTES', () => {
  it('is a sane 10 MB cap', () => {
    expect(MAX_ATTACHMENT_BYTES).toBe(10 * 1024 * 1024);
  });
});
