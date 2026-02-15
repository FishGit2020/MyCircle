export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: { toDate?: () => Date } | Date;
  updatedAt: { toDate?: () => Date } | Date;
}

export interface NoteInput {
  title: string;
  content: string;
}

export interface PublicNote extends Note {
  isPublic: true;
  createdBy: {
    uid: string;
    displayName: string;
  };
}
