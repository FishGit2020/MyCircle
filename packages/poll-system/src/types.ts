export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  isPublic: boolean;
  expiresAt: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Vote {
  optionId: string;
  votedAt: number;
}

export interface VoteRecord {
  optionId: string;
  votedAt: number;
}

export interface UserVoteMap {
  [pollId: string]: string | undefined;
}
