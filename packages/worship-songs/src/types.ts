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
  tags?: string[];
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
  createdBy?: string;
}
