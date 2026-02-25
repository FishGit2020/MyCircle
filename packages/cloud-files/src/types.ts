export interface FileItem {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  storagePath: string;
  uploadedAt: { toDate?: () => Date } | Date;
}

export interface SharedFileItem {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  storagePath: string;
  sharedBy: { uid: string; displayName: string };
  sharedAt: { toDate?: () => Date } | Date;
}
