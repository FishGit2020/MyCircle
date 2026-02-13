export interface Podcast {
  id: string | number;
  title: string;
  author: string;
  artwork: string;
  description: string;
  feedUrl: string;
  episodeCount: number;
  categories: Record<string, string>;
}

export interface Episode {
  id: string | number;
  title: string;
  description: string;
  datePublished: number;
  duration: number;
  enclosureUrl: string;
  enclosureType: string;
  image: string;
  feedId: string | number;
}

export interface PodcastSearchResult {
  feeds: Podcast[];
  count: number;
}
