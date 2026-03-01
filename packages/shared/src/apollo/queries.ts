import { gql } from '@apollo/client';

const WEATHER_CONDITION_FRAGMENT = gql`
  fragment WeatherConditionFields on WeatherCondition {
    id
    main
    description
    icon
  }
`;

export const GET_WEATHER = gql`
  ${WEATHER_CONDITION_FRAGMENT}
  query GetWeather($lat: Float!, $lon: Float!) {
    weather(lat: $lat, lon: $lon) {
      current {
        temp
        feels_like
        temp_min
        temp_max
        pressure
        humidity
        weather {
          ...WeatherConditionFields
        }
        wind {
          speed
          deg
          gust
        }
        clouds {
          all
        }
        dt
        timezone
        sunrise
        sunset
        visibility
      }
      forecast {
        dt
        temp {
          min
          max
          day
          night
        }
        weather {
          ...WeatherConditionFields
        }
        humidity
        wind_speed
        pop
      }
      hourly {
        dt
        temp
        weather {
          ...WeatherConditionFields
        }
        pop
        wind_speed
      }
    }
  }
`;

export const GET_AIR_QUALITY = gql`
  query GetAirQuality($lat: Float!, $lon: Float!) {
    airQuality(lat: $lat, lon: $lon) {
      aqi
      co
      no
      no2
      o3
      so2
      pm2_5
      pm10
    }
  }
`;

export const GET_HISTORICAL_WEATHER = gql`
  query GetHistoricalWeather($lat: Float!, $lon: Float!, $date: String!) {
    historicalWeather(lat: $lat, lon: $lon, date: $date) {
      date
      temp_max
      temp_min
      precipitation
      wind_speed_max
      weather_description
      weather_icon
    }
  }
`;

export const GET_CURRENT_WEATHER = gql`
  ${WEATHER_CONDITION_FRAGMENT}
  query GetCurrentWeather($lat: Float!, $lon: Float!) {
    currentWeather(lat: $lat, lon: $lon) {
      temp
      feels_like
      temp_min
      temp_max
      pressure
      humidity
      weather {
        ...WeatherConditionFields
      }
      wind {
        speed
        deg
        gust
      }
      clouds {
        all
      }
      dt
      timezone
      sunrise
      sunset
      visibility
    }
  }
`;

export const GET_FORECAST = gql`
  ${WEATHER_CONDITION_FRAGMENT}
  query GetForecast($lat: Float!, $lon: Float!) {
    forecast(lat: $lat, lon: $lon) {
      dt
      temp {
        min
        max
        day
        night
      }
      weather {
        ...WeatherConditionFields
      }
      humidity
      wind_speed
      pop
    }
  }
`;

export const GET_HOURLY_FORECAST = gql`
  ${WEATHER_CONDITION_FRAGMENT}
  query GetHourlyForecast($lat: Float!, $lon: Float!) {
    hourlyForecast(lat: $lat, lon: $lon) {
      dt
      temp
      weather {
        ...WeatherConditionFields
      }
      pop
      wind_speed
    }
  }
`;

export const SEARCH_CITIES = gql`
  query SearchCities($query: String!, $limit: Int) {
    searchCities(query: $query, limit: $limit) {
      id
      name
      country
      state
      lat
      lon
    }
  }
`;

export const REVERSE_GEOCODE = gql`
  query ReverseGeocode($lat: Float!, $lon: Float!) {
    reverseGeocode(lat: $lat, lon: $lon) {
      id
      name
      country
      state
      lat
      lon
    }
  }
`;

// ─── Stock Queries ──────────────────────────────────────────

export const SEARCH_STOCKS = gql`
  query SearchStocks($query: String!) {
    searchStocks(query: $query) {
      description
      displaySymbol
      symbol
      type
    }
  }
`;

export const GET_STOCK_QUOTE = gql`
  query GetStockQuote($symbol: String!) {
    stockQuote(symbol: $symbol) {
      c
      d
      dp
      h
      l
      o
      pc
      t
    }
  }
`;

export const GET_STOCK_CANDLES = gql`
  query GetStockCandles($symbol: String!, $resolution: String, $from: Int!, $to: Int!) {
    stockCandles(symbol: $symbol, resolution: $resolution, from: $from, to: $to) {
      c
      h
      l
      o
      t
      v
      s
    }
  }
`;

export const GET_COMPANY_NEWS = gql`
  query GetCompanyNews($symbol: String!, $from: String!, $to: String!) {
    companyNews(symbol: $symbol, from: $from, to: $to) {
      id
      category
      datetime
      headline
      image
      source
      summary
      url
    }
  }
`;

// ─── Crypto Queries ─────────────────────────────────────────

export const GET_CRYPTO_PRICES = gql`
  query GetCryptoPrices($ids: [String!]!, $vsCurrency: String) {
    cryptoPrices(ids: $ids, vsCurrency: $vsCurrency) {
      id
      symbol
      name
      image
      current_price
      market_cap
      market_cap_rank
      price_change_percentage_24h
      total_volume
      sparkline_7d
    }
  }
`;

// ─── Podcast Queries ────────────────────────────────────────

export const SEARCH_PODCASTS = gql`
  query SearchPodcasts($query: String!) {
    searchPodcasts(query: $query) {
      feeds {
        id
        title
        author
        artwork
        description
        categories
        episodeCount
        language
      }
      count
    }
  }
`;

export const GET_TRENDING_PODCASTS = gql`
  query GetTrendingPodcasts {
    trendingPodcasts {
      feeds {
        id
        title
        author
        artwork
        description
        categories
        episodeCount
        language
      }
      count
    }
  }
`;

