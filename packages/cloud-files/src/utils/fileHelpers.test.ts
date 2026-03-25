import { describe, it, expect } from 'vitest';
import { formatFileSize, getFileIcon, isAllowedFileType, isFileTooLarge, getFileTypeCategory } from './fileHelpers';


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

  it('returns video for video types', () => {
    expect(getFileIcon('video/mp4')).toBe('video');
    expect(getFileIcon('video/webm')).toBe('video');
  });

  it('returns audio for audio types', () => {
    expect(getFileIcon('audio/mpeg')).toBe('audio');
    expect(getFileIcon('audio/wav')).toBe('audio');
  });

  it('returns presentation for PowerPoint types', () => {
    expect(getFileIcon('application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe('presentation');
    expect(getFileIcon('application/vnd.ms-powerpoint')).toBe('presentation');
  });

  it('returns archive for compressed types', () => {
    expect(getFileIcon('application/zip')).toBe('archive');
    expect(getFileIcon('application/x-compressed')).toBe('archive');
  });

  it('returns file for unknown types', () => {
    expect(getFileIcon('application/octet-stream')).toBe('file');
  });
});

describe('isAllowedFileType', () => {
  it('allows all file types', () => {
    expect(isAllowedFileType('image/jpeg')).toBe(true);
    expect(isAllowedFileType('video/mp4')).toBe(true);
    expect(isAllowedFileType('application/octet-stream')).toBe(true);
    expect(isAllowedFileType('application/zip')).toBe(true);
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

describe('getFileTypeCategory', () => {
  it('returns image for image MIME types', () => {
    expect(getFileTypeCategory('image/jpeg')).toBe('image');
    expect(getFileTypeCategory('image/png')).toBe('image');
    expect(getFileTypeCategory('image/gif')).toBe('image');
    expect(getFileTypeCategory('image/webp')).toBe('image');
  });

  it('returns pdf for application/pdf', () => {
    expect(getFileTypeCategory('application/pdf')).toBe('pdf');
  });

  it('returns doc for Word and Excel types', () => {
    expect(getFileTypeCategory('application/msword')).toBe('doc');
    expect(getFileTypeCategory('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('doc');
    expect(getFileTypeCategory('application/vnd.ms-excel')).toBe('doc');
    expect(getFileTypeCategory('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('doc');
    expect(getFileTypeCategory('text/plain')).toBe('doc');
    expect(getFileTypeCategory('text/csv')).toBe('doc');
  });

  it('returns other for unknown or binary types', () => {
    expect(getFileTypeCategory('application/octet-stream')).toBe('other');
    expect(getFileTypeCategory('video/mp4')).toBe('other');
    expect(getFileTypeCategory('application/zip')).toBe('other');
  });
});
