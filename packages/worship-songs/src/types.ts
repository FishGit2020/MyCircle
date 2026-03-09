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
