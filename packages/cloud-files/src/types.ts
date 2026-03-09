export interface FileItem {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  storagePath: string;
  uploadedAt: string;
}

export interface SharedFileItem {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  storagePath: string;
  sharedByUid: string;
  sharedByName: string;
  sharedAt: string;
}
