import { describe, it, expect } from 'vitest';
import { formatFileSize, getFileIcon, isAllowedFileType, isFileTooLarge } from './fileHelpers';

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});

describe('getFileIcon', () => {
  it('returns image for image types', () => {
    expect(getFileIcon('image/jpeg')).toBe('image');
    expect(getFileIcon('image/png')).toBe('image');
  });

  it('returns pdf for pdf', () => {
    expect(getFileIcon('application/pdf')).toBe('pdf');
  });

  it('returns text for text types', () => {
    expect(getFileIcon('text/plain')).toBe('text');
    expect(getFileIcon('text/csv')).toBe('text');
  });

  it('returns doc for Word documents', () => {
    expect(getFileIcon('application/msword')).toBe('doc');
    expect(getFileIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('doc');
  });

  it('returns sheet for Excel documents', () => {
    expect(getFileIcon('application/vnd.ms-excel')).toBe('sheet');
  });

  it('returns file for unknown types', () => {
    expect(getFileIcon('application/octet-stream')).toBe('file');
  });
});

describe('isAllowedFileType', () => {
  it('allows images', () => {
    expect(isAllowedFileType('image/jpeg')).toBe(true);
    expect(isAllowedFileType('image/png')).toBe(true);
  });

  it('allows PDFs', () => {
    expect(isAllowedFileType('application/pdf')).toBe(true);
  });

  it('rejects unknown types', () => {
    expect(isAllowedFileType('application/octet-stream')).toBe(false);
    expect(isAllowedFileType('video/mp4')).toBe(false);
  });
});

describe('isFileTooLarge', () => {
  it('allows files under 5MB', () => {
    expect(isFileTooLarge(1024)).toBe(false);
    expect(isFileTooLarge(4 * 1024 * 1024)).toBe(false);
  });

  it('rejects files over 5MB', () => {
    expect(isFileTooLarge(6 * 1024 * 1024)).toBe(true);
  });
});
