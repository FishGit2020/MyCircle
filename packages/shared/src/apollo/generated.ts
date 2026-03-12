export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: Record<string, unknown>; output: Record<string, unknown>; }
};

export type AiAction = {
  __typename?: 'AiAction';
  payload?: Maybe<Scalars['JSON']['output']>;
  type: Scalars['String']['output'];
};

export type AiChatHistoryInput = {
  content: Scalars['String']['input'];
  role: Scalars['String']['input'];
};

export type AiChatLogEntry = {
  __typename?: 'AiChatLogEntry';
  answerPreview: Scalars['String']['output'];
  endpointId?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  fullAnswer?: Maybe<Scalars['String']['output']>;
  fullQuestion?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  inputTokens: Scalars['Int']['output'];
  latencyMs: Scalars['Int']['output'];
  model: Scalars['String']['output'];
  outputTokens: Scalars['Int']['output'];
  provider: Scalars['String']['output'];
  questionPreview: Scalars['String']['output'];
  status: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  toolCalls: Array<AiToolCallLog>;
};

export type AiChatResponse = {
  __typename?: 'AiChatResponse';
  actions?: Maybe<Array<AiAction>>;
  response: Scalars['String']['output'];
  toolCalls?: Maybe<Array<ToolCallResult>>;
  toolMode?: Maybe<Scalars['String']['output']>;
};

export type AiDailyStats = {
  __typename?: 'AiDailyStats';
  avgLatencyMs: Scalars['Float']['output'];
  calls: Scalars['Int']['output'];
  date: Scalars['String']['output'];
  errors: Scalars['Int']['output'];
  tokens: Scalars['Int']['output'];
};

