export const typeDefs = `#graphql
  type WeatherCondition {
    id: Int!
    main: String!
    description: String!
    icon: String!
  }

  type Wind {
    speed: Float!
    deg: Int!
    gust: Float
  }

  type Clouds {
    all: Int!
  }

  type Temperature {
    min: Float!
    max: Float!
    day: Float!
    night: Float!
  }

  type CurrentWeather {
    temp: Float!
    feels_like: Float!
    temp_min: Float!
    temp_max: Float!
    pressure: Int!
    humidity: Int!
    weather: [WeatherCondition!]!
    wind: Wind!
    clouds: Clouds!
    dt: Int!
    timezone: Int!
    sunrise: Int
    sunset: Int
    visibility: Int
  }

  type ForecastDay {
    dt: Int!
    temp: Temperature!
    weather: [WeatherCondition!]!
    humidity: Int!
    wind_speed: Float!
    pop: Float!
  }

  type HourlyForecast {
    dt: Int!
    temp: Float!
    weather: [WeatherCondition!]!
    pop: Float!
    wind_speed: Float!
  }

  type WeatherData {
    current: CurrentWeather
    forecast: [ForecastDay!]
    hourly: [HourlyForecast!]
  }

  type AirQuality {
    aqi: Int!
    co: Float!
    no: Float!
    no2: Float!
    o3: Float!
    so2: Float!
    pm2_5: Float!
    pm10: Float!
  }

  type HistoricalWeatherDay {
    date: String!
    temp_max: Float!
    temp_min: Float!
    precipitation: Float!
    wind_speed_max: Float!
    weather_description: String!
    weather_icon: String!
  }

  type City {
    id: String!
    name: String!
    country: String!
    state: String
    lat: Float!
    lon: Float!
  }

  # ─── Deal Finder Types ─────────────────────────────────────────

  type Deal {
    id: ID!
    title: String!
    url: String!
    source: String!
    price: String
    originalPrice: String
    store: String
    category: String
    thumbnail: String
    postedAt: String!
    score: Int
  }

  # ─── Cloud Files Types ─────────────────────────────────────────

  type CloudFile {
    id: ID!
    fileName: String!
    contentType: String!
    size: Int!
    downloadUrl: String!
    storagePath: String!
    uploadedAt: String!
    folderId: ID
  }

  type Folder {
    id: ID!
    name: String!
    parentFolderId: ID
    createdAt: String!
    depth: Int!
  }

  type TargetedSharedFile {
    shareId: String!
    ownerUid: String!
    ownerName: String!
    fileId: String!
    fileName: String!
    contentType: String!
    size: Int!
    downloadUrl: String!
    sharedAt: String!
  }

  type ShareRecipient {
    recipientUid: String!
    recipientName: String!
    shareId: String!
    sharedAt: String!
  }

  type TargetedShareResult {
    ok: Boolean!
    shareId: String!
  }

  type SharedFile {
    id: ID!
    fileName: String!
    contentType: String!
    size: Int!
    downloadUrl: String!
    storagePath: String!
    sharedByUid: String!
    sharedByName: String!
    sharedAt: String!
  }

  type ShareFileResult {
    ok: Boolean!
    downloadUrl: String!
  }

  # ─── Baby Photos Types ──────────────────────────────────────────

  type BabyPhoto {
    stageId: Int!
    photoId: String!
    photoUrl: String!
    caption: String
    uploadedAt: String!
  }

  type BabyMilestoneNote {
    stageId: Int!
    notes: String
  }

  # ─── Digital Library Types ──────────────────────────────────────

  type BookUploader {
    uid: String!
    displayName: String!
  }

  type Book {
    id: ID!
    title: String!
    author: String!
    description: String!
    language: String!
    coverUrl: String!
    epubUrl: String!
    fileSize: Int!
    chapterCount: Int!
    totalCharacters: Int!
    uploadedBy: BookUploader!
    uploadedAt: String!
    audioStatus: String!
    audioProgress: Int!
    audioError: String
  }

  type BookChapter {
    id: ID!
    index: Int!
    title: String!
    href: String!
    characterCount: Int!
    audioUrl: String
    audioDuration: Int
  }

  type BookConversionProgress {
    audioStatus: String!
    audioProgress: Int!
    audioError: String
    canContinue: Boolean!
  }

  type TtsQuota {
    used: Int!
    limit: Int!
    remaining: Int!
  }

  type ConversionJob {
    id: ID!
    bookId: ID!
    chapterIndex: Int!
    voiceName: String!
    status: String!
    error: String
    createdAt: String!
  }

  # ─── USCIS Case Status Types ─────────────────────────────────

  type CaseStatusHistory {
    date: String!
    status: String!
  }

  type CaseStatus {
    receiptNumber: String!
    formType: String!
    status: String!
    statusDescription: String!
    checkedAt: String!
    submittedDate: String
    modifiedDate: String
    history: [CaseStatusHistory!]
  }

  # ─── Stock Types ──────────────────────────────────────────────

  type StockSearchResult {
    description: String!
    displaySymbol: String!
    symbol: String!
    type: String!
  }

  type StockQuote {
    c: Float!
    d: Float!
    dp: Float!
    h: Float!
    l: Float!
    o: Float!
    pc: Float!
    t: Int!
  }

  type StockCandle {
    c: [Float!]!
    h: [Float!]!
    l: [Float!]!
    o: [Float!]!
    t: [Int!]!
    v: [Int!]!
    s: String!
  }

  type CompanyNews {
    id: Int!
    category: String!
    datetime: Int!
    headline: String!
    image: String
    source: String!
    summary: String!
    url: String!
    related: String
  }

  # ─── Crypto Types ──────────────────────────────────────────────

  type CryptoPrice {
    id: String!
    symbol: String!
    name: String!
    image: String!
    current_price: Float!
    market_cap: Float!
    market_cap_rank: Int
    price_change_percentage_24h: Float
    total_volume: Float!
    sparkline_7d: [Float!]
  }

  # ─── Podcast Types ─────────────────────────────────────────────

  type PodcastFeed {
    id: ID!
    title: String!
    author: String
    artwork: String
    description: String
    categories: String
    episodeCount: Int
    language: String
  }

  type PodcastEpisode {
    id: ID!
    title: String!
    description: String
    datePublished: Int
    duration: Int
    enclosureUrl: String
    image: String
    feedId: ID
  }

  type PodcastSearchResponse {
    feeds: [PodcastFeed!]!
    count: Int!
  }

  type PodcastTrendingResponse {
    feeds: [PodcastFeed!]!
    count: Int!
  }

  type PodcastEpisodesResponse {
    items: [PodcastEpisode!]!
    count: Int!
  }

  # ─── Bible Types ──────────────────────────────────────────────

  type BibleVerse {
    text: String!
    reference: String!
    translation: String
    copyright: String
  }

  type BibleVerseItem {
    number: Int!
    text: String!
  }

  type BiblePassage {
    text: String!
    reference: String!
    translation: String
    verseCount: Int
    copyright: String
    verses: [BibleVerseItem!]!
  }

  type BibleVersion {
    id: Int!
    abbreviation: String!
    title: String!
  }

  type LocationSearchResult {
    displayName: String!
    lat: Float!
    lon: Float!
  }

  # ─── Transit Types ──────────────────────────────────────────────

  # ─── OpenClaw Types ──────────────────────────────────────────────

  type BabyInfo {
    dueDate: String!
    currentWeek: Int!
    currentDay: Int!
    weeksRemaining: Int!
    fruit: String!
    animal: String!
    vegetable: String!
    length: String!
    weight: String!
  }

  type Note {
    id: ID!
    title: String!
    content: String!
    createdAt: String!
    updatedAt: String!
  }

  input NoteInput {
    title: String!
    content: String!
  }

  input NoteUpdateInput {
    title: String
    content: String
  }

  type DailyLogEntry {
    id: ID!
    content: String!
    date: String!
    createdAt: String!
    updatedAt: String!
  }

  input DailyLogInput {
    content: String!
    date: String
  }

  type TransitArrival {
    routeId: String!
    routeShortName: String!
    tripHeadsign: String!
    scheduledArrival: Float!
    predictedArrival: Float!
    minutesUntilArrival: Int!
    isRealTime: Boolean!
    status: String!
    vehicleId: String!
  }

  type TransitStop {
    id: String!
    name: String!
    direction: String!
    lat: Float!
    lon: Float!
    routeIds: [String!]!
  }

  type Query {
    weather(lat: Float!, lon: Float!): WeatherData!
    currentWeather(lat: Float!, lon: Float!): CurrentWeather!
    forecast(lat: Float!, lon: Float!): [ForecastDay!]!
    hourlyForecast(lat: Float!, lon: Float!): [HourlyForecast!]!
    airQuality(lat: Float!, lon: Float!): AirQuality
    historicalWeather(lat: Float!, lon: Float!, date: String!): HistoricalWeatherDay
    searchCities(query: String!, limit: Int = 5): [City!]!
    reverseGeocode(lat: Float!, lon: Float!): City

    # USCIS case status
    checkCaseStatus(receiptNumber: String!): CaseStatus!

    # Stock & Crypto queries
    cryptoPrices(ids: [String!]!, vsCurrency: String = "usd"): [CryptoPrice!]!
    searchStocks(query: String!): [StockSearchResult!]!
    stockQuote(symbol: String!): StockQuote
    stockCandles(symbol: String!, resolution: String = "D", from: Int!, to: Int!): StockCandle
    companyNews(symbol: String!, from: String!, to: String!): [CompanyNews!]!

    # Podcast queries
    searchPodcasts(query: String!): PodcastSearchResponse!
    trendingPodcasts: PodcastTrendingResponse!
    podcastEpisodes(feedId: ID!): PodcastEpisodesResponse!
    podcastFeed(feedId: ID!): PodcastFeed

    # Bible queries
    bibleVersions: [BibleVersion!]!
    bibleVotd(day: Int!): BibleVerse!
    bibleVotdApi(day: Int!): BibleVerse!
    biblePassage(reference: String!, translation: String): BiblePassage!

    # AI queries
    ollamaModels: [String!]!
    aiUsageSummary(days: Int = 7): AiUsageSummary!
    ollamaStatus: OllamaStatus!
    aiRecentLogs(limit: Int = 20): [AiChatLogEntry!]!

    # Benchmark queries
    benchmarkEndpoints: [BenchmarkEndpoint!]!
    benchmarkEndpointModels(endpointId: ID!): [String!]!
    benchmarkHistory(limit: Int = 10): [BenchmarkRun!]!
    benchmarkSummary: BenchmarkSummary!

    # Location search (Nominatim)
    locationSearch(query: String!, limit: Int = 5): [LocationSearchResult!]!

    # Transit queries
    transitArrivals(stopId: String!): [TransitArrival!]!
    transitStop(stopId: String!): TransitStop
    transitNearbyStops(lat: Float!, lon: Float!, radius: Int): [TransitStop!]!

    # Worship songs
    worshipSongsList(limit: Int, offset: Int, search: String, artist: String, tag: String, format: String, favoriteIds: [String!]): WorshipSongsPage!
    worshipSong(id: ID!): WorshipSong
    worshipSetlists: [Setlist!]!
    worshipSetlist(id: ID!): Setlist

    # Interview (question bank is public, sessions require auth)
    questionBank: QuestionBank!
    interviewSessions: [InterviewSessionSummary!]!
    interviewSession(id: ID!): InterviewSessionDetail

    # Cloud Files (auth required)
    cloudFiles: [CloudFile!]!
    sharedFiles: [SharedFile!]!
    folders: [Folder!]!
    fileShareRecipients(fileId: ID!): [ShareRecipient!]!
    filesSharedWithMe: [TargetedSharedFile!]!

    # Deals (auth required)
    deals: [Deal!]!

    # Baby Info (auth required — supports API key auth for OpenClaw)
    babyInfo: BabyInfo!

    # Notes (auth required — supports API key auth for OpenClaw)
    notes(limit: Int, search: String): [Note!]!

    # Baby Photos (auth required)
    babyPhotos: [BabyPhoto!]!
    babyMilestoneNotes: [BabyMilestoneNote!]!

    # Digital Library (auth required)
    books: [Book!]!
    bookChapters(bookId: ID!): [BookChapter!]!
    bookConversionProgress(bookId: ID!): BookConversionProgress!
    ttsQuota: TtsQuota!
    conversionJobs(bookId: ID!): [ConversionJob!]!

    # Web Crawler (auth required)
    crawlJobs: [CrawlJob!]!
    crawlJobDetail(id: ID!): CrawlJobDetail
    searchCrawlJobs(query: String!): [CrawlJob!]!

    # Radio stations (public)
    radioStations(query: String, limit: Int = 50): [RadioStation!]!
    radioStationsByUuids(uuids: [String!]!): [RadioStation!]!

    # Hiking route (public)
    calcRoute(startLon: Float!, startLat: Float!, endLon: Float!, endLat: Float!): RouteResult
    calcRouteMulti(waypoints: [CoordinateInput!]!): RouteResult

    # Resume Tailor (auth required)
    resumeFactBank: ResumeFactBank
    resumeApplications(limit: Int): [ResumeApplication!]!
    resumeParseJob(id: ID!): ResumeParseJob
    resumeActiveParseJob: ResumeParseJob
    scrapeJobUrl(url: String!): String
  }

  type RadioStation {
    stationuuid: String!
    name: String!
    url: String!
    url_resolved: String!
    favicon: String!
    tags: String!
    country: String!
    language: String!
    codec: String!
    bitrate: Int!
    votes: Int!
  }

  type RouteResult {
    coordinates: [[Float!]!]!
    distance: Float!
    duration: Float!
  }

  input CoordinateInput {
    lon: Float!
    lat: Float!
  }

  # ─── AI Usage & Monitoring Types ──────────────────────────────

  type AiUsageSummary {
    totalCalls: Int!
    totalInputTokens: Int!
    totalOutputTokens: Int!
    ollamaCalls: Int!
    geminiCalls: Int!
    avgLatencyMs: Float!
    errorCount: Int!
    errorRate: Float!
    dailyBreakdown: [AiDailyStats!]!
    since: String!
  }

  type AiDailyStats {
    date: String!
    calls: Int!
    avgLatencyMs: Float!
    tokens: Int!
    errors: Int!
  }

  type OllamaRunningModel {
    name: String!
    size: Float!
    sizeVram: Float!
    expiresAt: String!
  }

  type OllamaStatus {
    models: [OllamaRunningModel!]!
    reachable: Boolean!
    latencyMs: Int
  }

  type AiToolCallLog {
    name: String!
    durationMs: Int
    error: String
  }

  type AiChatLogEntry {
    id: String!
    timestamp: String!
    provider: String!
    model: String!
    inputTokens: Int!
    outputTokens: Int!
    latencyMs: Int!
    toolCalls: [AiToolCallLog!]!
    questionPreview: String!
    answerPreview: String!
    fullQuestion: String
    fullAnswer: String
    endpointId: String
    status: String!
    error: String
  }

  # ─── AI Chat Types ─────────────────────────────────────────────

  scalar JSON

  type ToolCallResult {
    name: String!
    args: JSON
    result: String
  }

  type AiAction {
    type: String!
    payload: JSON
  }

  type AiChatResponse {
    response: String!
    toolCalls: [ToolCallResult!]
    actions: [AiAction!]
    toolMode: String
  }

  input AiChatHistoryInput {
    role: String!
    content: String!
  }

  # ─── Benchmark Types ──────────────────────────────────────────

  input BenchmarkEndpointInput {
    url: String!
    name: String!
    cfAccessClientId: String
    cfAccessClientSecret: String
    source: String
  }

  type BenchmarkEndpoint {
    id: String!
    url: String!
    name: String!
    hasCfAccess: Boolean!
    source: String!
  }

  type BenchmarkTimingResult {
    totalDuration: Float!
    loadDuration: Float!
    promptEvalCount: Int!
    promptEvalDuration: Float!
    evalCount: Int!
    evalDuration: Float!
    tokensPerSecond: Float!
    promptTokensPerSecond: Float!
    timeToFirstToken: Float!
  }

  type BenchmarkRunResult {
    endpointId: String!
    endpointName: String!
    model: String!
    prompt: String!
    response: String!
    timing: BenchmarkTimingResult
    error: String
    timestamp: String!
    qualityScore: Float
    qualityFeedback: String
    qualityJudge: String
  }

  type BenchmarkQualityResult {
    score: Float!
    feedback: String!
    judge: String!
  }

  type BenchmarkRun {
    id: String!
    userId: String!
    results: [BenchmarkRunResult!]!
    createdAt: String!
  }

  type BenchmarkSummary {
    lastRunId: String
    lastRunAt: String
    endpointCount: Int!
    fastestEndpoint: String
    fastestTps: Float
  }

  # ─── Interview Types ──────────────────────────────────────

  type InterviewQuestion {
    id: ID!
    chapter: String!
    chapterSlug: String!
    difficulty: String!
    title: String!
    description: String!
    tags: [String!]!
  }

  type QuestionBank {
    chapters: [String!]!
    questions: [InterviewQuestion!]!
  }

  type InterviewSessionSummary {
    id: ID!
    questionPreview: String!
    messageCount: Int!
    mode: String
    updatedAt: String
    createdAt: String
  }

  type SessionMessage {
    id: String!
    role: String!
    content: String!
    timestamp: Float!
  }

  type InterviewSessionDetail {
    id: ID!
    question: String!
    document: String!
    messages: [SessionMessage!]!
    sessionName: String
    interviewState: JSON
    scores: JSON
    config: JSON
    createdAt: String!
    updatedAt: String!
  }

  input CreateInterviewQuestionInput {
    chapter: String!
    chapterSlug: String!
    difficulty: String!
    title: String!
    description: String!
    tags: [String!]
  }

  input UpdateInterviewQuestionInput {
    chapter: String
    chapterSlug: String
    difficulty: String
    title: String
    description: String
    tags: [String!]
  }

  input SessionMessageInput {
    id: String!
    role: String!
    content: String!
    timestamp: Float!
  }

  input SaveInterviewSessionInput {
    sessionId: String!
    question: String!
    document: String!
    messages: [SessionMessageInput!]!
    sessionName: String
    interviewState: JSON
    scores: JSON
    config: JSON
  }

  # ─── Worship Songs Types ──────────────────────────────────────

  type WorshipSong {
    id: ID!
    title: String!
    artist: String!
    originalKey: String!
    format: String!
    content: String!
    notes: String!
    youtubeUrl: String
    bpm: Int
    tags: [String!]
    createdAt: String!
    updatedAt: String!
    createdBy: String
  }

  type WorshipSongListItem {
    id: ID!
    title: String!
    artist: String!
    originalKey: String!
    format: String!
    tags: [String!]
    updatedAt: String!
  }

  type WorshipSongsPage {
    songs: [WorshipSongListItem!]!
    totalCount: Int!
    allArtists: [String!]!
    allTags: [String!]!
  }

  input WorshipSongInput {
    title: String!
    artist: String!
    originalKey: String!
    format: String!
    content: String!
    notes: String!
    youtubeUrl: String
    bpm: Int
    tags: [String!]
  }

  input WorshipSongUpdateInput {
    title: String
    artist: String
    originalKey: String
    format: String
    content: String
    notes: String
    youtubeUrl: String
    bpm: Int
    tags: [String!]
  }

  # ─── Worship Setlist Types ──────────────────────────────────

  type SetlistEntry {
    songId: ID!
    position: Int!
    snapshotTitle: String!
    snapshotKey: String!
  }

  type Setlist {
    id: ID!
    name: String!
    serviceDate: String
    entries: [SetlistEntry!]!
    createdAt: String!
    updatedAt: String!
    createdBy: String!
  }

  input SetlistEntryInput {
    songId: ID!
    position: Int!
    snapshotTitle: String!
    snapshotKey: String!
  }

  input WorshipSetlistInput {
    name: String!
    serviceDate: String
    entries: [SetlistEntryInput!]
  }

  input WorshipSetlistUpdateInput {
    name: String
    serviceDate: String
    entries: [SetlistEntryInput!]
  }

  # ─── Web Crawler Types ──────────────────────────────────────

  type CrawlJob {
    id: ID!
    url: String!
    status: String!
    maxDepth: Int!
    maxPages: Int!
    pagesVisited: Int!
    createdAt: String!
    updatedAt: String!
  }

  type CrawledDocument {
    id: ID!
    jobId: String!
    url: String!
    title: String
    contentPreview: String
    fullContent: String
    contentTruncated: Boolean
    description: String
    author: String
    publishDate: String
    ogImage: String
    statusCode: Int!
    contentType: String
    crawledAt: String!
    size: Int!
    depth: Int!
  }

  type CrawlTrace {
    id: ID!
    jobId: String!
    timestamp: String!
    level: String!
    message: String!
    url: String
    durationMs: Int
  }

  type CrawlJobDetail {
    job: CrawlJob!
    documents: [CrawledDocument!]!
    traces: [CrawlTrace!]!
  }

  input StartCrawlInput {
    url: String!
    maxDepth: Int
    maxPages: Int
  }

  # ─── Resume Tailor AI ────────────────────────────────────────────────────────

  type ResumeContact {
    name: String!
    email: String
    phone: String
    location: String
    linkedin: String
    github: String
    website: String
  }

  input ResumeContactInput {
    name: String!
    email: String
    phone: String
    location: String
    linkedin: String
    github: String
    website: String
  }

  type ResumeVersion {
    id: ID!
    title: String!
    bullets: [String!]!
  }

  input ResumeVersionInput {
    id: ID!
    title: String!
    bullets: [String!]!
  }

  type ResumeExperience {
    id: ID!
    company: String!
    location: String
    startDate: String!
    endDate: String!
    versions: [ResumeVersion!]!
  }

  input ResumeExperienceInput {
    id: ID!
    company: String!
    location: String
    startDate: String!
    endDate: String!
    versions: [ResumeVersionInput!]!
  }

  type ResumeEducation {
    id: ID!
    school: String!
    location: String
    degree: String!
    field: String!
    startDate: String
    endDate: String
    notes: [String!]!
  }

  input ResumeEducationInput {
    id: ID!
    school: String!
    location: String
    degree: String!
    field: String!
    startDate: String
    endDate: String
    notes: [String!]!
  }

  type ResumeProject {
    id: ID!
    name: String!
    startDate: String
    endDate: String
    bullets: [String!]!
  }

  input ResumeProjectInput {
    id: ID!
    name: String!
    startDate: String
    endDate: String
    bullets: [String!]!
  }

  type ResumeParseJob {
    id: ID!
    status: String!
    error: String
    result: ResumeFactBank
    createdAt: String!
  }

  type ResumeFactBank {
    contact: ResumeContact!
    experiences: [ResumeExperience!]!
    education: [ResumeEducation!]!
    skills: [String!]!
    projects: [ResumeProject!]!
    updatedAt: String!
  }

  input ResumeFactBankInput {
    contact: ResumeContactInput!
    experiences: [ResumeExperienceInput!]!
    education: [ResumeEducationInput!]!
    skills: [String!]!
    projects: [ResumeProjectInput!]!
  }

  type ResumeAtsScore {
    beforeScore: Float!
    score: Float!
    covered: [String!]!
    missing: [String!]!
    beforeCovered: [String!]!
    beforeMissing: [String!]!
    hardSkillsMissing: [String!]!
  }

  type ResumeKeywordReport {
    role: String
    company: String
    hardSkills: [String!]!
    titleKeywords: [String!]!
    actionKeywords: [String!]!
    businessContext: [String!]!
    domainKeywords: [String!]!
    hardFilters: [String!]!
    top10: [String!]!
    alreadyHave: [String!]!
    needToAdd: [String!]!
  }

  type GeneratedResumeResult {
    contact: ResumeContact!
    experiences: [ResumeExperience!]!
    education: [ResumeEducation!]!
    skills: [String!]!
    projects: [ResumeProject!]!
    atsScore: ResumeAtsScore!
    keywordReport: ResumeKeywordReport!
  }

  type ResumeApplication {
    id: ID!
    date: String!
    company: String!
    role: String!
    atsScoreBefore: Float!
    atsScoreAfter: Float!
    resumeSnapshot: String!
    jdText: String
  }

  input ResumeApplicationInput {
    company: String!
    role: String!
    atsScoreBefore: Float!
    atsScoreAfter: Float!
    resumeSnapshot: String!
    jdText: String
  }

  type Mutation {
    aiChat(message: String!, history: [AiChatHistoryInput!], context: JSON, model: String, endpointId: ID, toolMode: String, systemPrompt: String): AiChatResponse!
    runBenchmark(endpointId: String!, model: String!, prompt: String!): BenchmarkRunResult!
    saveBenchmarkEndpoint(input: BenchmarkEndpointInput!): BenchmarkEndpoint!
    deleteBenchmarkEndpoint(id: String!): Boolean!
    scoreBenchmarkResponse(prompt: String!, response: String!, judgeProvider: String!, judgeEndpointId: String, judgeModel: String): BenchmarkQualityResult!
    saveBenchmarkRun(results: JSON!): BenchmarkRun!
    deleteBenchmarkRun(id: String!): Boolean!

    # Notes (auth required)
    addNote(input: NoteInput!): Note!
    updateNote(id: ID!, input: NoteUpdateInput!): Note!
    deleteNote(id: ID!): Boolean!

    # Worship songs (auth required for mutations)
    addWorshipSong(input: WorshipSongInput!): WorshipSong!
    updateWorshipSong(id: ID!, input: WorshipSongUpdateInput!): WorshipSong!
    deleteWorshipSong(id: ID!): Boolean!

    # Worship setlists (auth required)
    addWorshipSetlist(input: WorshipSetlistInput!): Setlist!
    updateWorshipSetlist(id: ID!, input: WorshipSetlistUpdateInput!): Setlist!
    deleteWorshipSetlist(id: ID!): Boolean!

    # Cloud Files (auth required)
    shareFile(fileId: ID!): ShareFileResult!
    deleteFile(fileId: ID!): Boolean!
    deleteSharedFile(fileId: ID!): Boolean!
    renameFile(fileId: ID!, newName: String!): CloudFile!
    createFolder(name: String!, parentFolderId: ID): Folder!
    deleteFolder(folderId: ID!, deleteContents: Boolean!): Boolean!
    renameFolder(folderId: ID!, newName: String!): Folder!
    moveFile(fileId: ID!, targetFolderId: ID): CloudFile!
    shareFileWith(fileId: ID!, recipientEmail: String!): TargetedShareResult!
    revokeFileAccess(shareId: String!): Boolean!

    # Baby Photos (auth required)
    deleteBabyPhoto(stageId: Int!, photoId: String!): Boolean!
    saveBabyMilestoneNotes(stageId: Int!, notes: String!): Boolean!

    # Interview (auth required for mutations)
    createInterviewQuestion(input: CreateInterviewQuestionInput!): InterviewQuestion!
    updateInterviewQuestion(id: ID!, input: UpdateInterviewQuestionInput!): InterviewQuestion!
    deleteInterviewQuestion(id: ID!): Boolean!
    saveInterviewSession(input: SaveInterviewSessionInput!): InterviewSessionDetail!
    deleteInterviewSession(id: ID!): Boolean!

    # Daily Log (auth required — supports API key auth for OpenClaw)
    createDailyLog(input: DailyLogInput!): DailyLogEntry!

    # Digital Library (auth required)
    deleteBook(id: ID!): Boolean!
    restoreBook(id: ID!): Boolean!
    permanentDeleteBook(id: ID!): Boolean!
    submitChapterConversions(bookId: ID!, chapterIndices: [Int!]!, voiceName: String!): [ConversionJob!]!
    uploadBook(fileBase64: String!): Book!
    deleteChapterAudio(bookId: ID!, chapterIndex: Int!): Boolean!
    resetBookConversion(bookId: ID!): Boolean!
    previewVoice(voiceName: String!): String!

    # Web Crawler (auth required)
    startCrawl(input: StartCrawlInput!): CrawlJob!
    stopCrawl(id: ID!): CrawlJob!
    deleteCrawlJob(id: ID!): Boolean!

    # Resume Tailor (auth required)
    saveResumeFactBank(input: ResumeFactBankInput!): ResumeFactBank!
    submitResumeParse(fileName: String!, fileBase64: String!, contentType: String!, model: String!, endpointId: ID): ResumeParseJob!
    generateResume(jdText: String!, model: String!, endpointId: ID): GeneratedResumeResult!
    boostAtsScore(resumeJson: String!, jdText: String!, model: String!, endpointId: ID): GeneratedResumeResult!
    saveResumeApplication(input: ResumeApplicationInput!): ResumeApplication!
    deleteResumeApplication(id: ID!): Boolean!
  }

  schema {
    query: Query
    mutation: Mutation
  }
`;
