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

export type BabyInfo = {
  __typename?: 'BabyInfo';
  animal: Scalars['String']['output'];
  currentDay: Scalars['Int']['output'];
  currentWeek: Scalars['Int']['output'];
  dueDate: Scalars['String']['output'];
  fruit: Scalars['String']['output'];
  length: Scalars['String']['output'];
  vegetable: Scalars['String']['output'];
  weeksRemaining: Scalars['Int']['output'];
  weight: Scalars['String']['output'];
};

export type BabyMilestoneNote = {
  __typename?: 'BabyMilestoneNote';
  notes?: Maybe<Scalars['String']['output']>;
  stageId: Scalars['Int']['output'];
};

export type BabyPhoto = {
  __typename?: 'BabyPhoto';
  caption?: Maybe<Scalars['String']['output']>;
  photoId: Scalars['String']['output'];
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
  folderId?: Maybe<Scalars['ID']['output']>;
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

export type ConversionBatchJob = {
  __typename?: 'ConversionBatchJob';
  bookId: Scalars['ID']['output'];
  chapterIndices: Array<Scalars['Int']['output']>;
  completedChapters: Array<Scalars['Int']['output']>;
  createdAt: Scalars['String']['output'];
  currentChapter?: Maybe<Scalars['Int']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  voiceName: Scalars['String']['output'];
};

export type ConversionJob = {
  __typename?: 'ConversionJob';
  bookId: Scalars['ID']['output'];
  chapterIndex: Scalars['Int']['output'];
  createdAt: Scalars['String']['output'];
  error?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  voiceName: Scalars['String']['output'];
};

export type CoordinateInput = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};