export type AiToolCallLog = {
  __typename?: 'AiToolCallLog';
  durationMs?: Maybe<Scalars['Int']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type AiUsageSummary = {
  __typename?: 'AiUsageSummary';
  avgLatencyMs: Scalars['Float']['output'];
  dailyBreakdown: Array<AiDailyStats>;
  errorCount: Scalars['Int']['output'];
  errorRate: Scalars['Float']['output'];
  geminiCalls: Scalars['Int']['output'];
  ollamaCalls: Scalars['Int']['output'];
  since: Scalars['String']['output'];
  totalCalls: Scalars['Int']['output'];
  totalInputTokens: Scalars['Int']['output'];
  totalOutputTokens: Scalars['Int']['output'];
};

export type AirQuality = {
  __typename?: 'AirQuality';
  aqi: Scalars['Int']['output'];
  co: Scalars['Float']['output'];
  no: Scalars['Float']['output'];
  no2: Scalars['Float']['output'];
  o3: Scalars['Float']['output'];
  pm2_5: Scalars['Float']['output'];
  pm10: Scalars['Float']['output'];
  so2: Scalars['Float']['output'];
};

export type BabyPhoto = {
  __typename?: 'BabyPhoto';
  caption?: Maybe<Scalars['String']['output']>;
  photoUrl: Scalars['String']['output'];
  stageId: Scalars['Int']['output'];
  uploadedAt: Scalars['String']['output'];
};

export type BenchmarkEndpoint = {
  __typename?: 'BenchmarkEndpoint';
  hasCfAccess: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  source: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type BenchmarkEndpointInput = {
  cfAccessClientId?: InputMaybe<Scalars['String']['input']>;
  cfAccessClientSecret?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  source?: InputMaybe<Scalars['String']['input']>;
  url: Scalars['String']['input'];
};

export type BenchmarkQualityResult = {
  __typename?: 'BenchmarkQualityResult';
  feedback: Scalars['String']['output'];
  judge: Scalars['String']['output'];
  score: Scalars['Float']['output'];
};

export type BenchmarkRun = {
  __typename?: 'BenchmarkRun';
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  results: Array<BenchmarkRunResult>;
  userId: Scalars['String']['output'];
};

export type BenchmarkRunResult = {
  __typename?: 'BenchmarkRunResult';
  endpointId: Scalars['String']['output'];
  endpointName: Scalars['String']['output'];
  error?: Maybe<Scalars['String']['output']>;
  model: Scalars['String']['output'];
  prompt: Scalars['String']['output'];
  qualityFeedback?: Maybe<Scalars['String']['output']>;
  qualityJudge?: Maybe<Scalars['String']['output']>;
  qualityScore?: Maybe<Scalars['Float']['output']>;
  response: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  timing?: Maybe<BenchmarkTimingResult>;
};

export type BenchmarkSummary = {
  __typename?: 'BenchmarkSummary';
  endpointCount: Scalars['Int']['output'];
  fastestEndpoint?: Maybe<Scalars['String']['output']>;
  fastestTps?: Maybe<Scalars['Float']['output']>;
  lastRunAt?: Maybe<Scalars['String']['output']>;
  lastRunId?: Maybe<Scalars['String']['output']>;
};

export type BenchmarkTimingResult = {
  __typename?: 'BenchmarkTimingResult';
  evalCount: Scalars['Int']['output'];
  evalDuration: Scalars['Float']['output'];
  loadDuration: Scalars['Float']['output'];
  promptEvalCount: Scalars['Int']['output'];
  promptEvalDuration: Scalars['Float']['output'];
  promptTokensPerSecond: Scalars['Float']['output'];
  timeToFirstToken: Scalars['Float']['output'];
  tokensPerSecond: Scalars['Float']['output'];
  totalDuration: Scalars['Float']['output'];
};

export type BiblePassage = {
  __typename?: 'BiblePassage';
  copyright?: Maybe<Scalars['String']['output']>;
  reference: Scalars['String']['output'];
  text: Scalars['String']['output'];
  translation?: Maybe<Scalars['String']['output']>;
  verseCount?: Maybe<Scalars['Int']['output']>;
  verses: Array<BibleVerseItem>;
};

export type BibleVerse = {
  __typename?: 'BibleVerse';
  copyright?: Maybe<Scalars['String']['output']>;
  reference: Scalars['String']['output'];
  text: Scalars['String']['output'];
  translation?: Maybe<Scalars['String']['output']>;
};

export type BibleVerseItem = {
  __typename?: 'BibleVerseItem';
  number: Scalars['Int']['output'];
  text: Scalars['String']['output'];
};

export type BibleVersion = {
  __typename?: 'BibleVersion';
  abbreviation: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  title: Scalars['String']['output'];
};

export type Book = {
  __typename?: 'Book';
  audioError?: Maybe<Scalars['String']['output']>;
  audioProgress: Scalars['Int']['output'];
  audioStatus: Scalars['String']['output'];
  author: Scalars['String']['output'];
  chapterCount: Scalars['Int']['output'];
  coverUrl: Scalars['String']['output'];
  description: Scalars['String']['output'];
  epubUrl: Scalars['String']['output'];
  fileSize: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  language: Scalars['String']['output'];
  title: Scalars['String']['output'];
  totalCharacters: Scalars['Int']['output'];
  uploadedAt: Scalars['String']['output'];
  uploadedBy: BookUploader;
};

export type BookChapter = {
  __typename?: 'BookChapter';
  audioDuration?: Maybe<Scalars['Int']['output']>;
  audioUrl?: Maybe<Scalars['String']['output']>;
  characterCount: Scalars['Int']['output'];
  href: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  index: Scalars['Int']['output'];
  title: Scalars['String']['output'];
};

export type BookConversionProgress = {
  __typename?: 'BookConversionProgress';
  audioError?: Maybe<Scalars['String']['output']>;
  audioProgress: Scalars['Int']['output'];
  audioStatus: Scalars['String']['output'];
  canContinue: Scalars['Boolean']['output'];
};

export type BookUploader = {
  __typename?: 'BookUploader';
  displayName: Scalars['String']['output'];
  uid: Scalars['String']['output'];
};

export type CaseStatus = {
  __typename?: 'CaseStatus';
  checkedAt: Scalars['String']['output'];
  formType: Scalars['String']['output'];
  history?: Maybe<Array<CaseStatusHistory>>;
  modifiedDate?: Maybe<Scalars['String']['output']>;
  receiptNumber: Scalars['String']['output'];
  status: Scalars['String']['output'];
  statusDescription: Scalars['String']['output'];
  submittedDate?: Maybe<Scalars['String']['output']>;
};

export type CaseStatusHistory = {
  __typename?: 'CaseStatusHistory';
  date: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type City = {
  __typename?: 'City';
  country: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lat: Scalars['Float']['output'];
  lon: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  state?: Maybe<Scalars['String']['output']>;
};

export type CloudFile = {
  __typename?: 'CloudFile';
  contentType: Scalars['String']['output'];
  downloadUrl: Scalars['String']['output'];
  fileName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  size: Scalars['Int']['output'];
  storagePath: Scalars['String']['output'];
  uploadedAt: Scalars['String']['output'];
};

export type Clouds = {
  __typename?: 'Clouds';
  all: Scalars['Int']['output'];
};

export type CompanyNews = {
  __typename?: 'CompanyNews';
  category: Scalars['String']['output'];
  datetime: Scalars['Int']['output'];
  headline: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  image?: Maybe<Scalars['String']['output']>;
  related?: Maybe<Scalars['String']['output']>;
  source: Scalars['String']['output'];
  summary: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type CryptoPrice = {
  __typename?: 'CryptoPrice';
  current_price: Scalars['Float']['output'];
  id: Scalars['String']['output'];
  image: Scalars['String']['output'];
  market_cap: Scalars['Float']['output'];
  market_cap_rank?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  price_change_percentage_24h?: Maybe<Scalars['Float']['output']>;
  sparkline_7d?: Maybe<Array<Scalars['Float']['output']>>;
  symbol: Scalars['String']['output'];
  total_volume: Scalars['Float']['output'];
};

export type CurrentWeather = {
  __typename?: 'CurrentWeather';
  clouds: Clouds;
  dt: Scalars['Int']['output'];
  feels_like: Scalars['Float']['output'];
  humidity: Scalars['Int']['output'];
  pressure: Scalars['Int']['output'];
  sunrise?: Maybe<Scalars['Int']['output']>;
  sunset?: Maybe<Scalars['Int']['output']>;
  temp: Scalars['Float']['output'];
  temp_max: Scalars['Float']['output'];
  temp_min: Scalars['Float']['output'];
  timezone: Scalars['Int']['output'];
  visibility?: Maybe<Scalars['Int']['output']>;
  weather: Array<WeatherCondition>;
  wind: Wind;
};

export type ForecastDay = {
  __typename?: 'ForecastDay';
  dt: Scalars['Int']['output'];
  humidity: Scalars['Int']['output'];
  pop: Scalars['Float']['output'];
  temp: Temperature;
  weather: Array<WeatherCondition>;
  wind_speed: Scalars['Float']['output'];
};

export type HistoricalWeatherDay = {
  __typename?: 'HistoricalWeatherDay';
  date: Scalars['String']['output'];
  precipitation: Scalars['Float']['output'];
  temp_max: Scalars['Float']['output'];
  temp_min: Scalars['Float']['output'];
  weather_description: Scalars['String']['output'];
  weather_icon: Scalars['String']['output'];
  wind_speed_max: Scalars['Float']['output'];
};

export type HourlyForecast = {
  __typename?: 'HourlyForecast';
  dt: Scalars['Int']['output'];
  pop: Scalars['Float']['output'];
  temp: Scalars['Float']['output'];
  weather: Array<WeatherCondition>;
  wind_speed: Scalars['Float']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addWorshipSong: WorshipSong;
  aiChat: AiChatResponse;
  deleteBabyPhoto: Scalars['Boolean']['output'];
  deleteBenchmarkEndpoint: Scalars['Boolean']['output'];
  deleteBenchmarkRun: Scalars['Boolean']['output'];
  deleteBook: Scalars['Boolean']['output'];
  deleteFile: Scalars['Boolean']['output'];
  deleteSharedFile: Scalars['Boolean']['output'];
  deleteWorshipSong: Scalars['Boolean']['output'];
  permanentDeleteBook: Scalars['Boolean']['output'];
  restoreBook: Scalars['Boolean']['output'];
  runBenchmark: BenchmarkRunResult;
  saveBenchmarkEndpoint: BenchmarkEndpoint;
  saveBenchmarkRun: BenchmarkRun;
  scoreBenchmarkResponse: BenchmarkQualityResult;
  shareFile: ShareFileResult;
  updateWorshipSong: WorshipSong;
};


export type MutationAddWorshipSongArgs = {
  input: WorshipSongInput;
};


export type MutationAiChatArgs = {
  context?: InputMaybe<Scalars['JSON']['input']>;
  endpointId?: InputMaybe<Scalars['ID']['input']>;
  history?: InputMaybe<Array<AiChatHistoryInput>>;
  message: Scalars['String']['input'];
  model?: InputMaybe<Scalars['String']['input']>;
  systemPrompt?: InputMaybe<Scalars['String']['input']>;
  toolMode?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteBabyPhotoArgs = {
  stageId: Scalars['Int']['input'];
};


export type MutationDeleteBenchmarkEndpointArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteBenchmarkRunArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteBookArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFileArgs = {
  fileId: Scalars['ID']['input'];
};


export type MutationDeleteSharedFileArgs = {
  fileId: Scalars['ID']['input'];
};


export type MutationDeleteWorshipSongArgs = {
  id: Scalars['ID']['input'];
};


export type MutationPermanentDeleteBookArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRestoreBookArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRunBenchmarkArgs = {
  endpointId: Scalars['String']['input'];
  model: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
};


export type MutationSaveBenchmarkEndpointArgs = {
  input: BenchmarkEndpointInput;
};


export type MutationSaveBenchmarkRunArgs = {
  results: Scalars['JSON']['input'];
};


export type MutationScoreBenchmarkResponseArgs = {
  judgeEndpointId?: InputMaybe<Scalars['String']['input']>;
  judgeModel?: InputMaybe<Scalars['String']['input']>;
  judgeProvider: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
  response: Scalars['String']['input'];
};


export type MutationShareFileArgs = {
  fileId: Scalars['ID']['input'];
};


export type MutationUpdateWorshipSongArgs = {
  id: Scalars['ID']['input'];
  input: WorshipSongUpdateInput;
};

export type OllamaRunningModel = {
  __typename?: 'OllamaRunningModel';
  expiresAt: Scalars['String']['output'];
  name: Scalars['String']['output'];
  size: Scalars['Float']['output'];
  sizeVram: Scalars['Float']['output'];
};

export type OllamaStatus = {
  __typename?: 'OllamaStatus';
  latencyMs?: Maybe<Scalars['Int']['output']>;
  models: Array<OllamaRunningModel>;
  reachable: Scalars['Boolean']['output'];
};

export type PodcastEpisode = {
  __typename?: 'PodcastEpisode';
  datePublished?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Int']['output']>;
  enclosureUrl?: Maybe<Scalars['String']['output']>;
  feedId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type PodcastEpisodesResponse = {
  __typename?: 'PodcastEpisodesResponse';
  count: Scalars['Int']['output'];
  items: Array<PodcastEpisode>;
};

export type PodcastFeed = {
  __typename?: 'PodcastFeed';
  artwork?: Maybe<Scalars['String']['output']>;
  author?: Maybe<Scalars['String']['output']>;
  categories?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  episodeCount?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  language?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type PodcastSearchResponse = {
  __typename?: 'PodcastSearchResponse';
  count: Scalars['Int']['output'];
  feeds: Array<PodcastFeed>;
};

export type PodcastTrendingResponse = {
  __typename?: 'PodcastTrendingResponse';
  count: Scalars['Int']['output'];
  feeds: Array<PodcastFeed>;
};

export type Query = {
  __typename?: 'Query';
  aiRecentLogs: Array<AiChatLogEntry>;
  aiUsageSummary: AiUsageSummary;
  airQuality?: Maybe<AirQuality>;
  babyPhotos: Array<BabyPhoto>;
  benchmarkEndpointModels: Array<Scalars['String']['output']>;
  benchmarkEndpoints: Array<BenchmarkEndpoint>;
  benchmarkHistory: Array<BenchmarkRun>;
  benchmarkSummary: BenchmarkSummary;
  biblePassage: BiblePassage;
  bibleVersions: Array<BibleVersion>;
  bibleVotd: BibleVerse;
  bibleVotdApi: BibleVerse;
  bookChapters: Array<BookChapter>;
  bookConversionProgress: BookConversionProgress;
  books: Array<Book>;
  checkCaseStatus: CaseStatus;
  cloudFiles: Array<CloudFile>;
  companyNews: Array<CompanyNews>;
  cryptoPrices: Array<CryptoPrice>;
  currentWeather: CurrentWeather;
  forecast: Array<ForecastDay>;
  historicalWeather?: Maybe<HistoricalWeatherDay>;
  hourlyForecast: Array<HourlyForecast>;
  ollamaModels: Array<Scalars['String']['output']>;
  ollamaStatus: OllamaStatus;
  podcastEpisodes: PodcastEpisodesResponse;
  podcastFeed?: Maybe<PodcastFeed>;
  reverseGeocode?: Maybe<City>;
  searchCities: Array<City>;
  searchPodcasts: PodcastSearchResponse;
  searchStocks: Array<StockSearchResult>;
  sharedFiles: Array<SharedFile>;
  stockCandles?: Maybe<StockCandle>;
  stockQuote?: Maybe<StockQuote>;
  trendingPodcasts: PodcastTrendingResponse;
  ttsQuota: TtsQuota;
  weather: WeatherData;
  worshipSong?: Maybe<WorshipSong>;
  worshipSongsList: WorshipSongsPage;
};


export type QueryAiRecentLogsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAiUsageSummaryArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAirQualityArgs = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};


export type QueryBenchmarkEndpointModelsArgs = {
  endpointId: Scalars['ID']['input'];
};


export type QueryBenchmarkHistoryArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryBiblePassageArgs = {
  reference: Scalars['String']['input'];
  translation?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBibleVotdArgs = {
  day: Scalars['Int']['input'];
};


export type QueryBibleVotdApiArgs = {
  day: Scalars['Int']['input'];
};


export type QueryBookChaptersArgs = {
  bookId: Scalars['ID']['input'];
};


export type QueryBookConversionProgressArgs = {
  bookId: Scalars['ID']['input'];
};


export type QueryCheckCaseStatusArgs = {
  receiptNumber: Scalars['String']['input'];
};


export type QueryCompanyNewsArgs = {
  from: Scalars['String']['input'];
  symbol: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryCryptoPricesArgs = {
  ids: Array<Scalars['String']['input']>;
  vsCurrency?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCurrentWeatherArgs = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};


export type QueryForecastArgs = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};


export type QueryHistoricalWeatherArgs = {
  date: Scalars['String']['input'];
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};


export type QueryHourlyForecastArgs = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};


export type QueryPodcastEpisodesArgs = {
  feedId: Scalars['ID']['input'];
};


export type QueryPodcastFeedArgs = {
  feedId: Scalars['ID']['input'];
};


export type QueryReverseGeocodeArgs = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};


export type QuerySearchCitiesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySearchPodcastsArgs = {
  query: Scalars['String']['input'];
};


export type QuerySearchStocksArgs = {
  query: Scalars['String']['input'];
};


export type QueryStockCandlesArgs = {
  from: Scalars['Int']['input'];
  resolution?: InputMaybe<Scalars['String']['input']>;
  symbol: Scalars['String']['input'];
  to: Scalars['Int']['input'];
};


export type QueryStockQuoteArgs = {
  symbol: Scalars['String']['input'];
};


export type QueryWeatherArgs = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};


export type QueryWorshipSongArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorshipSongsListArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type ShareFileResult = {
  __typename?: 'ShareFileResult';
  downloadUrl: Scalars['String']['output'];
  ok: Scalars['Boolean']['output'];
};

export type SharedFile = {
  __typename?: 'SharedFile';
  contentType: Scalars['String']['output'];
  downloadUrl: Scalars['String']['output'];
  fileName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  sharedAt: Scalars['String']['output'];
  sharedByName: Scalars['String']['output'];
  sharedByUid: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  storagePath: Scalars['String']['output'];
};

export type StockCandle = {
  __typename?: 'StockCandle';
  c: Array<Scalars['Float']['output']>;
  h: Array<Scalars['Float']['output']>;
  l: Array<Scalars['Float']['output']>;
  o: Array<Scalars['Float']['output']>;
  s: Scalars['String']['output'];
  t: Array<Scalars['Int']['output']>;
  v: Array<Scalars['Int']['output']>;
};

export type StockQuote = {
  __typename?: 'StockQuote';
  c: Scalars['Float']['output'];
  d: Scalars['Float']['output'];
  dp: Scalars['Float']['output'];
  h: Scalars['Float']['output'];
  l: Scalars['Float']['output'];
  o: Scalars['Float']['output'];
  pc: Scalars['Float']['output'];
  t: Scalars['Int']['output'];
};

export type StockSearchResult = {
  __typename?: 'StockSearchResult';
  description: Scalars['String']['output'];
  displaySymbol: Scalars['String']['output'];
  symbol: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  weatherUpdates: WeatherUpdate;
};


export type SubscriptionWeatherUpdatesArgs = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};

export type Temperature = {
  __typename?: 'Temperature';
  day: Scalars['Float']['output'];
  max: Scalars['Float']['output'];
  min: Scalars['Float']['output'];
  night: Scalars['Float']['output'];
};

export type ToolCallResult = {
  __typename?: 'ToolCallResult';
  args?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  result?: Maybe<Scalars['String']['output']>;
};

export type TtsQuota = {
  __typename?: 'TtsQuota';
  limit: Scalars['Int']['output'];
  remaining: Scalars['Int']['output'];
  used: Scalars['Int']['output'];
};

export type WeatherCondition = {
  __typename?: 'WeatherCondition';
  description: Scalars['String']['output'];
  icon: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  main: Scalars['String']['output'];
};

export type WeatherData = {
  __typename?: 'WeatherData';
  current?: Maybe<CurrentWeather>;
  forecast?: Maybe<Array<ForecastDay>>;
  hourly?: Maybe<Array<HourlyForecast>>;
};

export type WeatherUpdate = {
  __typename?: 'WeatherUpdate';
  current: CurrentWeather;
  lat: Scalars['Float']['output'];
  lon: Scalars['Float']['output'];
  timestamp: Scalars['String']['output'];
};

export type Wind = {
  __typename?: 'Wind';
  deg: Scalars['Int']['output'];
  gust?: Maybe<Scalars['Float']['output']>;
  speed: Scalars['Float']['output'];
};

export type WorshipSong = {
  __typename?: 'WorshipSong';
  artist: Scalars['String']['output'];
  bpm?: Maybe<Scalars['Int']['output']>;
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  createdBy?: Maybe<Scalars['String']['output']>;
  format: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  notes: Scalars['String']['output'];
  originalKey: Scalars['String']['output'];
  tags?: Maybe<Array<Scalars['String']['output']>>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  youtubeUrl?: Maybe<Scalars['String']['output']>;
};

export type WorshipSongInput = {
  artist: Scalars['String']['input'];
  bpm?: InputMaybe<Scalars['Int']['input']>;
  content: Scalars['String']['input'];
  format: Scalars['String']['input'];
  notes: Scalars['String']['input'];
  originalKey: Scalars['String']['input'];
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
  youtubeUrl?: InputMaybe<Scalars['String']['input']>;
};

export type WorshipSongListItem = {
  __typename?: 'WorshipSongListItem';
  artist: Scalars['String']['output'];
  format: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  originalKey: Scalars['String']['output'];
  tags?: Maybe<Array<Scalars['String']['output']>>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type WorshipSongUpdateInput = {
  artist?: InputMaybe<Scalars['String']['input']>;
  bpm?: InputMaybe<Scalars['Int']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  format?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  originalKey?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
  youtubeUrl?: InputMaybe<Scalars['String']['input']>;
};

export type WorshipSongsPage = {
  __typename?: 'WorshipSongsPage';
  allArtists: Array<Scalars['String']['output']>;
  allTags: Array<Scalars['String']['output']>;
  songs: Array<WorshipSongListItem>;
  totalCount: Scalars['Int']['output'];
};

export type WeatherConditionFieldsFragment = { __typename?: 'WeatherCondition', id: number, main: string, description: string, icon: string };

export type GetWeatherQueryVariables = Exact<{
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
}>;


export type GetWeatherQuery = { __typename?: 'Query', weather: { __typename?: 'WeatherData', current?: { __typename?: 'CurrentWeather', temp: number, feels_like: number, temp_min: number, temp_max: number, pressure: number, humidity: number, dt: number, timezone: number, sunrise?: number | null, sunset?: number | null, visibility?: number | null, weather: Array<{ __typename?: 'WeatherCondition', id: number, main: string, description: string, icon: string }>, wind: { __typename?: 'Wind', speed: number, deg: number, gust?: number | null }, clouds: { __typename?: 'Clouds', all: number } } | null, forecast?: Array<{ __typename?: 'ForecastDay', dt: number, humidity: number, wind_speed: number, pop: number, temp: { __typename?: 'Temperature', min: number, max: number, day: number, night: number }, weather: Array<{ __typename?: 'WeatherCondition', id: number, main: string, description: string, icon: string }> }> | null, hourly?: Array<{ __typename?: 'HourlyForecast', dt: number, temp: number, pop: number, wind_speed: number, weather: Array<{ __typename?: 'WeatherCondition', id: number, main: string, description: string, icon: string }> }> | null } };

export type GetAirQualityQueryVariables = Exact<{
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
}>;


export type GetAirQualityQuery = { __typename?: 'Query', airQuality?: { __typename?: 'AirQuality', aqi: number, co: number, no: number, no2: number, o3: number, so2: number, pm2_5: number, pm10: number } | null };

export type GetHistoricalWeatherQueryVariables = Exact<{
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
  date: Scalars['String']['input'];
}>;


export type GetHistoricalWeatherQuery = { __typename?: 'Query', historicalWeather?: { __typename?: 'HistoricalWeatherDay', date: string, temp_max: number, temp_min: number, precipitation: number, wind_speed_max: number, weather_description: string, weather_icon: string } | null };

export type GetCurrentWeatherQueryVariables = Exact<{
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
}>;


export type GetCurrentWeatherQuery = { __typename?: 'Query', currentWeather: { __typename?: 'CurrentWeather', temp: number, feels_like: number, temp_min: number, temp_max: number, pressure: number, humidity: number, dt: number, timezone: number, sunrise?: number | null, sunset?: number | null, visibility?: number | null, weather: Array<{ __typename?: 'WeatherCondition', id: number, main: string, description: string, icon: string }>, wind: { __typename?: 'Wind', speed: number, deg: number, gust?: number | null }, clouds: { __typename?: 'Clouds', all: number } } };

export type GetForecastQueryVariables = Exact<{
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
}>;


export type GetForecastQuery = { __typename?: 'Query', forecast: Array<{ __typename?: 'ForecastDay', dt: number, humidity: number, wind_speed: number, pop: number, temp: { __typename?: 'Temperature', min: number, max: number, day: number, night: number }, weather: Array<{ __typename?: 'WeatherCondition', id: number, main: string, description: string, icon: string }> }> };

export type GetHourlyForecastQueryVariables = Exact<{
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
}>;


export type GetHourlyForecastQuery = { __typename?: 'Query', hourlyForecast: Array<{ __typename?: 'HourlyForecast', dt: number, temp: number, pop: number, wind_speed: number, weather: Array<{ __typename?: 'WeatherCondition', id: number, main: string, description: string, icon: string }> }> };

export type SearchCitiesQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SearchCitiesQuery = { __typename?: 'Query', searchCities: Array<{ __typename?: 'City', id: string, name: string, country: string, state?: string | null, lat: number, lon: number }> };

export type ReverseGeocodeQueryVariables = Exact<{
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
}>;


export type ReverseGeocodeQuery = { __typename?: 'Query', reverseGeocode?: { __typename?: 'City', id: string, name: string, country: string, state?: string | null, lat: number, lon: number } | null };

export type CheckCaseStatusQueryVariables = Exact<{
  receiptNumber: Scalars['String']['input'];
}>;


export type CheckCaseStatusQuery = { __typename?: 'Query', checkCaseStatus: { __typename?: 'CaseStatus', receiptNumber: string, formType: string, status: string, statusDescription: string, checkedAt: string, submittedDate?: string | null, modifiedDate?: string | null, history?: Array<{ __typename?: 'CaseStatusHistory', date: string, status: string }> | null } };

export type SearchStocksQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchStocksQuery = { __typename?: 'Query', searchStocks: Array<{ __typename?: 'StockSearchResult', description: string, displaySymbol: string, symbol: string, type: string }> };

export type GetStockQuoteQueryVariables = Exact<{
  symbol: Scalars['String']['input'];
}>;


export type GetStockQuoteQuery = { __typename?: 'Query', stockQuote?: { __typename?: 'StockQuote', c: number, d: number, dp: number, h: number, l: number, o: number, pc: number, t: number } | null };

export type GetStockCandlesQueryVariables = Exact<{
  symbol: Scalars['String']['input'];
  resolution?: InputMaybe<Scalars['String']['input']>;
  from: Scalars['Int']['input'];
  to: Scalars['Int']['input'];
}>;


export type GetStockCandlesQuery = { __typename?: 'Query', stockCandles?: { __typename?: 'StockCandle', c: Array<number>, h: Array<number>, l: Array<number>, o: Array<number>, t: Array<number>, v: Array<number>, s: string } | null };

export type GetCompanyNewsQueryVariables = Exact<{
  symbol: Scalars['String']['input'];
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
}>;


export type GetCompanyNewsQuery = { __typename?: 'Query', companyNews: Array<{ __typename?: 'CompanyNews', id: number, category: string, datetime: number, headline: string, image?: string | null, source: string, summary: string, url: string }> };

export type GetCryptoPricesQueryVariables = Exact<{
  ids: Array<Scalars['String']['input']> | Scalars['String']['input'];
  vsCurrency?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetCryptoPricesQuery = { __typename?: 'Query', cryptoPrices: Array<{ __typename?: 'CryptoPrice', id: string, symbol: string, name: string, image: string, current_price: number, market_cap: number, market_cap_rank?: number | null, price_change_percentage_24h?: number | null, total_volume: number, sparkline_7d?: Array<number> | null }> };

export type SearchPodcastsQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchPodcastsQuery = { __typename?: 'Query', searchPodcasts: { __typename?: 'PodcastSearchResponse', count: number, feeds: Array<{ __typename?: 'PodcastFeed', id: string, title: string, author?: string | null, artwork?: string | null, description?: string | null, categories?: string | null, episodeCount?: number | null, language?: string | null }> } };

export type GetTrendingPodcastsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTrendingPodcastsQuery = { __typename?: 'Query', trendingPodcasts: { __typename?: 'PodcastTrendingResponse', count: number, feeds: Array<{ __typename?: 'PodcastFeed', id: string, title: string, author?: string | null, artwork?: string | null, description?: string | null, categories?: string | null, episodeCount?: number | null, language?: string | null }> } };

export type GetPodcastEpisodesQueryVariables = Exact<{
  feedId: Scalars['ID']['input'];
}>;


export type GetPodcastEpisodesQuery = { __typename?: 'Query', podcastEpisodes: { __typename?: 'PodcastEpisodesResponse', count: number, items: Array<{ __typename?: 'PodcastEpisode', id: string, title: string, description?: string | null, datePublished?: number | null, duration?: number | null, enclosureUrl?: string | null, image?: string | null, feedId?: string | null }> } };

export type GetPodcastFeedQueryVariables = Exact<{
  feedId: Scalars['ID']['input'];
}>;


export type GetPodcastFeedQuery = { __typename?: 'Query', podcastFeed?: { __typename?: 'PodcastFeed', id: string, title: string, author?: string | null, artwork?: string | null, description?: string | null, categories?: string | null, episodeCount?: number | null, language?: string | null } | null };

export type GetBibleVotdQueryVariables = Exact<{
  day: Scalars['Int']['input'];
}>;


export type GetBibleVotdQuery = { __typename?: 'Query', bibleVotd: { __typename?: 'BibleVerse', text: string, reference: string, translation?: string | null, copyright?: string | null } };

export type GetBibleVotdApiQueryVariables = Exact<{
  day: Scalars['Int']['input'];
}>;


export type GetBibleVotdApiQuery = { __typename?: 'Query', bibleVotdApi: { __typename?: 'BibleVerse', text: string, reference: string, translation?: string | null, copyright?: string | null } };

export type GetBiblePassageQueryVariables = Exact<{
  reference: Scalars['String']['input'];
  translation?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetBiblePassageQuery = { __typename?: 'Query', biblePassage: { __typename?: 'BiblePassage', text: string, reference: string, translation?: string | null, verseCount?: number | null, copyright?: string | null, verses: Array<{ __typename?: 'BibleVerseItem', number: number, text: string }> } };

export type GetBibleVersionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBibleVersionsQuery = { __typename?: 'Query', bibleVersions: Array<{ __typename?: 'BibleVersion', id: number, abbreviation: string, title: string }> };

export type GetOllamaModelsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOllamaModelsQuery = { __typename?: 'Query', ollamaModels: Array<string> };

export type GetAiUsageSummaryQueryVariables = Exact<{
  days?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetAiUsageSummaryQuery = { __typename?: 'Query', aiUsageSummary: { __typename?: 'AiUsageSummary', totalCalls: number, totalInputTokens: number, totalOutputTokens: number, ollamaCalls: number, geminiCalls: number, avgLatencyMs: number, errorCount: number, errorRate: number, since: string, dailyBreakdown: Array<{ __typename?: 'AiDailyStats', date: string, calls: number, avgLatencyMs: number, tokens: number, errors: number }> } };

export type GetOllamaStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOllamaStatusQuery = { __typename?: 'Query', ollamaStatus: { __typename?: 'OllamaStatus', reachable: boolean, latencyMs?: number | null, models: Array<{ __typename?: 'OllamaRunningModel', name: string, size: number, sizeVram: number, expiresAt: string }> } };

export type GetAiRecentLogsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetAiRecentLogsQuery = { __typename?: 'Query', aiRecentLogs: Array<{ __typename?: 'AiChatLogEntry', id: string, timestamp: string, provider: string, model: string, inputTokens: number, outputTokens: number, latencyMs: number, questionPreview: string, answerPreview: string, fullQuestion?: string | null, fullAnswer?: string | null, endpointId?: string | null, status: string, error?: string | null, toolCalls: Array<{ __typename?: 'AiToolCallLog', name: string, durationMs?: number | null, error?: string | null }> }> };

export type AiChatMutationVariables = Exact<{
  message: Scalars['String']['input'];
  history?: InputMaybe<Array<AiChatHistoryInput> | AiChatHistoryInput>;
  context?: InputMaybe<Scalars['JSON']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
  endpointId?: InputMaybe<Scalars['ID']['input']>;
  toolMode?: InputMaybe<Scalars['String']['input']>;
  systemPrompt?: InputMaybe<Scalars['String']['input']>;
}>;


export type AiChatMutation = { __typename?: 'Mutation', aiChat: { __typename?: 'AiChatResponse', response: string, toolMode?: string | null, toolCalls?: Array<{ __typename?: 'ToolCallResult', name: string, args?: Record<string, unknown> | null, result?: string | null }> | null, actions?: Array<{ __typename?: 'AiAction', type: string, payload?: Record<string, unknown> | null }> | null } };

export type GetBenchmarkEndpointModelsQueryVariables = Exact<{
  endpointId: Scalars['ID']['input'];
}>;


export type GetBenchmarkEndpointModelsQuery = { __typename?: 'Query', benchmarkEndpointModels: Array<string> };

export type GetBenchmarkEndpointsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBenchmarkEndpointsQuery = { __typename?: 'Query', benchmarkEndpoints: Array<{ __typename?: 'BenchmarkEndpoint', id: string, url: string, name: string, hasCfAccess: boolean, source: string }> };

export type GetBenchmarkHistoryQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetBenchmarkHistoryQuery = { __typename?: 'Query', benchmarkHistory: Array<{ __typename?: 'BenchmarkRun', id: string, createdAt: string, results: Array<{ __typename?: 'BenchmarkRunResult', endpointId: string, endpointName: string, model: string, prompt: string, response: string, error?: string | null, qualityScore?: number | null, qualityFeedback?: string | null, qualityJudge?: string | null, timing?: { __typename?: 'BenchmarkTimingResult', tokensPerSecond: number, promptTokensPerSecond: number, timeToFirstToken: number, totalDuration: number } | null }> }> };

export type DeleteBenchmarkRunMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteBenchmarkRunMutation = { __typename?: 'Mutation', deleteBenchmarkRun: boolean };

export type GetBenchmarkSummaryQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBenchmarkSummaryQuery = { __typename?: 'Query', benchmarkSummary: { __typename?: 'BenchmarkSummary', lastRunId?: string | null, lastRunAt?: string | null, endpointCount: number, fastestEndpoint?: string | null, fastestTps?: number | null } };

export type RunBenchmarkMutationVariables = Exact<{
  endpointId: Scalars['String']['input'];
  model: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
}>;


export type RunBenchmarkMutation = { __typename?: 'Mutation', runBenchmark: { __typename?: 'BenchmarkRunResult', endpointId: string, endpointName: string, model: string, prompt: string, response: string, error?: string | null, timestamp: string, qualityScore?: number | null, qualityFeedback?: string | null, qualityJudge?: string | null, timing?: { __typename?: 'BenchmarkTimingResult', totalDuration: number, loadDuration: number, promptEvalCount: number, promptEvalDuration: number, evalCount: number, evalDuration: number, tokensPerSecond: number, promptTokensPerSecond: number, timeToFirstToken: number } | null } };

export type SaveBenchmarkEndpointMutationVariables = Exact<{
  input: BenchmarkEndpointInput;
}>;


export type SaveBenchmarkEndpointMutation = { __typename?: 'Mutation', saveBenchmarkEndpoint: { __typename?: 'BenchmarkEndpoint', id: string, url: string, name: string, hasCfAccess: boolean, source: string } };

export type DeleteBenchmarkEndpointMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteBenchmarkEndpointMutation = { __typename?: 'Mutation', deleteBenchmarkEndpoint: boolean };

export type ScoreBenchmarkResponseMutationVariables = Exact<{
  prompt: Scalars['String']['input'];
  response: Scalars['String']['input'];
  judgeProvider: Scalars['String']['input'];
  judgeEndpointId?: InputMaybe<Scalars['String']['input']>;
  judgeModel?: InputMaybe<Scalars['String']['input']>;
}>;


export type ScoreBenchmarkResponseMutation = { __typename?: 'Mutation', scoreBenchmarkResponse: { __typename?: 'BenchmarkQualityResult', score: number, feedback: string, judge: string } };

export type SaveBenchmarkRunMutationVariables = Exact<{
  results: Scalars['JSON']['input'];
}>;


export type SaveBenchmarkRunMutation = { __typename?: 'Mutation', saveBenchmarkRun: { __typename?: 'BenchmarkRun', id: string, createdAt: string } };

export type WorshipSongFieldsFragment = { __typename?: 'WorshipSong', id: string, title: string, artist: string, originalKey: string, format: string, content: string, notes: string, youtubeUrl?: string | null, bpm?: number | null, tags?: Array<string> | null, createdAt: string, updatedAt: string, createdBy?: string | null };

export type WorshipSongListFieldsFragment = { __typename?: 'WorshipSongListItem', id: string, title: string, artist: string, originalKey: string, format: string, tags?: Array<string> | null, updatedAt: string };

export type GetWorshipSongsListQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetWorshipSongsListQuery = { __typename?: 'Query', worshipSongsList: { __typename?: 'WorshipSongsPage', totalCount: number, allArtists: Array<string>, allTags: Array<string>, songs: Array<{ __typename?: 'WorshipSongListItem', id: string, title: string, artist: string, originalKey: string, format: string, tags?: Array<string> | null, updatedAt: string }> } };

export type GetWorshipSongQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetWorshipSongQuery = { __typename?: 'Query', worshipSong?: { __typename?: 'WorshipSong', id: string, title: string, artist: string, originalKey: string, format: string, content: string, notes: string, youtubeUrl?: string | null, bpm?: number | null, tags?: Array<string> | null, createdAt: string, updatedAt: string, createdBy?: string | null } | null };

export type AddWorshipSongMutationVariables = Exact<{
  input: WorshipSongInput;
}>;


export type AddWorshipSongMutation = { __typename?: 'Mutation', addWorshipSong: { __typename?: 'WorshipSong', id: string, title: string, artist: string, originalKey: string, format: string, content: string, notes: string, youtubeUrl?: string | null, bpm?: number | null, tags?: Array<string> | null, createdAt: string, updatedAt: string, createdBy?: string | null } };

export type UpdateWorshipSongMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: WorshipSongUpdateInput;
}>;


export type UpdateWorshipSongMutation = { __typename?: 'Mutation', updateWorshipSong: { __typename?: 'WorshipSong', id: string, title: string, artist: string, originalKey: string, format: string, content: string, notes: string, youtubeUrl?: string | null, bpm?: number | null, tags?: Array<string> | null, createdAt: string, updatedAt: string, createdBy?: string | null } };

export type DeleteWorshipSongMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteWorshipSongMutation = { __typename?: 'Mutation', deleteWorshipSong: boolean };

export type GetCloudFilesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCloudFilesQuery = { __typename?: 'Query', cloudFiles: Array<{ __typename?: 'CloudFile', id: string, fileName: string, contentType: string, size: number, downloadUrl: string, storagePath: string, uploadedAt: string }> };

export type GetSharedFilesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSharedFilesQuery = { __typename?: 'Query', sharedFiles: Array<{ __typename?: 'SharedFile', id: string, fileName: string, contentType: string, size: number, downloadUrl: string, storagePath: string, sharedByUid: string, sharedByName: string, sharedAt: string }> };

export type ShareFileMutationVariables = Exact<{
  fileId: Scalars['ID']['input'];
}>;


export type ShareFileMutation = { __typename?: 'Mutation', shareFile: { __typename?: 'ShareFileResult', ok: boolean, downloadUrl: string } };

export type DeleteFileMutationVariables = Exact<{
  fileId: Scalars['ID']['input'];
}>;


export type DeleteFileMutation = { __typename?: 'Mutation', deleteFile: boolean };

export type DeleteSharedFileMutationVariables = Exact<{
  fileId: Scalars['ID']['input'];
}>;


export type DeleteSharedFileMutation = { __typename?: 'Mutation', deleteSharedFile: boolean };

export type GetBabyPhotosQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBabyPhotosQuery = { __typename?: 'Query', babyPhotos: Array<{ __typename?: 'BabyPhoto', stageId: number, photoUrl: string, caption?: string | null, uploadedAt: string }> };

export type DeleteBabyPhotoMutationVariables = Exact<{
  stageId: Scalars['Int']['input'];
}>;


export type DeleteBabyPhotoMutation = { __typename?: 'Mutation', deleteBabyPhoto: boolean };

export type BookFieldsFragment = { __typename?: 'Book', id: string, title: string, author: string, description: string, language: string, coverUrl: string, epubUrl: string, fileSize: number, chapterCount: number, totalCharacters: number, uploadedAt: string, audioStatus: string, audioProgress: number, audioError?: string | null, uploadedBy: { __typename?: 'BookUploader', uid: string, displayName: string } };

export type GetBooksQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBooksQuery = { __typename?: 'Query', books: Array<{ __typename?: 'Book', id: string, title: string, author: string, description: string, language: string, coverUrl: string, epubUrl: string, fileSize: number, chapterCount: number, totalCharacters: number, uploadedAt: string, audioStatus: string, audioProgress: number, audioError?: string | null, uploadedBy: { __typename?: 'BookUploader', uid: string, displayName: string } }> };

export type GetBookChaptersQueryVariables = Exact<{
  bookId: Scalars['ID']['input'];
}>;


export type GetBookChaptersQuery = { __typename?: 'Query', bookChapters: Array<{ __typename?: 'BookChapter', id: string, index: number, title: string, href: string, characterCount: number, audioUrl?: string | null, audioDuration?: number | null }> };

export type GetBookConversionProgressQueryVariables = Exact<{
  bookId: Scalars['ID']['input'];
}>;


export type GetBookConversionProgressQuery = { __typename?: 'Query', bookConversionProgress: { __typename?: 'BookConversionProgress', audioStatus: string, audioProgress: number, audioError?: string | null, canContinue: boolean } };

export type GetTtsQuotaQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTtsQuotaQuery = { __typename?: 'Query', ttsQuota: { __typename?: 'TtsQuota', used: number, limit: number, remaining: number } };

export type DeleteBookMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteBookMutation = { __typename?: 'Mutation', deleteBook: boolean };

export type RestoreBookMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RestoreBookMutation = { __typename?: 'Mutation', restoreBook: boolean };

export type PermanentDeleteBookMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PermanentDeleteBookMutation = { __typename?: 'Mutation', permanentDeleteBook: boolean };

export type WeatherUpdatesSubscriptionVariables = Exact<{
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
}>;


export type WeatherUpdatesSubscription = { __typename?: 'Subscription', weatherUpdates: { __typename?: 'WeatherUpdate', lat: number, lon: number, timestamp: string, current: { __typename?: 'CurrentWeather', temp: number, feels_like: number, temp_min: number, temp_max: number, pressure: number, humidity: number, dt: number, timezone: number, sunrise?: number | null, sunset?: number | null, visibility?: number | null, weather: Array<{ __typename?: 'WeatherCondition', id: number, main: string, description: string, icon: string }>, wind: { __typename?: 'Wind', speed: number, deg: number, gust?: number | null }, clouds: { __typename?: 'Clouds', all: number } } } };
