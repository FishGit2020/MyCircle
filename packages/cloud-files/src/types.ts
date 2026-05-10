export interface FileItem {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  storagePath: string;
  uploadedAt: string;
  folderId?: string | null;
  nasArchived?: boolean | null;
  nasPath?: string | null;
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

export interface Folder {
  id: string;
  name: string;
  parentFolderId?: string | null;
  createdAt: string;
  depth: number;
}

export interface TargetedSharedFile {
  shareId: string;
  ownerUid: string;
  ownerName: string;
  fileId: string;
  fileName: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  sharedAt: string;
}

export interface ShareRecipient {
  recipientUid: string;
  recipientName: string;
  shareId: string;
  sharedAt: string;
}
