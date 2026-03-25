export type MoodValue = 'happy' | 'neutral' | 'sad' | 'frustrated' | 'energized';

export interface WorkEntry {
  id: string;
  date: string;
  content: string;
  createdAt: { seconds: number; nanoseconds: number };
  mood?: MoodValue;
  tags?: string[];
}
