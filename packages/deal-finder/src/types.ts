export interface Deal {
  id: string;
  title: string;
  url: string;
  source: 'slickdeals' | 'dealnews' | 'reddit';
  price?: string;
  originalPrice?: string;
  store?: string;
  category?: string;
  thumbnail?: string;
  postedAt: string;
  score?: number;
}

export type DealSource = 'all' | 'slickdeals' | 'dealnews' | 'reddit';
export type DealCategory = 'all' | 'electronics' | 'home' | 'fashion' | 'grocery' | 'other';
