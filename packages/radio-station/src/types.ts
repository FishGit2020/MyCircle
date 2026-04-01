export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  country: string;
  language: string;
  codec: string;
  bitrate: number;
  votes: number;
}

export interface RadioTag {
  name: string;
  stationCount: number;
}

export interface RecentlyPlayedEntry {
  stationuuid: string;
  name: string;
  favicon: string;
  country: string;
  url: string;
  url_resolved: string;
  playedAt: number;
}