export type CrawlJob = {
  __typename?: 'CrawlJob';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  maxDepth: Scalars['Int']['output'];
  maxPages: Scalars['Int']['output'];
  pagesVisited: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type CrawlJobDetail = {
  __typename?: 'CrawlJobDetail';
  documents: Array<CrawledDocument>;
  job: CrawlJob;
  traces: Array<CrawlTrace>;
};

export type CrawlTrace = {
  __typename?: 'CrawlTrace';
  durationMs?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  jobId: Scalars['String']['output'];
  level: Scalars['String']['output'];
  message: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type CrawledDocument = {
  __typename?: 'CrawledDocument';
  author?: Maybe<Scalars['String']['output']>;
  contentPreview?: Maybe<Scalars['String']['output']>;
  contentTruncated?: Maybe<Scalars['Boolean']['output']>;
  contentType?: Maybe<Scalars['String']['output']>;
  crawledAt: Scalars['String']['output'];
  depth: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  fullContent?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  jobId: Scalars['String']['output'];
  ogImage?: Maybe<Scalars['String']['output']>;
  publishDate?: Maybe<Scalars['String']['output']>;
  size: Scalars['Int']['output'];
  statusCode: Scalars['Int']['output'];
  title?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
};

export type CreateInterviewQuestionInput = {
  chapter: Scalars['String']['input'];
  chapterSlug: Scalars['String']['input'];
  description: Scalars['String']['input'];
  difficulty: Scalars['String']['input'];
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
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

export type DailyLogEntry = {
  __typename?: 'DailyLogEntry';
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  date: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['String']['output'];
};

export type DailyLogInput = {
  content: Scalars['String']['input'];
  date?: InputMaybe<Scalars['String']['input']>;
};

export type Deal = {
  __typename?: 'Deal';
  category?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  originalPrice?: Maybe<Scalars['String']['output']>;
  postedAt: Scalars['String']['output'];
  price?: Maybe<Scalars['String']['output']>;
  score?: Maybe<Scalars['Int']['output']>;
  source: Scalars['String']['output'];
  store?: Maybe<Scalars['String']['output']>;
  thumbnail?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type Folder = {
  __typename?: 'Folder';
  createdAt: Scalars['String']['output'];
  depth: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  parentFolderId?: Maybe<Scalars['ID']['output']>;
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

export type GeneratedResumeResult = {
  __typename?: 'GeneratedResumeResult';
  atsScore: ResumeAtsScore;
  contact: ResumeContact;
  education: Array<ResumeEducation>;
  experiences: Array<ResumeExperience>;
  keywordReport: ResumeKeywordReport;
  projects: Array<ResumeProject>;
  skills: Array<Scalars['String']['output']>;
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

export type InterviewQuestion = {
  __typename?: 'InterviewQuestion';
  chapter: Scalars['String']['output'];
  chapterSlug: Scalars['String']['output'];
  description: Scalars['String']['output'];
  difficulty: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  tags: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type InterviewSessionDetail = {
  __typename?: 'InterviewSessionDetail';
  config?: Maybe<Scalars['JSON']['output']>;
  createdAt: Scalars['String']['output'];
  document: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  interviewState?: Maybe<Scalars['JSON']['output']>;
  messages: Array<SessionMessage>;
  question: Scalars['String']['output'];
  scores?: Maybe<Scalars['JSON']['output']>;
  sessionName?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type InterviewSessionSummary = {
  __typename?: 'InterviewSessionSummary';
  createdAt?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  messageCount: Scalars['Int']['output'];
  mode?: Maybe<Scalars['String']['output']>;
  questionPreview: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type LocationSearchResult = {
  __typename?: 'LocationSearchResult';
  displayName: Scalars['String']['output'];
  lat: Scalars['Float']['output'];
  lon: Scalars['Float']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addNote: Note;
  addWorshipSetlist: Setlist;
  addWorshipSong: WorshipSong;
  aiChat: AiChatResponse;
  boostAtsScore: GeneratedResumeResult;
  createDailyLog: DailyLogEntry;
  createFolder: Folder;
  createInterviewQuestion: InterviewQuestion;
  deleteBabyPhoto: Scalars['Boolean']['output'];
  deleteBenchmarkEndpoint: Scalars['Boolean']['output'];
  deleteBenchmarkRun: Scalars['Boolean']['output'];
  deleteBook: Scalars['Boolean']['output'];
  deleteChapterAudio: Scalars['Boolean']['output'];
  deleteCrawlJob: Scalars['Boolean']['output'];
  deleteFile: Scalars['Boolean']['output'];
  deleteFolder: Scalars['Boolean']['output'];
  deleteInterviewQuestion: Scalars['Boolean']['output'];
  deleteInterviewSession: Scalars['Boolean']['output'];
  deleteNote: Scalars['Boolean']['output'];
  deleteResumeApplication: Scalars['Boolean']['output'];
  deleteSharedFile: Scalars['Boolean']['output'];
  deleteWorshipSetlist: Scalars['Boolean']['output'];
  deleteWorshipSong: Scalars['Boolean']['output'];
  generateResume: GeneratedResumeResult;
  moveFile: CloudFile;
  permanentDeleteBook: Scalars['Boolean']['output'];
  previewVoice: Scalars['String']['output'];
  renameFile: CloudFile;
  renameFolder: Folder;
  resetBookConversion: Scalars['Boolean']['output'];
  restoreBook: Scalars['Boolean']['output'];
  revokeFileAccess: Scalars['Boolean']['output'];
  runBenchmark: BenchmarkRunResult;
  saveBabyMilestoneNotes: Scalars['Boolean']['output'];
  saveBenchmarkEndpoint: BenchmarkEndpoint;
  saveBenchmarkRun: BenchmarkRun;
  saveInterviewSession: InterviewSessionDetail;
  saveResumeApplication: ResumeApplication;
  saveResumeFactBank: ResumeFactBank;
  scoreBenchmarkResponse: BenchmarkQualityResult;
  shareFile: ShareFileResult;
  shareFileWith: TargetedShareResult;
  startCrawl: CrawlJob;
  stopCrawl: CrawlJob;
  submitBatchConversion: ConversionBatchJob;
  submitChapterConversions: Array<ConversionJob>;
  submitResumeParse: ResumeParseJob;
  updateInterviewQuestion: InterviewQuestion;
  updateNote: Note;
  updateWorshipSetlist: Setlist;
  updateWorshipSong: WorshipSong;
  uploadBook: Book;
};


export type MutationAddNoteArgs = {
  input: NoteInput;
};


export type MutationAddWorshipSetlistArgs = {
  input: WorshipSetlistInput;
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


export type MutationBoostAtsScoreArgs = {
  endpointId?: InputMaybe<Scalars['ID']['input']>;
  jdText: Scalars['String']['input'];
  model: Scalars['String']['input'];
  resumeJson: Scalars['String']['input'];
};


export type MutationCreateDailyLogArgs = {
  input: DailyLogInput;
};


export type MutationCreateFolderArgs = {
  name: Scalars['String']['input'];
  parentFolderId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationCreateInterviewQuestionArgs = {
  input: CreateInterviewQuestionInput;
};


export type MutationDeleteBabyPhotoArgs = {
  photoId: Scalars['String']['input'];
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


export type MutationDeleteChapterAudioArgs = {
  bookId: Scalars['ID']['input'];
  chapterIndex: Scalars['Int']['input'];
};


export type MutationDeleteCrawlJobArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFileArgs = {
  fileId: Scalars['ID']['input'];
};


export type MutationDeleteFolderArgs = {
  deleteContents: Scalars['Boolean']['input'];
  folderId: Scalars['ID']['input'];
};


export type MutationDeleteInterviewQuestionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteInterviewSessionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteNoteArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteResumeApplicationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSharedFileArgs = {
  fileId: Scalars['ID']['input'];
};


export type MutationDeleteWorshipSetlistArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWorshipSongArgs = {
  id: Scalars['ID']['input'];
};


export type MutationGenerateResumeArgs = {
  endpointId?: InputMaybe<Scalars['ID']['input']>;
  jdText: Scalars['String']['input'];
  model: Scalars['String']['input'];
};


export type MutationMoveFileArgs = {
  fileId: Scalars['ID']['input'];
  targetFolderId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationPermanentDeleteBookArgs = {
  id: Scalars['ID']['input'];
};


export type MutationPreviewVoiceArgs = {
  voiceName: Scalars['String']['input'];
};


export type MutationRenameFileArgs = {
  fileId: Scalars['ID']['input'];
  newName: Scalars['String']['input'];
};


export type MutationRenameFolderArgs = {
  folderId: Scalars['ID']['input'];
  newName: Scalars['String']['input'];
};


export type MutationResetBookConversionArgs = {
  bookId: Scalars['ID']['input'];
};


export type MutationRestoreBookArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRevokeFileAccessArgs = {
  shareId: Scalars['String']['input'];
};


export type MutationRunBenchmarkArgs = {
  endpointId: Scalars['String']['input'];
  model: Scalars['String']['input'];
  prompt: Scalars['String']['input'];
};


export type MutationSaveBabyMilestoneNotesArgs = {
  notes: Scalars['String']['input'];
  stageId: Scalars['Int']['input'];
};


export type MutationSaveBenchmarkEndpointArgs = {
  input: BenchmarkEndpointInput;
};


export type MutationSaveBenchmarkRunArgs = {
  results: Scalars['JSON']['input'];
};


export type MutationSaveInterviewSessionArgs = {
  input: SaveInterviewSessionInput;
};


export type MutationSaveResumeApplicationArgs = {
  input: ResumeApplicationInput;
};


export type MutationSaveResumeFactBankArgs = {
  input: ResumeFactBankInput;
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


export type MutationShareFileWithArgs = {
  fileId: Scalars['ID']['input'];
  recipientEmail: Scalars['String']['input'];
};


export type MutationStartCrawlArgs = {
  input: StartCrawlInput;
};


export type MutationStopCrawlArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSubmitBatchConversionArgs = {
  bookId: Scalars['ID']['input'];
  chapterIndices: Array<Scalars['Int']['input']>;
  voiceName: Scalars['String']['input'];
};


export type MutationSubmitChapterConversionsArgs = {
  bookId: Scalars['ID']['input'];
  chapterIndices: Array<Scalars['Int']['input']>;
  voiceName: Scalars['String']['input'];
};


export type MutationSubmitResumeParseArgs = {
  contentType: Scalars['String']['input'];
  endpointId?: InputMaybe<Scalars['ID']['input']>;
  fileBase64: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  model: Scalars['String']['input'];
};


export type MutationUpdateInterviewQuestionArgs = {
  id: Scalars['ID']['input'];
  input: UpdateInterviewQuestionInput;
};


export type MutationUpdateNoteArgs = {
  id: Scalars['ID']['input'];
  input: NoteUpdateInput;
};


export type MutationUpdateWorshipSetlistArgs = {
  id: Scalars['ID']['input'];
  input: WorshipSetlistUpdateInput;
};


export type MutationUpdateWorshipSongArgs = {
  id: Scalars['ID']['input'];
  input: WorshipSongUpdateInput;
};


export type MutationUploadBookArgs = {
  fileBase64: Scalars['String']['input'];
};

export type Note = {
  __typename?: 'Note';
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type NoteInput = {
  content: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type NoteUpdateInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
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
  babyInfo: BabyInfo;
  babyMilestoneNotes: Array<BabyMilestoneNote>;
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
  calcRoute?: Maybe<RouteResult>;
  calcRouteMulti?: Maybe<RouteResult>;
  checkCaseStatus: CaseStatus;
  cloudFiles: Array<CloudFile>;
  companyNews: Array<CompanyNews>;
  conversionBatchJob?: Maybe<ConversionBatchJob>;
  conversionJobs: Array<ConversionJob>;
  crawlJobDetail?: Maybe<CrawlJobDetail>;
  crawlJobs: Array<CrawlJob>;
  cryptoPrices: Array<CryptoPrice>;
  currentWeather: CurrentWeather;
  deals: Array<Deal>;
  fileShareRecipients: Array<ShareRecipient>;
  filesSharedWithMe: Array<TargetedSharedFile>;
  folders: Array<Folder>;
  forecast: Array<ForecastDay>;
  historicalWeather?: Maybe<HistoricalWeatherDay>;
  hourlyForecast: Array<HourlyForecast>;
  interviewSession?: Maybe<InterviewSessionDetail>;
  interviewSessions: Array<InterviewSessionSummary>;
  locationSearch: Array<LocationSearchResult>;
  notes: Array<Note>;
  ollamaModels: Array<Scalars['String']['output']>;
  ollamaStatus: OllamaStatus;
  podcastEpisodes: PodcastEpisodesResponse;
  podcastFeed?: Maybe<PodcastFeed>;
  questionBank: QuestionBank;
  radioStations: Array<RadioStation>;
  radioStationsByUuids: Array<RadioStation>;
  resumeActiveParseJob?: Maybe<ResumeParseJob>;
  resumeApplications: Array<ResumeApplication>;
  resumeFactBank?: Maybe<ResumeFactBank>;
  resumeParseJob?: Maybe<ResumeParseJob>;
  reverseGeocode?: Maybe<City>;
  scrapeJobUrl?: Maybe<Scalars['String']['output']>;
  searchCities: Array<City>;
  searchCrawlJobs: Array<CrawlJob>;
  searchPodcasts: PodcastSearchResponse;
  searchStocks: Array<StockSearchResult>;
  sharedFiles: Array<SharedFile>;
  stockCandles?: Maybe<StockCandle>;
  stockQuote?: Maybe<StockQuote>;
  transitArrivals: Array<TransitArrival>;
  transitNearbyStops: Array<TransitStop>;
  transitStop?: Maybe<TransitStop>;
  trendingPodcasts: PodcastTrendingResponse;
  ttsQuota: TtsQuota;
  weather: WeatherData;
  worshipSetlist?: Maybe<Setlist>;
  worshipSetlists: Array<Setlist>;
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


export type QueryCalcRouteArgs = {
  endLat: Scalars['Float']['input'];
  endLon: Scalars['Float']['input'];
  startLat: Scalars['Float']['input'];
  startLon: Scalars['Float']['input'];
};


export type QueryCalcRouteMultiArgs = {
  waypoints: Array<CoordinateInput>;
};


export type QueryCheckCaseStatusArgs = {
  receiptNumber: Scalars['String']['input'];
};


export type QueryCompanyNewsArgs = {
  from: Scalars['String']['input'];
  symbol: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryConversionBatchJobArgs = {
  bookId: Scalars['ID']['input'];
};


export type QueryConversionJobsArgs = {
  bookId: Scalars['ID']['input'];
};


export type QueryCrawlJobDetailArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCryptoPricesArgs = {
  ids: Array<Scalars['String']['input']>;
  vsCurrency?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCurrentWeatherArgs = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};


export type QueryFileShareRecipientsArgs = {
  fileId: Scalars['ID']['input'];
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


export type QueryInterviewSessionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryLocationSearchArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QueryNotesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPodcastEpisodesArgs = {
  feedId: Scalars['ID']['input'];
};


export type QueryPodcastFeedArgs = {
  feedId: Scalars['ID']['input'];
};


export type QueryRadioStationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRadioStationsByUuidsArgs = {
  uuids: Array<Scalars['String']['input']>;
};


export type QueryResumeApplicationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryResumeParseJobArgs = {
  id: Scalars['ID']['input'];
};


export type QueryReverseGeocodeArgs = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};


export type QueryScrapeJobUrlArgs = {
  url: Scalars['String']['input'];
};


export type QuerySearchCitiesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySearchCrawlJobsArgs = {
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


export type QueryTransitArrivalsArgs = {
  stopId: Scalars['String']['input'];
};


export type QueryTransitNearbyStopsArgs = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
  radius?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTransitStopArgs = {
  stopId: Scalars['String']['input'];
};


export type QueryWeatherArgs = {
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
};


export type QueryWorshipSetlistArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorshipSongArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorshipSongsListArgs = {
  artist?: InputMaybe<Scalars['String']['input']>;
  favoriteIds?: InputMaybe<Array<Scalars['String']['input']>>;
  format?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  tag?: InputMaybe<Scalars['String']['input']>;
};

export type QuestionBank = {
  __typename?: 'QuestionBank';
  chapters: Array<Scalars['String']['output']>;
  questions: Array<InterviewQuestion>;
};

export type RadioStation = {
  __typename?: 'RadioStation';
  bitrate: Scalars['Int']['output'];
  codec: Scalars['String']['output'];
  country: Scalars['String']['output'];
  favicon: Scalars['String']['output'];
  language: Scalars['String']['output'];
  name: Scalars['String']['output'];
  stationuuid: Scalars['String']['output'];
  tags: Scalars['String']['output'];
  url: Scalars['String']['output'];
  url_resolved: Scalars['String']['output'];
  votes: Scalars['Int']['output'];
};

export type ResumeApplication = {
  __typename?: 'ResumeApplication';
  atsScoreAfter: Scalars['Float']['output'];
  atsScoreBefore: Scalars['Float']['output'];
  company: Scalars['String']['output'];
  date: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  jdText?: Maybe<Scalars['String']['output']>;
  resumeSnapshot: Scalars['String']['output'];
  role: Scalars['String']['output'];
};

export type ResumeApplicationInput = {
  atsScoreAfter: Scalars['Float']['input'];
  atsScoreBefore: Scalars['Float']['input'];
  company: Scalars['String']['input'];
  jdText?: InputMaybe<Scalars['String']['input']>;
  resumeSnapshot: Scalars['String']['input'];
  role: Scalars['String']['input'];
};

export type ResumeAtsScore = {
  __typename?: 'ResumeAtsScore';
  beforeCovered: Array<Scalars['String']['output']>;
  beforeMissing: Array<Scalars['String']['output']>;
  beforeScore: Scalars['Float']['output'];
  covered: Array<Scalars['String']['output']>;
  hardSkillsMissing: Array<Scalars['String']['output']>;
  missing: Array<Scalars['String']['output']>;
  score: Scalars['Float']['output'];
};

export type ResumeContact = {
  __typename?: 'ResumeContact';
  email?: Maybe<Scalars['String']['output']>;
  github?: Maybe<Scalars['String']['output']>;
  linkedin?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  website?: Maybe<Scalars['String']['output']>;
};

export type ResumeContactInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  github?: InputMaybe<Scalars['String']['input']>;
  linkedin?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
};

export type ResumeEducation = {
  __typename?: 'ResumeEducation';
  degree: Scalars['String']['output'];
  endDate?: Maybe<Scalars['String']['output']>;
  field: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  location?: Maybe<Scalars['String']['output']>;
  notes: Array<Scalars['String']['output']>;
  school: Scalars['String']['output'];
  startDate?: Maybe<Scalars['String']['output']>;
};

export type ResumeEducationInput = {
  degree: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['String']['input']>;
  field: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  location?: InputMaybe<Scalars['String']['input']>;
  notes: Array<Scalars['String']['input']>;
  school: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
};

export type ResumeExperience = {
  __typename?: 'ResumeExperience';
  company: Scalars['String']['output'];
  endDate: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  location?: Maybe<Scalars['String']['output']>;
  startDate: Scalars['String']['output'];
  versions: Array<ResumeVersion>;
};

export type ResumeExperienceInput = {
  company: Scalars['String']['input'];
  endDate: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  location?: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['String']['input'];
  versions: Array<ResumeVersionInput>;
};

export type ResumeFactBank = {
  __typename?: 'ResumeFactBank';
  contact: ResumeContact;
  education: Array<ResumeEducation>;
  experiences: Array<ResumeExperience>;
  projects: Array<ResumeProject>;
  skills: Array<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type ResumeFactBankInput = {
  contact: ResumeContactInput;
  education: Array<ResumeEducationInput>;
  experiences: Array<ResumeExperienceInput>;
  projects: Array<ResumeProjectInput>;
  skills: Array<Scalars['String']['input']>;
};

export type ResumeKeywordReport = {
  __typename?: 'ResumeKeywordReport';
  actionKeywords: Array<Scalars['String']['output']>;
  alreadyHave: Array<Scalars['String']['output']>;
  businessContext: Array<Scalars['String']['output']>;
  company?: Maybe<Scalars['String']['output']>;
  domainKeywords: Array<Scalars['String']['output']>;
  hardFilters: Array<Scalars['String']['output']>;
  hardSkills: Array<Scalars['String']['output']>;
  needToAdd: Array<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  titleKeywords: Array<Scalars['String']['output']>;
  top10: Array<Scalars['String']['output']>;
};

export type ResumeParseJob = {
  __typename?: 'ResumeParseJob';
  createdAt: Scalars['String']['output'];
  error?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  result?: Maybe<ResumeFactBank>;
  status: Scalars['String']['output'];
};

export type ResumeProject = {
  __typename?: 'ResumeProject';
  bullets: Array<Scalars['String']['output']>;
  endDate?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  startDate?: Maybe<Scalars['String']['output']>;
};

export type ResumeProjectInput = {
  bullets: Array<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
};

export type ResumeVersion = {
  __typename?: 'ResumeVersion';
  bullets: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
};

export type ResumeVersionInput = {
  bullets: Array<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type RouteResult = {
  __typename?: 'RouteResult';
  coordinates: Array<Array<Scalars['Float']['output']>>;
  distance: Scalars['Float']['output'];
  duration: Scalars['Float']['output'];
};

export type SaveInterviewSessionInput = {
  config?: InputMaybe<Scalars['JSON']['input']>;
  document: Scalars['String']['input'];
  interviewState?: InputMaybe<Scalars['JSON']['input']>;
  messages: Array<SessionMessageInput>;
  question: Scalars['String']['input'];
  scores?: InputMaybe<Scalars['JSON']['input']>;
  sessionId: Scalars['String']['input'];
  sessionName?: InputMaybe<Scalars['String']['input']>;
};

export type SessionMessage = {
  __typename?: 'SessionMessage';
  content: Scalars['String']['output'];
  id: Scalars['String']['output'];
  role: Scalars['String']['output'];
  timestamp: Scalars['Float']['output'];
};

export type SessionMessageInput = {
  content: Scalars['String']['input'];
  id: Scalars['String']['input'];
  role: Scalars['String']['input'];
  timestamp: Scalars['Float']['input'];
};

export type Setlist = {
  __typename?: 'Setlist';
  createdAt: Scalars['String']['output'];
  createdBy: Scalars['String']['output'];
  entries: Array<SetlistEntry>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  serviceDate?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type SetlistEntry = {
  __typename?: 'SetlistEntry';
  position: Scalars['Int']['output'];
  snapshotKey: Scalars['String']['output'];
  snapshotTitle: Scalars['String']['output'];
  songId: Scalars['ID']['output'];
};

export type SetlistEntryInput = {
  position: Scalars['Int']['input'];
  snapshotKey: Scalars['String']['input'];
  snapshotTitle: Scalars['String']['input'];
  songId: Scalars['ID']['input'];
};

export type ShareFileResult = {
  __typename?: 'ShareFileResult';
  downloadUrl: Scalars['String']['output'];
  ok: Scalars['Boolean']['output'];
};

export type ShareRecipient = {
  __typename?: 'ShareRecipient';
  recipientName: Scalars['String']['output'];
  recipientUid: Scalars['String']['output'];
  shareId: Scalars['String']['output'];
  sharedAt: Scalars['String']['output'];
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

export type StartCrawlInput = {
  maxDepth?: InputMaybe<Scalars['Int']['input']>;
  maxPages?: InputMaybe<Scalars['Int']['input']>;
  url: Scalars['String']['input'];
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

export type TargetedShareResult = {
  __typename?: 'TargetedShareResult';
  ok: Scalars['Boolean']['output'];
  shareId: Scalars['String']['output'];
};

export type TargetedSharedFile = {
  __typename?: 'TargetedSharedFile';
  contentType: Scalars['String']['output'];
  downloadUrl: Scalars['String']['output'];
  fileId: Scalars['String']['output'];
  fileName: Scalars['String']['output'];
  ownerName: Scalars['String']['output'];
  ownerUid: Scalars['String']['output'];
  shareId: Scalars['String']['output'];
  sharedAt: Scalars['String']['output'];
  size: Scalars['Int']['output'];
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

export type TransitArrival = {
  __typename?: 'TransitArrival';
  isRealTime: Scalars['Boolean']['output'];
  minutesUntilArrival: Scalars['Int']['output'];
  predictedArrival: Scalars['Float']['output'];
  routeId: Scalars['String']['output'];
  routeShortName: Scalars['String']['output'];
  scheduledArrival: Scalars['Float']['output'];
  status: Scalars['String']['output'];
  tripHeadsign: Scalars['String']['output'];
  vehicleId: Scalars['String']['output'];
};

export type TransitStop = {
  __typename?: 'TransitStop';
  direction: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lat: Scalars['Float']['output'];
  lon: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  routeIds: Array<Scalars['String']['output']>;
};

export type TtsQuota = {
  __typename?: 'TtsQuota';
  limit: Scalars['Int']['output'];
  remaining: Scalars['Int']['output'];
  used: Scalars['Int']['output'];
};

export type UpdateInterviewQuestionInput = {
  chapter?: InputMaybe<Scalars['String']['input']>;
  chapterSlug?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  difficulty?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
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

export type WorshipSetlistInput = {
  entries?: InputMaybe<Array<SetlistEntryInput>>;
  name: Scalars['String']['input'];
  serviceDate?: InputMaybe<Scalars['String']['input']>;
};

export type WorshipSetlistUpdateInput = {
  entries?: InputMaybe<Array<SetlistEntryInput>>;
  name?: InputMaybe<Scalars['String']['input']>;
  serviceDate?: InputMaybe<Scalars['String']['input']>;
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

export type SearchLocationsQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SearchLocationsQuery = { __typename?: 'Query', locationSearch: Array<{ __typename?: 'LocationSearchResult', displayName: string, lat: number, lon: number }> };

export type GetTransitArrivalsQueryVariables = Exact<{
  stopId: Scalars['String']['input'];
}>;


export type GetTransitArrivalsQuery = { __typename?: 'Query', transitArrivals: Array<{ __typename?: 'TransitArrival', routeId: string, routeShortName: string, tripHeadsign: string, scheduledArrival: number, predictedArrival: number, minutesUntilArrival: number, isRealTime: boolean, status: string, vehicleId: string }> };

export type GetTransitStopQueryVariables = Exact<{
  stopId: Scalars['String']['input'];
}>;


export type GetTransitStopQuery = { __typename?: 'Query', transitStop?: { __typename?: 'TransitStop', id: string, name: string, direction: string, lat: number, lon: number, routeIds: Array<string> } | null };

export type GetTransitNearbyStopsQueryVariables = Exact<{
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
  radius?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetTransitNearbyStopsQuery = { __typename?: 'Query', transitNearbyStops: Array<{ __typename?: 'TransitStop', id: string, name: string, direction: string, lat: number, lon: number, routeIds: Array<string> }> };

export type WorshipSongFieldsFragment = { __typename?: 'WorshipSong', id: string, title: string, artist: string, originalKey: string, format: string, content: string, notes: string, youtubeUrl?: string | null, bpm?: number | null, tags?: Array<string> | null, createdAt: string, updatedAt: string, createdBy?: string | null };

export type WorshipSongListFieldsFragment = { __typename?: 'WorshipSongListItem', id: string, title: string, artist: string, originalKey: string, format: string, tags?: Array<string> | null, updatedAt: string };

export type GetWorshipSongsListQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  artist?: InputMaybe<Scalars['String']['input']>;
  tag?: InputMaybe<Scalars['String']['input']>;
  format?: InputMaybe<Scalars['String']['input']>;
  favoriteIds?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
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

export type SetlistEntryFieldsFragment = { __typename?: 'SetlistEntry', songId: string, position: number, snapshotTitle: string, snapshotKey: string };

export type SetlistFieldsFragment = { __typename?: 'Setlist', id: string, name: string, serviceDate?: string | null, createdAt: string, updatedAt: string, createdBy: string, entries: Array<{ __typename?: 'SetlistEntry', songId: string, position: number, snapshotTitle: string, snapshotKey: string }> };

export type GetWorshipSetlistsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetWorshipSetlistsQuery = { __typename?: 'Query', worshipSetlists: Array<{ __typename?: 'Setlist', id: string, name: string, serviceDate?: string | null, updatedAt: string, createdBy: string, entries: Array<{ __typename?: 'SetlistEntry', songId: string, position: number, snapshotTitle: string, snapshotKey: string }> }> };

export type GetWorshipSetlistQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetWorshipSetlistQuery = { __typename?: 'Query', worshipSetlist?: { __typename?: 'Setlist', id: string, name: string, serviceDate?: string | null, createdAt: string, updatedAt: string, createdBy: string, entries: Array<{ __typename?: 'SetlistEntry', songId: string, position: number, snapshotTitle: string, snapshotKey: string }> } | null };

export type AddWorshipSetlistMutationVariables = Exact<{
  input: WorshipSetlistInput;
}>;


export type AddWorshipSetlistMutation = { __typename?: 'Mutation', addWorshipSetlist: { __typename?: 'Setlist', id: string, name: string, serviceDate?: string | null, createdAt: string, updatedAt: string, createdBy: string, entries: Array<{ __typename?: 'SetlistEntry', songId: string, position: number, snapshotTitle: string, snapshotKey: string }> } };

export type UpdateWorshipSetlistMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: WorshipSetlistUpdateInput;
}>;


export type UpdateWorshipSetlistMutation = { __typename?: 'Mutation', updateWorshipSetlist: { __typename?: 'Setlist', id: string, name: string, serviceDate?: string | null, createdAt: string, updatedAt: string, createdBy: string, entries: Array<{ __typename?: 'SetlistEntry', songId: string, position: number, snapshotTitle: string, snapshotKey: string }> } };

export type DeleteWorshipSetlistMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteWorshipSetlistMutation = { __typename?: 'Mutation', deleteWorshipSetlist: boolean };

export type GetCloudFilesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCloudFilesQuery = { __typename?: 'Query', cloudFiles: Array<{ __typename?: 'CloudFile', id: string, fileName: string, contentType: string, size: number, downloadUrl: string, storagePath: string, folderId?: string | null, uploadedAt: string }> };

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

export type GetFoldersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetFoldersQuery = { __typename?: 'Query', folders: Array<{ __typename?: 'Folder', id: string, name: string, parentFolderId?: string | null, createdAt: string, depth: number }> };

export type GetFileShareRecipientsQueryVariables = Exact<{
  fileId: Scalars['ID']['input'];
}>;


export type GetFileShareRecipientsQuery = { __typename?: 'Query', fileShareRecipients: Array<{ __typename?: 'ShareRecipient', recipientUid: string, recipientName: string, shareId: string, sharedAt: string }> };

export type GetFilesSharedWithMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetFilesSharedWithMeQuery = { __typename?: 'Query', filesSharedWithMe: Array<{ __typename?: 'TargetedSharedFile', shareId: string, ownerUid: string, ownerName: string, fileId: string, fileName: string, contentType: string, size: number, downloadUrl: string, sharedAt: string }> };

export type RenameFileMutationVariables = Exact<{
  fileId: Scalars['ID']['input'];
  newName: Scalars['String']['input'];
}>;


export type RenameFileMutation = { __typename?: 'Mutation', renameFile: { __typename?: 'CloudFile', id: string, fileName: string } };

export type CreateFolderMutationVariables = Exact<{
  name: Scalars['String']['input'];
  parentFolderId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type CreateFolderMutation = { __typename?: 'Mutation', createFolder: { __typename?: 'Folder', id: string, name: string, parentFolderId?: string | null, createdAt: string, depth: number } };

export type DeleteFolderMutationVariables = Exact<{
  folderId: Scalars['ID']['input'];
  deleteContents: Scalars['Boolean']['input'];
}>;


export type DeleteFolderMutation = { __typename?: 'Mutation', deleteFolder: boolean };

export type RenameFolderMutationVariables = Exact<{
  folderId: Scalars['ID']['input'];
  newName: Scalars['String']['input'];
}>;


export type RenameFolderMutation = { __typename?: 'Mutation', renameFolder: { __typename?: 'Folder', id: string, name: string } };

export type MoveFileMutationVariables = Exact<{
  fileId: Scalars['ID']['input'];
  targetFolderId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type MoveFileMutation = { __typename?: 'Mutation', moveFile: { __typename?: 'CloudFile', id: string, folderId?: string | null } };

export type ShareFileWithMutationVariables = Exact<{
  fileId: Scalars['ID']['input'];
  recipientEmail: Scalars['String']['input'];
}>;


export type ShareFileWithMutation = { __typename?: 'Mutation', shareFileWith: { __typename?: 'TargetedShareResult', ok: boolean, shareId: string } };

export type RevokeFileAccessMutationVariables = Exact<{
  shareId: Scalars['String']['input'];
}>;


export type RevokeFileAccessMutation = { __typename?: 'Mutation', revokeFileAccess: boolean };

export type GetBabyPhotosQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBabyPhotosQuery = { __typename?: 'Query', babyPhotos: Array<{ __typename?: 'BabyPhoto', stageId: number, photoId: string, photoUrl: string, caption?: string | null, uploadedAt: string }> };

export type DeleteBabyPhotoMutationVariables = Exact<{
  stageId: Scalars['Int']['input'];
  photoId: Scalars['String']['input'];
}>;


export type DeleteBabyPhotoMutation = { __typename?: 'Mutation', deleteBabyPhoto: boolean };

export type GetBabyMilestoneNotesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBabyMilestoneNotesQuery = { __typename?: 'Query', babyMilestoneNotes: Array<{ __typename?: 'BabyMilestoneNote', stageId: number, notes?: string | null }> };

export type SaveBabyMilestoneNotesMutationVariables = Exact<{
  stageId: Scalars['Int']['input'];
  notes: Scalars['String']['input'];
}>;


export type SaveBabyMilestoneNotesMutation = { __typename?: 'Mutation', saveBabyMilestoneNotes: boolean };

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

export type GetConversionJobsQueryVariables = Exact<{
  bookId: Scalars['ID']['input'];
}>;


export type GetConversionJobsQuery = { __typename?: 'Query', conversionJobs: Array<{ __typename?: 'ConversionJob', id: string, bookId: string, chapterIndex: number, voiceName: string, status: string, error?: string | null, createdAt: string }> };

export type SubmitChapterConversionsMutationVariables = Exact<{
  bookId: Scalars['ID']['input'];
  chapterIndices: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
  voiceName: Scalars['String']['input'];
}>;


export type SubmitChapterConversionsMutation = { __typename?: 'Mutation', submitChapterConversions: Array<{ __typename?: 'ConversionJob', id: string, chapterIndex: number, status: string }> };

export type SubmitBatchConversionMutationVariables = Exact<{
  bookId: Scalars['ID']['input'];
  chapterIndices: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
  voiceName: Scalars['String']['input'];
}>;


export type SubmitBatchConversionMutation = { __typename?: 'Mutation', submitBatchConversion: { __typename?: 'ConversionBatchJob', id: string, status: string, chapterIndices: Array<number>, completedChapters: Array<number> } };

export type GetConversionBatchJobQueryVariables = Exact<{
  bookId: Scalars['ID']['input'];
}>;


export type GetConversionBatchJobQuery = { __typename?: 'Query', conversionBatchJob?: { __typename?: 'ConversionBatchJob', id: string, bookId: string, chapterIndices: Array<number>, voiceName: string, status: string, currentChapter?: number | null, completedChapters: Array<number>, error?: string | null, createdAt: string } | null };

export type UploadBookMutationVariables = Exact<{
  fileBase64: Scalars['String']['input'];
}>;


export type UploadBookMutation = { __typename?: 'Mutation', uploadBook: { __typename?: 'Book', id: string, title: string, author: string, description: string, language: string, coverUrl: string, epubUrl: string, fileSize: number, chapterCount: number, totalCharacters: number, audioStatus: string, audioProgress: number, uploadedAt: string, uploadedBy: { __typename?: 'BookUploader', uid: string, displayName: string } } };

export type DeleteChapterAudioMutationVariables = Exact<{
  bookId: Scalars['ID']['input'];
  chapterIndex: Scalars['Int']['input'];
}>;


export type DeleteChapterAudioMutation = { __typename?: 'Mutation', deleteChapterAudio: boolean };

export type ResetBookConversionMutationVariables = Exact<{
  bookId: Scalars['ID']['input'];
}>;


export type ResetBookConversionMutation = { __typename?: 'Mutation', resetBookConversion: boolean };

export type PreviewVoiceMutationVariables = Exact<{
  voiceName: Scalars['String']['input'];
}>;


export type PreviewVoiceMutation = { __typename?: 'Mutation', previewVoice: string };

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

export type GetQuestionBankQueryVariables = Exact<{ [key: string]: never; }>;


export type GetQuestionBankQuery = { __typename?: 'Query', questionBank: { __typename?: 'QuestionBank', chapters: Array<string>, questions: Array<{ __typename?: 'InterviewQuestion', id: string, chapter: string, chapterSlug: string, difficulty: string, title: string, description: string, tags: Array<string> }> } };

export type GetInterviewSessionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetInterviewSessionsQuery = { __typename?: 'Query', interviewSessions: Array<{ __typename?: 'InterviewSessionSummary', id: string, questionPreview: string, messageCount: number, mode?: string | null, updatedAt?: string | null, createdAt?: string | null }> };

export type GetInterviewSessionQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetInterviewSessionQuery = { __typename?: 'Query', interviewSession?: { __typename?: 'InterviewSessionDetail', id: string, question: string, document: string, sessionName?: string | null, interviewState?: Record<string, unknown> | null, scores?: Record<string, unknown> | null, config?: Record<string, unknown> | null, createdAt: string, updatedAt: string, messages: Array<{ __typename?: 'SessionMessage', id: string, role: string, content: string, timestamp: number }> } | null };

export type CreateInterviewQuestionMutationVariables = Exact<{
  input: CreateInterviewQuestionInput;
}>;


export type CreateInterviewQuestionMutation = { __typename?: 'Mutation', createInterviewQuestion: { __typename?: 'InterviewQuestion', id: string, chapter: string, chapterSlug: string, difficulty: string, title: string, description: string, tags: Array<string> } };

export type UpdateInterviewQuestionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateInterviewQuestionInput;
}>;


export type UpdateInterviewQuestionMutation = { __typename?: 'Mutation', updateInterviewQuestion: { __typename?: 'InterviewQuestion', id: string, chapter: string, chapterSlug: string, difficulty: string, title: string, description: string, tags: Array<string> } };

export type DeleteInterviewQuestionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteInterviewQuestionMutation = { __typename?: 'Mutation', deleteInterviewQuestion: boolean };

export type SaveInterviewSessionMutationVariables = Exact<{
  input: SaveInterviewSessionInput;
}>;


export type SaveInterviewSessionMutation = { __typename?: 'Mutation', saveInterviewSession: { __typename?: 'InterviewSessionDetail', id: string, createdAt: string, updatedAt: string } };

export type DeleteInterviewSessionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteInterviewSessionMutation = { __typename?: 'Mutation', deleteInterviewSession: boolean };

export type WeatherUpdatesSubscriptionVariables = Exact<{
  lat: Scalars['Float']['input'];
  lon: Scalars['Float']['input'];
}>;


export type WeatherUpdatesSubscription = { __typename?: 'Subscription', weatherUpdates: { __typename?: 'WeatherUpdate', lat: number, lon: number, timestamp: string, current: { __typename?: 'CurrentWeather', temp: number, feels_like: number, temp_min: number, temp_max: number, pressure: number, humidity: number, dt: number, timezone: number, sunrise?: number | null, sunset?: number | null, visibility?: number | null, weather: Array<{ __typename?: 'WeatherCondition', id: number, main: string, description: string, icon: string }>, wind: { __typename?: 'Wind', speed: number, deg: number, gust?: number | null }, clouds: { __typename?: 'Clouds', all: number } } } };

export type GetCrawlJobsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCrawlJobsQuery = { __typename?: 'Query', crawlJobs: Array<{ __typename?: 'CrawlJob', id: string, url: string, status: string, maxDepth: number, maxPages: number, pagesVisited: number, createdAt: string, updatedAt: string }> };

export type GetCrawlJobDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetCrawlJobDetailQuery = { __typename?: 'Query', crawlJobDetail?: { __typename?: 'CrawlJobDetail', job: { __typename?: 'CrawlJob', id: string, url: string, status: string, maxDepth: number, maxPages: number, pagesVisited: number, createdAt: string, updatedAt: string }, documents: Array<{ __typename?: 'CrawledDocument', id: string, jobId: string, url: string, title?: string | null, contentPreview?: string | null, fullContent?: string | null, contentTruncated?: boolean | null, description?: string | null, author?: string | null, publishDate?: string | null, ogImage?: string | null, statusCode: number, contentType?: string | null, crawledAt: string, size: number, depth: number }>, traces: Array<{ __typename?: 'CrawlTrace', id: string, jobId: string, timestamp: string, level: string, message: string, url?: string | null, durationMs?: number | null }> } | null };

export type StartCrawlMutationVariables = Exact<{
  input: StartCrawlInput;
}>;


export type StartCrawlMutation = { __typename?: 'Mutation', startCrawl: { __typename?: 'CrawlJob', id: string, url: string, status: string, maxDepth: number, maxPages: number, pagesVisited: number, createdAt: string, updatedAt: string } };

export type StopCrawlMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type StopCrawlMutation = { __typename?: 'Mutation', stopCrawl: { __typename?: 'CrawlJob', id: string, url: string, status: string, maxDepth: number, maxPages: number, pagesVisited: number, createdAt: string, updatedAt: string } };

export type DeleteCrawlJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteCrawlJobMutation = { __typename?: 'Mutation', deleteCrawlJob: boolean };

export type SearchCrawlJobsQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchCrawlJobsQuery = { __typename?: 'Query', searchCrawlJobs: Array<{ __typename?: 'CrawlJob', id: string, url: string, status: string, maxDepth: number, maxPages: number, pagesVisited: number, createdAt: string, updatedAt: string }> };

export type GetDealsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDealsQuery = { __typename?: 'Query', deals: Array<{ __typename?: 'Deal', id: string, title: string, url: string, source: string, price?: string | null, originalPrice?: string | null, store?: string | null, category?: string | null, thumbnail?: string | null, postedAt: string, score?: number | null }> };

export type RadioStationFieldsFragment = { __typename?: 'RadioStation', stationuuid: string, name: string, url: string, url_resolved: string, favicon: string, tags: string, country: string, language: string, codec: string, bitrate: number, votes: number };

export type GetRadioStationsQueryVariables = Exact<{
  query?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetRadioStationsQuery = { __typename?: 'Query', radioStations: Array<{ __typename?: 'RadioStation', stationuuid: string, name: string, url: string, url_resolved: string, favicon: string, tags: string, country: string, language: string, codec: string, bitrate: number, votes: number }> };

export type GetRadioStationsByUuidsQueryVariables = Exact<{
  uuids: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type GetRadioStationsByUuidsQuery = { __typename?: 'Query', radioStationsByUuids: Array<{ __typename?: 'RadioStation', stationuuid: string, name: string, url: string, url_resolved: string, favicon: string, tags: string, country: string, language: string, codec: string, bitrate: number, votes: number }> };

export type NoteFieldsFragment = { __typename?: 'Note', id: string, title: string, content: string, createdAt: string, updatedAt: string };

export type GetNotesQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetNotesQuery = { __typename?: 'Query', notes: Array<{ __typename?: 'Note', id: string, title: string, content: string, createdAt: string, updatedAt: string }> };

export type AddNoteMutationVariables = Exact<{
  input: NoteInput;
}>;


export type AddNoteMutation = { __typename?: 'Mutation', addNote: { __typename?: 'Note', id: string, title: string, content: string, createdAt: string, updatedAt: string } };

export type UpdateNoteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: NoteUpdateInput;
}>;


export type UpdateNoteMutation = { __typename?: 'Mutation', updateNote: { __typename?: 'Note', id: string, title: string, content: string, createdAt: string, updatedAt: string } };

export type DeleteNoteMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteNoteMutation = { __typename?: 'Mutation', deleteNote: boolean };

export type CalcRouteQueryVariables = Exact<{
  startLon: Scalars['Float']['input'];
  startLat: Scalars['Float']['input'];
  endLon: Scalars['Float']['input'];
  endLat: Scalars['Float']['input'];
}>;


export type CalcRouteQuery = { __typename?: 'Query', calcRoute?: { __typename?: 'RouteResult', coordinates: Array<Array<number>>, distance: number, duration: number } | null };

export type CalcRouteMultiQueryVariables = Exact<{
  waypoints: Array<CoordinateInput> | CoordinateInput;
}>;


export type CalcRouteMultiQuery = { __typename?: 'Query', calcRouteMulti?: { __typename?: 'RouteResult', coordinates: Array<Array<number>>, distance: number, duration: number } | null };

export type GetResumeFactBankQueryVariables = Exact<{ [key: string]: never; }>;


export type GetResumeFactBankQuery = { __typename?: 'Query', resumeFactBank?: { __typename?: 'ResumeFactBank', skills: Array<string>, updatedAt: string, contact: { __typename?: 'ResumeContact', name: string, email?: string | null, phone?: string | null, location?: string | null, linkedin?: string | null, github?: string | null, website?: string | null }, experiences: Array<{ __typename?: 'ResumeExperience', id: string, company: string, location?: string | null, startDate: string, endDate: string, versions: Array<{ __typename?: 'ResumeVersion', id: string, title: string, bullets: Array<string> }> }>, education: Array<{ __typename?: 'ResumeEducation', id: string, school: string, location?: string | null, degree: string, field: string, startDate?: string | null, endDate?: string | null, notes: Array<string> }>, projects: Array<{ __typename?: 'ResumeProject', id: string, name: string, startDate?: string | null, endDate?: string | null, bullets: Array<string> }> } | null };

export type GetResumeApplicationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetResumeApplicationsQuery = { __typename?: 'Query', resumeApplications: Array<{ __typename?: 'ResumeApplication', id: string, date: string, company: string, role: string, atsScoreBefore: number, atsScoreAfter: number, resumeSnapshot: string, jdText?: string | null }> };

export type GetResumeParseJobQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetResumeParseJobQuery = { __typename?: 'Query', resumeParseJob?: { __typename?: 'ResumeParseJob', id: string, status: string, error?: string | null, createdAt: string, result?: { __typename?: 'ResumeFactBank', skills: Array<string>, updatedAt: string, contact: { __typename?: 'ResumeContact', name: string, email?: string | null, phone?: string | null, location?: string | null, linkedin?: string | null, github?: string | null, website?: string | null }, experiences: Array<{ __typename?: 'ResumeExperience', id: string, company: string, location?: string | null, startDate: string, endDate: string, versions: Array<{ __typename?: 'ResumeVersion', id: string, title: string, bullets: Array<string> }> }>, education: Array<{ __typename?: 'ResumeEducation', id: string, school: string, location?: string | null, degree: string, field: string, startDate?: string | null, endDate?: string | null, notes: Array<string> }>, projects: Array<{ __typename?: 'ResumeProject', id: string, name: string, startDate?: string | null, endDate?: string | null, bullets: Array<string> }> } | null } | null };

export type GetResumeActiveParseJobQueryVariables = Exact<{ [key: string]: never; }>;


export type GetResumeActiveParseJobQuery = { __typename?: 'Query', resumeActiveParseJob?: { __typename?: 'ResumeParseJob', id: string, status: string, createdAt: string } | null };

export type SubmitResumeParseMutationVariables = Exact<{
  fileName: Scalars['String']['input'];
  fileBase64: Scalars['String']['input'];
  contentType: Scalars['String']['input'];
  model: Scalars['String']['input'];
  endpointId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type SubmitResumeParseMutation = { __typename?: 'Mutation', submitResumeParse: { __typename?: 'ResumeParseJob', id: string, status: string, createdAt: string } };

export type ScrapeJobUrlQueryVariables = Exact<{
  url: Scalars['String']['input'];
}>;


export type ScrapeJobUrlQuery = { __typename?: 'Query', scrapeJobUrl?: string | null };

export type SaveResumeFactBankMutationVariables = Exact<{
  input: ResumeFactBankInput;
}>;


export type SaveResumeFactBankMutation = { __typename?: 'Mutation', saveResumeFactBank: { __typename?: 'ResumeFactBank', updatedAt: string } };

export type GenerateResumeMutationVariables = Exact<{
  jdText: Scalars['String']['input'];
  model: Scalars['String']['input'];
  endpointId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GenerateResumeMutation = { __typename?: 'Mutation', generateResume: { __typename?: 'GeneratedResumeResult', skills: Array<string>, contact: { __typename?: 'ResumeContact', name: string, email?: string | null, phone?: string | null, location?: string | null, linkedin?: string | null, github?: string | null, website?: string | null }, experiences: Array<{ __typename?: 'ResumeExperience', id: string, company: string, location?: string | null, startDate: string, endDate: string, versions: Array<{ __typename?: 'ResumeVersion', id: string, title: string, bullets: Array<string> }> }>, education: Array<{ __typename?: 'ResumeEducation', id: string, school: string, location?: string | null, degree: string, field: string, startDate?: string | null, endDate?: string | null, notes: Array<string> }>, projects: Array<{ __typename?: 'ResumeProject', id: string, name: string, startDate?: string | null, endDate?: string | null, bullets: Array<string> }>, atsScore: { __typename?: 'ResumeAtsScore', beforeScore: number, score: number, covered: Array<string>, missing: Array<string>, beforeCovered: Array<string>, beforeMissing: Array<string>, hardSkillsMissing: Array<string> }, keywordReport: { __typename?: 'ResumeKeywordReport', role?: string | null, company?: string | null, hardSkills: Array<string>, titleKeywords: Array<string>, actionKeywords: Array<string>, businessContext: Array<string>, domainKeywords: Array<string>, hardFilters: Array<string>, top10: Array<string>, alreadyHave: Array<string>, needToAdd: Array<string> } } };

export type BoostAtsScoreMutationVariables = Exact<{
  resumeJson: Scalars['String']['input'];
  jdText: Scalars['String']['input'];
  model: Scalars['String']['input'];
  endpointId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type BoostAtsScoreMutation = { __typename?: 'Mutation', boostAtsScore: { __typename?: 'GeneratedResumeResult', skills: Array<string>, contact: { __typename?: 'ResumeContact', name: string, email?: string | null, phone?: string | null, location?: string | null, linkedin?: string | null, github?: string | null, website?: string | null }, experiences: Array<{ __typename?: 'ResumeExperience', id: string, company: string, location?: string | null, startDate: string, endDate: string, versions: Array<{ __typename?: 'ResumeVersion', id: string, title: string, bullets: Array<string> }> }>, education: Array<{ __typename?: 'ResumeEducation', id: string, school: string, location?: string | null, degree: string, field: string, startDate?: string | null, endDate?: string | null, notes: Array<string> }>, projects: Array<{ __typename?: 'ResumeProject', id: string, name: string, startDate?: string | null, endDate?: string | null, bullets: Array<string> }>, atsScore: { __typename?: 'ResumeAtsScore', beforeScore: number, score: number, covered: Array<string>, missing: Array<string>, beforeCovered: Array<string>, beforeMissing: Array<string>, hardSkillsMissing: Array<string> }, keywordReport: { __typename?: 'ResumeKeywordReport', role?: string | null, company?: string | null, hardSkills: Array<string>, titleKeywords: Array<string>, actionKeywords: Array<string>, businessContext: Array<string>, domainKeywords: Array<string>, hardFilters: Array<string>, top10: Array<string>, alreadyHave: Array<string>, needToAdd: Array<string> } } };

export type SaveResumeApplicationMutationVariables = Exact<{
  input: ResumeApplicationInput;
}>;


export type SaveResumeApplicationMutation = { __typename?: 'Mutation', saveResumeApplication: { __typename?: 'ResumeApplication', id: string, date: string, company: string, role: string, atsScoreBefore: number, atsScoreAfter: number } };

export type DeleteResumeApplicationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteResumeApplicationMutation = { __typename?: 'Mutation', deleteResumeApplication: boolean };