export const GET_PODCAST_EPISODES = gql`
  query GetPodcastEpisodes($feedId: ID!) {
    podcastEpisodes(feedId: $feedId) {
      items {
        id
        title
        description
        datePublished
        duration
        enclosureUrl
        image
        feedId
      }
      count
    }
  }
`;

export const GET_PODCAST_FEED = gql`
  query GetPodcastFeed($feedId: ID!) {
    podcastFeed(feedId: $feedId) {
      id
      title
      author
      artwork
      description
      categories
      episodeCount
      language
    }
  }
`;

// ─── Bible Queries ─────────────────────────────────────────

export const GET_BIBLE_VOTD = gql`
  query GetBibleVotd($day: Int!) {
    bibleVotd(day: $day) {
      text
      reference
      translation
      copyright
    }
  }
`;

export const GET_BIBLE_VOTD_API = gql`
  query GetBibleVotdApi($day: Int!) {
    bibleVotdApi(day: $day) {
      text
      reference
      translation
      copyright
    }
  }
`;

export const GET_BIBLE_PASSAGE = gql`
  query GetBiblePassage($reference: String!, $translation: String) {
    biblePassage(reference: $reference, translation: $translation) {
      text
      reference
      translation
      verseCount
      copyright
      verses {
        number
        text
      }
    }
  }
`;

export const GET_BIBLE_VERSIONS = gql`
  query GetBibleVersions {
    bibleVersions {
      id
      abbreviation
      title
    }
  }
`;

export const GET_OLLAMA_MODELS = gql`
  query GetOllamaModels {
    ollamaModels
  }
`;

export const GET_AI_USAGE_SUMMARY = gql`
  query GetAiUsageSummary($days: Int) {
    aiUsageSummary(days: $days) {
      totalCalls
      totalInputTokens
      totalOutputTokens
      ollamaCalls
      geminiCalls
      avgLatencyMs
      errorCount
      errorRate
      dailyBreakdown {
        date
        calls
        avgLatencyMs
        tokens
        errors
      }
      since
    }
  }
`;

export const GET_OLLAMA_STATUS = gql`
  query GetOllamaStatus {
    ollamaStatus {
      models {
        name
        size
        sizeVram
        expiresAt
      }
      reachable
      latencyMs
    }
  }
`;

export const GET_AI_RECENT_LOGS = gql`
  query GetAiRecentLogs($limit: Int) {
    aiRecentLogs(limit: $limit) {
      id
      timestamp
      provider
      model
      inputTokens
      outputTokens
      latencyMs
      toolCalls {
        name
        durationMs
        error
      }
      questionPreview
      answerPreview
      status
      error
    }
  }
`;

export const AI_CHAT = gql`
  mutation AiChat($message: String!, $history: [AiChatHistoryInput!], $context: JSON, $model: String) {
    aiChat(message: $message, history: $history, context: $context, model: $model) {
      response
      toolCalls {
        name
        args
        result
      }
      actions {
        type
        payload
      }
    }
  }
`;

// ─── Benchmark Queries ─────────────────────────────────────

export const GET_BENCHMARK_ENDPOINTS = gql`
  query GetBenchmarkEndpoints {
    benchmarkEndpoints {
      id
      url
      name
      hasCfAccess
    }
  }
`;

export const GET_BENCHMARK_HISTORY = gql`
  query GetBenchmarkHistory($limit: Int) {
    benchmarkHistory(limit: $limit) {
      id
      userId
      results
      createdAt
    }
  }
`;

export const GET_BENCHMARK_SUMMARY = gql`
  query GetBenchmarkSummary {
    benchmarkSummary {
      lastRunId
      lastRunAt
      endpointCount
      fastestEndpoint
      fastestTps
    }
  }
`;

export const RUN_BENCHMARK = gql`
  mutation RunBenchmark($endpointId: String!, $model: String!, $prompt: String!) {
    runBenchmark(endpointId: $endpointId, model: $model, prompt: $prompt) {
      endpointId
      endpointName
      model
      prompt
      response
      timing {
        totalDuration
        loadDuration
        promptEvalCount
        promptEvalDuration
        evalCount
        evalDuration
        tokensPerSecond
        promptTokensPerSecond
        timeToFirstToken
      }
      error
      timestamp
    }
  }
`;

export const SAVE_BENCHMARK_ENDPOINT = gql`
  mutation SaveBenchmarkEndpoint($input: BenchmarkEndpointInput!) {
    saveBenchmarkEndpoint(input: $input) {
      id
      url
      name
      hasCfAccess
    }
  }
`;

export const DELETE_BENCHMARK_ENDPOINT = gql`
  mutation DeleteBenchmarkEndpoint($id: String!) {
    deleteBenchmarkEndpoint(id: $id)
  }
`;

export const SAVE_BENCHMARK_RUN = gql`
  mutation SaveBenchmarkRun($results: JSON!) {
    saveBenchmarkRun(results: $results) {
      id
      userId
      results
      createdAt
    }
  }
`;

export const WEATHER_UPDATES = gql`
  ${WEATHER_CONDITION_FRAGMENT}
  subscription WeatherUpdates($lat: Float!, $lon: Float!) {
    weatherUpdates(lat: $lat, lon: $lon) {
      lat
      lon
      timestamp
      current {
        temp
        feels_like
        temp_min
        temp_max
        pressure
        humidity
        weather {
          ...WeatherConditionFields
        }
        wind {
          speed
          deg
          gust
        }
        clouds {
          all
        }
        dt
        timezone
        sunrise
        sunset
        visibility
      }
    }
  }
`;
