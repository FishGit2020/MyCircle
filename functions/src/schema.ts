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

  type Query {
    weather(lat: Float!, lon: Float!): WeatherData!
    currentWeather(lat: Float!, lon: Float!): CurrentWeather!
    forecast(lat: Float!, lon: Float!): [ForecastDay!]!
    hourlyForecast(lat: Float!, lon: Float!): [HourlyForecast!]!
    airQuality(lat: Float!, lon: Float!): AirQuality
    historicalWeather(lat: Float!, lon: Float!, date: String!): HistoricalWeatherDay
    searchCities(query: String!, limit: Int = 5): [City!]!
    reverseGeocode(lat: Float!, lon: Float!): City

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
    benchmarkHistory(limit: Int = 10): [BenchmarkRun!]!
    benchmarkSummary: BenchmarkSummary!
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
  }

  type BenchmarkEndpoint {
    id: String!
    url: String!
    name: String!
    hasCfAccess: Boolean!
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

  type Mutation {
    aiChat(message: String!, history: [AiChatHistoryInput!], context: JSON, model: String): AiChatResponse!
    runBenchmark(endpointId: String!, model: String!, prompt: String!): BenchmarkRunResult!
    saveBenchmarkEndpoint(input: BenchmarkEndpointInput!): BenchmarkEndpoint!
    deleteBenchmarkEndpoint(id: String!): Boolean!
    saveBenchmarkRun(results: JSON!): BenchmarkRun!
  }

  schema {
    query: Query
    mutation: Mutation
  }
`;
