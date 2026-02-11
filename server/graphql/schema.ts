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

  type City {
    id: String!
    name: String!
    country: String!
    state: String
    lat: Float!
    lon: Float!
  }

  type WeatherUpdate {
    lat: Float!
    lon: Float!
    current: CurrentWeather!
    timestamp: String!
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

  type Query {
    weather(lat: Float!, lon: Float!): WeatherData!
    currentWeather(lat: Float!, lon: Float!): CurrentWeather!
    forecast(lat: Float!, lon: Float!): [ForecastDay!]!
    hourlyForecast(lat: Float!, lon: Float!): [HourlyForecast!]!
    searchCities(query: String!, limit: Int = 5): [City!]!
    reverseGeocode(lat: Float!, lon: Float!): City

    # Stock queries
    searchStocks(query: String!): [StockSearchResult!]!
    stockQuote(symbol: String!): StockQuote
    stockCandles(symbol: String!, resolution: String = "D", from: Int!, to: Int!): StockCandle

    # Podcast queries
    searchPodcasts(query: String!): PodcastSearchResponse!
    trendingPodcasts: PodcastTrendingResponse!
    podcastEpisodes(feedId: ID!): PodcastEpisodesResponse!
    podcastFeed(feedId: ID!): PodcastFeed
  }

  type Subscription {
    weatherUpdates(lat: Float!, lon: Float!): WeatherUpdate!
  }

  schema {
    query: Query
    subscription: Subscription
  }
`;
