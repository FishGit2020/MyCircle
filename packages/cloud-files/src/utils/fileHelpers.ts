
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(contentType: string): string {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType === 'application/pdf') return 'pdf';
  if (contentType.startsWith('text/') || contentType === 'application/json' || contentType === 'application/xml' || contentType === 'text/markdown' || contentType === 'text/html') return 'text';
  // presentation check before doc — presentationml MIME contains "document"
  if (contentType.includes('presentation') || contentType.includes('powerpoint')) return 'presentation';
  if (contentType.includes('word') || contentType.includes('document')) return 'doc';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'sheet';
  if (contentType.includes('zip') || contentType.includes('compressed') || contentType.includes('archive') || contentType.includes('rar') || contentType.includes('7z')) return 'archive';
  return 'file';
}

export function isAllowedFileType(_contentType: string): boolean {
  return true;
}

export function isFileTooLarge(size: number): boolean {
  return size > MAX_FILE_SIZE;
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
