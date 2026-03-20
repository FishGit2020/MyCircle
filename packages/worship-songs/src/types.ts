export type SongFormat = 'chordpro' | 'text';

export interface WorshipSong {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  format: SongFormat;
  content: string;
  notes: string;
  youtubeUrl?: string;
  bpm?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface SetlistEntry {
  songId: string;
  position: number;
  snapshotTitle: string;
  snapshotKey: string;
}

export interface Setlist {
  id: string;
  name: string;
  serviceDate?: string | null;
  entries: SetlistEntry[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface SetlistListItem {
  id: string;
  name: string;
  serviceDate?: string | null;
  entries: SetlistEntry[];
  updatedAt: string;
  createdBy: string;
}

export interface WorshipSongListItem {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  format: SongFormat;
  tags?: string[];
  updatedAt: string;
}
