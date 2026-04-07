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

// ─── USCIS Case Status Queries ──────────────────────────────

export const CHECK_CASE_STATUS = gql`
  query CheckCaseStatus($receiptNumber: String!) {
    checkCaseStatus(receiptNumber: $receiptNumber) {
      receiptNumber
      formType
      status
      statusDescription
      checkedAt
      submittedDate
      modifiedDate
      history {
        date
        status
      }
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
      fullQuestion
      fullAnswer
      endpointId
      status
      error
    }
  }
`;

export const AI_CHAT = gql`
  mutation AiChat($message: String!, $history: [AiChatHistoryInput!], $context: JSON, $model: String, $endpointId: ID, $toolMode: String, $systemPrompt: String) {
    aiChat(message: $message, history: $history, context: $context, model: $model, endpointId: $endpointId, toolMode: $toolMode, systemPrompt: $systemPrompt) {
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
      toolMode
    }
  }
`;

// ─── Benchmark Queries ─────────────────────────────────────

export const GET_BENCHMARK_ENDPOINT_MODELS = gql`
  query GetBenchmarkEndpointModels($endpointId: ID!) {
    benchmarkEndpointModels(endpointId: $endpointId)
  }
`;

export const GET_BENCHMARK_ENDPOINTS = gql`
  query GetBenchmarkEndpoints {
    benchmarkEndpoints {
      id
      url
      name
      hasCfAccess
      source
    }
  }
`;

export const GET_BENCHMARK_HISTORY = gql`
  query GetBenchmarkHistory($limit: Int) {
    benchmarkHistory(limit: $limit) {
      id
      createdAt
      results {
        endpointId
        endpointName
        model
        prompt
        response
        error
        timing {
          tokensPerSecond
          promptTokensPerSecond
          timeToFirstToken
          totalDuration
        }
        qualityScore
        qualityFeedback
        qualityJudge
      }
    }
  }
`;

export const DELETE_BENCHMARK_RUN = gql`
  mutation DeleteBenchmarkRun($id: String!) {
    deleteBenchmarkRun(id: $id)
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
      qualityScore
      qualityFeedback
      qualityJudge
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
      source
    }
  }
`;

export const DELETE_BENCHMARK_ENDPOINT = gql`
  mutation DeleteBenchmarkEndpoint($id: String!) {
    deleteBenchmarkEndpoint(id: $id)
  }
`;

export const SCORE_BENCHMARK_RESPONSE = gql`
  mutation ScoreBenchmarkResponse($prompt: String!, $response: String!, $judgeProvider: String!, $judgeEndpointId: String, $judgeModel: String) {
    scoreBenchmarkResponse(prompt: $prompt, response: $response, judgeProvider: $judgeProvider, judgeEndpointId: $judgeEndpointId, judgeModel: $judgeModel) {
      score
      feedback
      judge
    }
  }
`;

export const SAVE_BENCHMARK_RUN = gql`
  mutation SaveBenchmarkRun($results: JSON!) {
    saveBenchmarkRun(results: $results) {
      id
      createdAt
    }
  }
`;

// ─── Location Search ────────────────────────────────────────────

export const SEARCH_LOCATIONS = gql`
  query SearchLocations($query: String!, $limit: Int) {
    locationSearch(query: $query, limit: $limit) {
      displayName
      lat
      lon
    }
  }
`;

// ─── Transit Queries ────────────────────────────────────────────

export const GET_TRANSIT_ARRIVALS = gql`
  query GetTransitArrivals($stopId: String!) {
    transitArrivals(stopId: $stopId) {
      routeId
      routeShortName
      tripHeadsign
      scheduledArrival
      predictedArrival
      minutesUntilArrival
      isRealTime
      status
      vehicleId
    }
  }
`;

export const GET_TRANSIT_STOP = gql`
  query GetTransitStop($stopId: String!) {
    transitStop(stopId: $stopId) {
      id
      name
      direction
      lat
      lon
      routeIds
    }
  }
`;

export const GET_TRANSIT_NEARBY_STOPS = gql`
  query GetTransitNearbyStops($lat: Float!, $lon: Float!, $radius: Int) {
    transitNearbyStops(lat: $lat, lon: $lon, radius: $radius) {
      id
      name
      direction
      lat
      lon
      routeIds
    }
  }
`;

// ─── Worship Songs ──────────────────────────────────────────────

const WORSHIP_SONG_FIELDS = gql`
  fragment WorshipSongFields on WorshipSong {
    id
    title
    artist
    originalKey
    format
    content
    notes
    youtubeUrl
    bpm
    tags
    createdAt
    updatedAt
    createdBy
  }
`;

const WORSHIP_SONG_LIST_FIELDS = gql`
  fragment WorshipSongListFields on WorshipSongListItem {
    id
    title
    artist
    originalKey
    format
    tags
    updatedAt
  }
`;

export const GET_WORSHIP_SONGS_LIST = gql`
  ${WORSHIP_SONG_LIST_FIELDS}
  query GetWorshipSongsList($limit: Int, $offset: Int, $search: String, $artist: String, $tag: String, $format: String, $favoriteIds: [String!]) {
    worshipSongsList(limit: $limit, offset: $offset, search: $search, artist: $artist, tag: $tag, format: $format, favoriteIds: $favoriteIds) {
      songs {
        ...WorshipSongListFields
      }
      totalCount
      allArtists
      allTags
    }
  }
`;

export const GET_WORSHIP_SONG = gql`
  ${WORSHIP_SONG_FIELDS}
  query GetWorshipSong($id: ID!) {
    worshipSong(id: $id) {
      ...WorshipSongFields
    }
  }
`;

export const ADD_WORSHIP_SONG = gql`
  ${WORSHIP_SONG_FIELDS}
  mutation AddWorshipSong($input: WorshipSongInput!) {
    addWorshipSong(input: $input) {
      ...WorshipSongFields
    }
  }
`;

export const UPDATE_WORSHIP_SONG = gql`
  ${WORSHIP_SONG_FIELDS}
  mutation UpdateWorshipSong($id: ID!, $input: WorshipSongUpdateInput!) {
    updateWorshipSong(id: $id, input: $input) {
      ...WorshipSongFields
    }
  }
`;

export const DELETE_WORSHIP_SONG = gql`
  mutation DeleteWorshipSong($id: ID!) {
    deleteWorshipSong(id: $id)
  }
`;

// ─── Worship Setlists ────────────────────────────────────────

const SETLIST_ENTRY_FIELDS = gql`
  fragment SetlistEntryFields on SetlistEntry {
    songId
    position
    snapshotTitle
    snapshotKey
  }
`;

const SETLIST_FIELDS = gql`
  fragment SetlistFields on Setlist {
    id
    name
    serviceDate
    entries {
      ...SetlistEntryFields
    }
    createdAt
    updatedAt
    createdBy
  }
  ${SETLIST_ENTRY_FIELDS}
`;

export const GET_WORSHIP_SETLISTS = gql`
  query GetWorshipSetlists {
    worshipSetlists {
      id
      name
      serviceDate
      updatedAt
      createdBy
      entries {
        ...SetlistEntryFields
      }
    }
  }
  ${SETLIST_ENTRY_FIELDS}
`;

export const GET_WORSHIP_SETLIST = gql`
  query GetWorshipSetlist($id: ID!) {
    worshipSetlist(id: $id) {
      ...SetlistFields
    }
  }
  ${SETLIST_FIELDS}
`;

export const ADD_WORSHIP_SETLIST = gql`
  mutation AddWorshipSetlist($input: WorshipSetlistInput!) {
    addWorshipSetlist(input: $input) {
      ...SetlistFields
    }
  }
  ${SETLIST_FIELDS}
`;

export const UPDATE_WORSHIP_SETLIST = gql`
  mutation UpdateWorshipSetlist($id: ID!, $input: WorshipSetlistUpdateInput!) {
    updateWorshipSetlist(id: $id, input: $input) {
      ...SetlistFields
    }
  }
  ${SETLIST_FIELDS}
`;

export const DELETE_WORSHIP_SETLIST = gql`
  mutation DeleteWorshipSetlist($id: ID!) {
    deleteWorshipSetlist(id: $id)
  }
`;

// ─── Cloud Files ────────────────────────────────────────────

export const GET_CLOUD_FILES = gql`
  query GetCloudFiles {
    cloudFiles {
      id
      fileName
      contentType
      size
      downloadUrl
      storagePath
      folderId
      uploadedAt
      folderId
    }
  }
`;

export const GET_SHARED_FILES = gql`
  query GetSharedFiles {
    sharedFiles {
      id
      fileName
      contentType
      size
      downloadUrl
      storagePath
      sharedByUid
      sharedByName
      sharedAt
    }
  }
`;

export const SHARE_FILE = gql`
  mutation ShareFile($fileId: ID!) {
    shareFile(fileId: $fileId) {
      ok
      downloadUrl
    }
  }
`;

export const DELETE_FILE = gql`
  mutation DeleteFile($fileId: ID!) {
    deleteFile(fileId: $fileId)
  }
`;

export const DELETE_SHARED_FILE = gql`
  mutation DeleteSharedFile($fileId: ID!) {
    deleteSharedFile(fileId: $fileId)
  }
`;

// ─── Cloud Files Enhancements ────────────────────────────────

export const GET_FOLDERS = gql`
  query GetFolders {
    folders {
      id
      name
      parentFolderId
      createdAt
      depth
    }
  }
`;

export const GET_FILE_SHARE_RECIPIENTS = gql`
  query GetFileShareRecipients($fileId: ID!) {
    fileShareRecipients(fileId: $fileId) {
      recipientUid
      recipientName
      shareId
      sharedAt
    }
  }
`;

export const GET_FILES_SHARED_WITH_ME = gql`
  query GetFilesSharedWithMe {
    filesSharedWithMe {
      shareId
      ownerUid
      ownerName
      fileId
      fileName
      contentType
      size
      downloadUrl
      sharedAt
    }
  }
`;

export const RENAME_FILE = gql`
  mutation RenameFile($fileId: ID!, $newName: String!) {
    renameFile(fileId: $fileId, newName: $newName) {
      id
      fileName
    }
  }
`;

export const CREATE_FOLDER = gql`
  mutation CreateFolder($name: String!, $parentFolderId: ID) {
    createFolder(name: $name, parentFolderId: $parentFolderId) {
      id
      name
      parentFolderId
      createdAt
      depth
    }
  }
`;

export const DELETE_FOLDER = gql`
  mutation DeleteFolder($folderId: ID!, $deleteContents: Boolean!) {
    deleteFolder(folderId: $folderId, deleteContents: $deleteContents)
  }
`;

export const RENAME_FOLDER = gql`
  mutation RenameFolder($folderId: ID!, $newName: String!) {
    renameFolder(folderId: $folderId, newName: $newName) {
      id
      name
    }
  }
`;

export const MOVE_FILE = gql`
  mutation MoveFile($fileId: ID!, $targetFolderId: ID) {
    moveFile(fileId: $fileId, targetFolderId: $targetFolderId) {
      id
      folderId
    }
  }
`;

export const SHARE_FILE_WITH = gql`
  mutation ShareFileWith($fileId: ID!, $recipientEmail: String!) {
    shareFileWith(fileId: $fileId, recipientEmail: $recipientEmail) {
      ok
      shareId
    }
  }
`;

export const REVOKE_FILE_ACCESS = gql`
  mutation RevokeFileAccess($shareId: String!) {
    revokeFileAccess(shareId: $shareId)
  }
`;

// ─── Baby Photos ─────────────────────────────────────────────

export const GET_BABY_PHOTOS = gql`
  query GetBabyPhotos {
    babyPhotos {
      stageId
      photoId
      photoUrl
      caption
      uploadedAt
    }
  }
`;

export const DELETE_BABY_PHOTO = gql`
  mutation DeleteBabyPhoto($stageId: Int!, $photoId: String!) {
    deleteBabyPhoto(stageId: $stageId, photoId: $photoId)
  }
`;

export const GET_BABY_MILESTONE_NOTES = gql`
  query GetBabyMilestoneNotes {
    babyMilestoneNotes {
      stageId
      notes
    }
  }
`;

export const SAVE_BABY_MILESTONE_NOTES = gql`
  mutation SaveBabyMilestoneNotes($stageId: Int!, $notes: String!) {
    saveBabyMilestoneNotes(stageId: $stageId, notes: $notes)
  }
`;

// ─── Digital Library ──────────────────────────────────────────

const BOOK_FIELDS = gql`
  fragment BookFields on Book {
    id
    title
    author
    description
    language
    coverUrl
    epubUrl
    fileSize
    chapterCount
    totalCharacters
    uploadedBy {
      uid
      displayName
    }
    uploadedAt
    audioStatus
    audioProgress
    audioError
    zipStatus
    zipUrl
    zipSize
    zipGeneratedAt
    zipError
  }
`;

export const GET_BOOKS = gql`
  ${BOOK_FIELDS}
  query GetBooks {
    books {
      ...BookFields
    }
  }
`;

export const GET_BOOK_CHAPTERS = gql`
  query GetBookChapters($bookId: ID!) {
    bookChapters(bookId: $bookId) {
      id
      index
      title
      href
      characterCount
      audioUrl
      audioDuration
      nasArchived
      nasPath
    }
  }
`;

export const GET_BOOK_CONVERSION_PROGRESS = gql`
  query GetBookConversionProgress($bookId: ID!) {
    bookConversionProgress(bookId: $bookId) {
      audioStatus
      audioProgress
      audioError
      canContinue
    }
  }
`;

export const GET_TTS_QUOTA = gql`
  query GetTtsQuota {
    ttsQuota {
      wavenetStandard { used limit remaining }
      neural2Polyglot { used limit remaining }
      chirp3 { used limit remaining }
    }
  }
`;

export const GET_STORAGE_USAGE = gql`
  query GetStorageUsage {
    storageUsage {
      usedBytes
      totalBytes
      cachedAt
    }
  }
`;

export const GET_CONVERSION_JOBS = gql`
  query GetConversionJobs($bookId: ID!) {
    conversionJobs(bookId: $bookId) {
      id
      bookId
      chapterIndex
      voiceName
      status
      error
      createdAt
    }
  }
`;

export const SUBMIT_CHAPTER_CONVERSIONS = gql`
  mutation SubmitChapterConversions($bookId: ID!, $chapterIndices: [Int!]!, $voiceName: String!) {
    submitChapterConversions(bookId: $bookId, chapterIndices: $chapterIndices, voiceName: $voiceName) {
      id
      chapterIndex
      status
    }
  }
`;

export const SUBMIT_BATCH_CONVERSION = gql`
  mutation SubmitBatchConversion($bookId: ID!, $chapterIndices: [Int!]!, $voiceName: String!) {
    submitBatchConversion(bookId: $bookId, chapterIndices: $chapterIndices, voiceName: $voiceName) {
      id
      status
      chapterIndices
      completedChapters
    }
  }
`;

export const GET_CONVERSION_BATCH_JOB = gql`
  query GetConversionBatchJob($bookId: ID!) {
    conversionBatchJob(bookId: $bookId) {
      id
      bookId
      chapterIndices
      voiceName
      status
      currentChapter
      completedChapters
      error
      createdAt
    }
  }
`;

export const UPLOAD_BOOK = gql`
  mutation UploadBook($fileBase64: String!) {
    uploadBook(fileBase64: $fileBase64) {
      id title author description language coverUrl epubUrl
      fileSize chapterCount totalCharacters audioStatus audioProgress
      uploadedBy { uid displayName }
      uploadedAt
    }
  }
`;

export const DELETE_CHAPTER_AUDIO = gql`
  mutation DeleteChapterAudio($bookId: ID!, $chapterIndex: Int!) {
    deleteChapterAudio(bookId: $bookId, chapterIndex: $chapterIndex)
  }
`;

export const RESET_BOOK_CONVERSION = gql`
  mutation ResetBookConversion($bookId: ID!) {
    resetBookConversion(bookId: $bookId)
  }
`;

export const CANCEL_BOOK_CONVERSION = gql`
  mutation CancelBookConversion($bookId: ID!) {
    cancelBookConversion(bookId: $bookId)
  }
`;

export const PREVIEW_VOICE = gql`
  mutation PreviewVoice($voiceName: String!) {
    previewVoice(voiceName: $voiceName)
  }
`;

export const DELETE_BOOK = gql`
  mutation DeleteBook($id: ID!) {
    deleteBook(id: $id)
  }
`;

export const RESTORE_BOOK = gql`
  mutation RestoreBook($id: ID!) {
    restoreBook(id: $id)
  }
`;

export const PERMANENT_DELETE_BOOK = gql`
  mutation PermanentDeleteBook($id: ID!) {
    permanentDeleteBook(id: $id)
  }
`;

export const REQUEST_BOOK_ZIP = gql`
  mutation RequestBookZip($bookId: ID!) {
    requestBookZip(bookId: $bookId)
  }
`;

export const DELETE_BOOK_ZIP = gql`
  mutation DeleteBookZip($bookId: ID!) {
    deleteBookZip(bookId: $bookId)
  }
`;

// ─── Interview Queries ──────────────────────────────────────────

export const GET_QUESTION_BANK = gql`
  query GetQuestionBank {
    questionBank {
      chapters
      questions {
        id
        chapter
        chapterSlug
        difficulty
        title
        description
        tags
      }
    }
  }
`;

export const GET_INTERVIEW_SESSIONS = gql`
  query GetInterviewSessions {
    interviewSessions {
      id
      questionPreview
      messageCount
      mode
      updatedAt
      createdAt
    }
  }
`;

export const GET_INTERVIEW_SESSION = gql`
  query GetInterviewSession($id: ID!) {
    interviewSession(id: $id) {
      id
      question
      document
      messages {
        id
        role
        content
        timestamp
      }
      sessionName
      interviewState
      scores
      config
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_INTERVIEW_QUESTION = gql`
  mutation CreateInterviewQuestion($input: CreateInterviewQuestionInput!) {
    createInterviewQuestion(input: $input) {
      id
      chapter
      chapterSlug
      difficulty
      title
      description
      tags
    }
  }
`;

export const UPDATE_INTERVIEW_QUESTION = gql`
  mutation UpdateInterviewQuestion($id: ID!, $input: UpdateInterviewQuestionInput!) {
    updateInterviewQuestion(id: $id, input: $input) {
      id
      chapter
      chapterSlug
      difficulty
      title
      description
      tags
    }
  }
`;

export const DELETE_INTERVIEW_QUESTION = gql`
  mutation DeleteInterviewQuestion($id: ID!) {
    deleteInterviewQuestion(id: $id)
  }
`;

export const SAVE_INTERVIEW_SESSION = gql`
  mutation SaveInterviewSession($input: SaveInterviewSessionInput!) {
    saveInterviewSession(input: $input) {
      id
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_INTERVIEW_SESSION = gql`
  mutation DeleteInterviewSession($id: ID!) {
    deleteInterviewSession(id: $id)
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

// ─── Web Crawler ────────────────────────────────────────────────

export const GET_CRAWL_JOBS = gql`
  query GetCrawlJobs {
    crawlJobs {
      id
      url
      status
      maxDepth
      maxPages
      pagesVisited
      createdAt
      updatedAt
    }
  }
`;

export const GET_CRAWL_JOB_DETAIL = gql`
  query GetCrawlJobDetail($id: ID!) {
    crawlJobDetail(id: $id) {
      job {
        id
        url
        status
        maxDepth
        maxPages
        pagesVisited
        createdAt
        updatedAt
      }
      documents {
        id
        jobId
        url
        title
        contentPreview
        fullContent
        contentTruncated
        description
        author
        publishDate
        ogImage
        statusCode
        contentType
        crawledAt
        size
        depth
      }
      traces {
        id
        jobId
        timestamp
        level
        message
        url
        durationMs
      }
    }
  }
`;

export const START_CRAWL = gql`
  mutation StartCrawl($input: StartCrawlInput!) {
    startCrawl(input: $input) {
      id
      url
      status
      maxDepth
      maxPages
      pagesVisited
      createdAt
      updatedAt
    }
  }
`;

export const STOP_CRAWL = gql`
  mutation StopCrawl($id: ID!) {
    stopCrawl(id: $id) {
      id
      url
      status
      maxDepth
      maxPages
      pagesVisited
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CRAWL_JOB = gql`
  mutation DeleteCrawlJob($id: ID!) {
    deleteCrawlJob(id: $id)
  }
`;

export const SEARCH_CRAWL_JOBS = gql`
  query SearchCrawlJobs($query: String!) {
    searchCrawlJobs(query: $query) {
      id
      url
      status
      maxDepth
      maxPages
      pagesVisited
      createdAt
      updatedAt
    }
  }
`;

// ─── Deals ──────────────────────────────────────────────────────
export const GET_DEALS = gql`
  query GetDeals {
    deals {
      id
      title
      url
      source
      price
      originalPrice
      store
      category
      thumbnail
      postedAt
      score
    }
  }
`;

// ─── Radio Stations ──────────────────────────────────────────────
const RADIO_STATION_FIELDS = gql`
  fragment RadioStationFields on RadioStation {
    stationuuid
    name
    url
    url_resolved
    favicon
    tags
    country
    language
    codec
    bitrate
    votes
  }
`;

export const GET_RADIO_STATIONS = gql`
  ${RADIO_STATION_FIELDS}
  query GetRadioStations($query: String, $limit: Int, $tag: String, $country: String) {
    radioStations(query: $query, limit: $limit, tag: $tag, country: $country) {
      ...RadioStationFields
    }
  }
`;

export const GET_RADIO_TAGS = gql`
  query GetRadioTags($limit: Int) {
    radioTags(limit: $limit) {
      name
      stationCount
    }
  }
`;

export const VOTE_RADIO_STATION = gql`
  mutation VoteRadioStation($uuid: String!) {
    voteRadioStation(uuid: $uuid)
  }
`;

export const GET_RADIO_STATIONS_BY_UUIDS = gql`
  ${RADIO_STATION_FIELDS}
  query GetRadioStationsByUuids($uuids: [String!]!) {
    radioStationsByUuids(uuids: $uuids) {
      ...RadioStationFields
    }
  }
`;

// ─── Notes ───────────────────────────────────────────────────────
const NOTE_FIELDS = gql`
  fragment NoteFields on Note {
    id
    title
    content
    createdAt
    updatedAt
  }
`;

export const GET_NOTES = gql`
  ${NOTE_FIELDS}
  query GetNotes($search: String) {
    notes(limit: 500, search: $search) {
      ...NoteFields
    }
  }
`;

export const ADD_NOTE = gql`
  ${NOTE_FIELDS}
  mutation AddNote($input: NoteInput!) {
    addNote(input: $input) {
      ...NoteFields
    }
  }
`;

export const UPDATE_NOTE = gql`
  ${NOTE_FIELDS}
  mutation UpdateNote($id: ID!, $input: NoteUpdateInput!) {
    updateNote(id: $id, input: $input) {
      ...NoteFields
    }
  }
`;

export const DELETE_NOTE = gql`
  mutation DeleteNote($id: ID!) {
    deleteNote(id: $id)
  }
`;

// ─── Hiking Route ────────────────────────────────────────────────
export const CALC_ROUTE = gql`
  query CalcRoute($startLon: Float!, $startLat: Float!, $endLon: Float!, $endLat: Float!) {
    calcRoute(startLon: $startLon, startLat: $startLat, endLon: $endLon, endLat: $endLat) {
      coordinates
      distance
      duration
    }
  }
`;

export const CALC_ROUTE_MULTI = gql`
  query CalcRouteMulti($waypoints: [CoordinateInput!]!) {
    calcRouteMulti(waypoints: $waypoints) {
      coordinates
      distance
      duration
    }
  }
`;

// ─── Resume Tailor AI ────────────────────────────────────────────

export const GET_RESUME_FACT_BANK = gql`
  query GetResumeFactBank {
    resumeFactBank {
      contact { name email phone location linkedin github website }
      experiences {
        id company location startDate endDate
        versions { id title bullets }
      }
      education { id school location degree field startDate endDate notes }
      skills
      projects { id name startDate endDate bullets }
      updatedAt
    }
  }
`;

export const GET_RESUME_APPLICATIONS = gql`
  query GetResumeApplications($limit: Int) {
    resumeApplications(limit: $limit) {
      id date company role atsScoreBefore atsScoreAfter resumeSnapshot jdText
    }
  }
`;

export const GET_RESUME_PARSE_JOB = gql`
  query GetResumeParseJob($id: ID!) {
    resumeParseJob(id: $id) {
      id
      status
      error
      result {
        contact { name email phone location linkedin github website }
        experiences {
          id company location startDate endDate
          versions { id title bullets }
        }
        education { id school location degree field startDate endDate notes }
        skills
        projects { id name startDate endDate bullets }
        updatedAt
      }
      createdAt
    }
  }
`;

export const GET_RESUME_ACTIVE_PARSE_JOB = gql`
  query GetResumeActiveParseJob {
    resumeActiveParseJob {
      id
      status
      createdAt
    }
  }
`;

export const SUBMIT_RESUME_PARSE = gql`
  mutation SubmitResumeParse($fileName: String!, $fileBase64: String!, $contentType: String!, $model: String!, $endpointId: ID) {
    submitResumeParse(fileName: $fileName, fileBase64: $fileBase64, contentType: $contentType, model: $model, endpointId: $endpointId) {
      id
      status
      createdAt
    }
  }
`;

export const SCRAPE_JOB_URL = gql`
  query ScrapeJobUrl($url: String!) {
    scrapeJobUrl(url: $url)
  }
`;

export const SAVE_RESUME_FACT_BANK = gql`
  mutation SaveResumeFactBank($input: ResumeFactBankInput!) {
    saveResumeFactBank(input: $input) {
      updatedAt
    }
  }
`;

export const GENERATE_RESUME = gql`
  mutation GenerateResume($jdText: String!, $model: String!, $endpointId: ID) {
    generateResume(jdText: $jdText, model: $model, endpointId: $endpointId) {
      contact { name email phone location linkedin github website }
      experiences {
        id company location startDate endDate
        versions { id title bullets }
      }
      education { id school location degree field startDate endDate notes }
      skills
      projects { id name startDate endDate bullets }
      atsScore {
        beforeScore score covered missing beforeCovered beforeMissing hardSkillsMissing
      }
      keywordReport {
        role company hardSkills titleKeywords actionKeywords businessContext
        domainKeywords hardFilters top10 alreadyHave needToAdd
      }
    }
  }
`;

export const BOOST_ATS_SCORE = gql`
  mutation BoostAtsScore($resumeJson: String!, $jdText: String!, $model: String!, $endpointId: ID) {
    boostAtsScore(resumeJson: $resumeJson, jdText: $jdText, model: $model, endpointId: $endpointId) {
      contact { name email phone location linkedin github website }
      experiences {
        id company location startDate endDate
        versions { id title bullets }
      }
      education { id school location degree field startDate endDate notes }
      skills
      projects { id name startDate endDate bullets }
      atsScore {
        beforeScore score covered missing beforeCovered beforeMissing hardSkillsMissing
      }
      keywordReport {
        role company hardSkills titleKeywords actionKeywords businessContext
        domainKeywords hardFilters top10 alreadyHave needToAdd
      }
    }
  }
`;

export const SAVE_RESUME_APPLICATION = gql`
  mutation SaveResumeApplication($input: ResumeApplicationInput!) {
    saveResumeApplication(input: $input) {
      id date company role atsScoreBefore atsScoreAfter
    }
  }
`;

export const DELETE_RESUME_APPLICATION = gql`
  mutation DeleteResumeApplication($id: ID!) {
    deleteResumeApplication(id: $id)
  }
`;

// ─── SQL Analytics ──────────────────────────────────────────────

export const GET_SQL_CONNECTION_STATUS = gql`
  query GetSqlConnectionStatus {
    sqlConnectionStatus {
      tunnelUrl
      status
      lastTestedAt
      hasCredentials
    }
  }
`;

export const SAVE_SQL_CONNECTION = gql`
  mutation SaveSqlConnection($input: SqlConnectionInput!) {
    saveSqlConnection(input: $input) {
      tunnelUrl
      status
      lastTestedAt
      hasCredentials
    }
  }
`;

export const TEST_SQL_CONNECTION = gql`
  mutation TestSqlConnection {
    testSqlConnection {
      tunnelUrl
      status
      lastTestedAt
      hasCredentials
    }
  }
`;

export const DELETE_SQL_CONNECTION = gql`
  mutation DeleteSqlConnection {
    deleteSqlConnection
  }
`;

export const GET_SQL_BACKFILL_STATUS = gql`
  query GetSqlBackfillStatus {
    sqlBackfillStatus {
      status
      totalMigrated
      totalErrors
      startedAt
      completedAt
      error
    }
  }
`;

export const START_SQL_BACKFILL = gql`
  mutation StartSqlBackfill {
    startSqlBackfill {
      status
      totalMigrated
      totalErrors
      startedAt
      completedAt
      error
    }
  }
`;

export const CANCEL_SQL_BACKFILL = gql`
  mutation CancelSqlBackfill {
    cancelSqlBackfill
  }
`;

export const GET_SQL_ANALYTICS_SUMMARY = gql`
  query GetSqlAnalyticsSummary($days: Int) {
    sqlAnalyticsSummary(days: $days) {
      totalCalls
      totalInputTokens
      totalOutputTokens
      totalCost
      providerBreakdown {
        provider
        calls
        tokens
        avgLatencyMs
        errorRate
      }
      modelBreakdown {
        model
        provider
        calls
        tokens
        avgLatencyMs
        estimatedCost
      }
      dailyBreakdown {
        date
        calls
        tokens
        avgLatencyMs
        errors
      }
      since
    }
  }
`;

export const GET_SQL_LATENCY_PERCENTILES = gql`
  query GetSqlLatencyPercentiles($days: Int) {
    sqlLatencyPercentiles(days: $days) {
      provider
      model
      p50
      p90
      p99
      sampleSize
    }
  }
`;

export const GET_SQL_TOOL_USAGE_STATS = gql`
  query GetSqlToolUsageStats($days: Int) {
    sqlToolUsageStats(days: $days) {
      toolName
      callCount
      avgDurationMs
      errorRate
    }
  }
`;

export const GET_SQL_TOOL_CO_OCCURRENCES = gql`
  query GetSqlToolCoOccurrences($days: Int, $minCount: Int) {
    sqlToolCoOccurrences(days: $days, minCount: $minCount) {
      toolA
      toolB
      coOccurrences
    }
  }
`;

export const GET_SQL_BENCHMARK_TRENDS = gql`
  query GetSqlBenchmarkTrends($weeks: Int) {
    sqlBenchmarkTrends(weeks: $weeks) {
      endpointName
      model
      week
      avgTps
      avgTtft
      sampleSize
    }
  }
`;

export const SQL_CHAT_SEARCH = gql`
  query SqlChatSearch($query: String!, $limit: Int) {
    sqlChatSearch(query: $query, limit: $limit) {
      id
      timestamp
      provider
      model
      questionPreview
      answerPreview
      latencyMs
      totalTokens
    }
  }
`;

export const SQL_RUN_QUERY = gql`
  mutation SqlRunQuery($sql: String!, $limit: Int) {
    sqlRunQuery(sql: $sql, limit: $limit) {
      columns
      rows
      rowCount
      durationMs
      error
    }
  }
`;


export const GET_QUOTA_SNAPSHOTS = gql`
  query GetQuotaSnapshots($limit: Int) {
    quotaSnapshots(limit: $limit) {
      total
      snapshots {
        id
        collectedAt
        elapsedDays
        daysInMonth
        totalMtdCostUsd
        totalProjectedCostUsd
        errors
        cloudRun {
          totalRequests
          freeTierLimit
          mtdCostUsd
          projectedCostUsd
          byService {
            serviceName
            requests
          }
        }
        functions {
          totalInvocations
          freeTierLimit
          mtdCostUsd
          projectedCostUsd
          byFunction {
            functionName
            invocations
          }
        }
        storage {
          totalBytes
          bandwidthBytes
          freeTierStorageBytes
          freeTierBandwidthBytes
          mtdCostUsd
          projectedCostUsd
          byFolder {
            folder
            bytes
          }
        }
        firestore {
          mtdCostUsd
          projectedCostUsd
          reads {
            today
            peak7d
            freeTierLimit
            exceeded7d
          }
          writes {
            today
            peak7d
            freeTierLimit
            exceeded7d
          }
          deletes {
            today
            peak7d
            freeTierLimit
            exceeded7d
          }
        }
        tts {
          wavenetStandard { used limit remaining }
          neural2Polyglot { used limit remaining }
          chirp3 { used limit remaining }
        }
        artifactRegistry {
          totalBytes
          freeTierBytes
          mtdCostUsd
          projectedCostUsd
          byRepository {
            repository
            bytes
          }
        }
        hosting {
          storageBytes
          dailyDownloadBytes
          freeTierStorageBytes
          freeTierDailyDownloadBytes
          mtdCostUsd
          projectedCostUsd
          unavailable
        }
      }
    }
  }
`;

export const COLLECT_QUOTA_SNAPSHOT = gql`
  mutation CollectQuotaSnapshot {
    collectQuotaSnapshot {
      id
      collectedAt
      elapsedDays
      daysInMonth
      totalMtdCostUsd
      totalProjectedCostUsd
      errors
      cloudRun {
        totalRequests
        freeTierLimit
        mtdCostUsd
        projectedCostUsd
        byService {
          serviceName
          requests
        }
      }
      functions {
        totalInvocations
        freeTierLimit
        mtdCostUsd
        projectedCostUsd
        byFunction {
          functionName
          invocations
        }
      }
      storage {
        totalBytes
        bandwidthBytes
        freeTierStorageBytes
        freeTierBandwidthBytes
        mtdCostUsd
        projectedCostUsd
        byFolder {
          folder
          bytes
        }
      }
      firestore {
        mtdCostUsd
        projectedCostUsd
        reads {
          today
          peak7d
          freeTierLimit
          exceeded7d
        }
        writes {
          today
          peak7d
          freeTierLimit
          exceeded7d
        }
        deletes {
          today
          peak7d
          freeTierLimit
          exceeded7d
        }
      }
      tts {
        wavenetStandard { used limit remaining }
        neural2Polyglot { used limit remaining }
        chirp3 { used limit remaining }
      }
      artifactRegistry {
        totalBytes
        freeTierBytes
        mtdCostUsd
        projectedCostUsd
        byRepository {
          repository
          bytes
        }
      }
      hosting {
        storageBytes
        dailyDownloadBytes
        freeTierStorageBytes
        freeTierDailyDownloadBytes
        mtdCostUsd
        projectedCostUsd
        unavailable
      }
    }
  }
`;

export const DUMP_QUOTA_TO_SQL = gql`
  mutation DumpQuotaToSql {
    dumpQuotaToSql
  }
`;

// ─── NAS Storage ──────────────────────────────────────────────

export const GET_NAS_CONNECTION_STATUS = gql`
  query GetNasConnectionStatus {
    nasConnectionStatus {
      nasUrl
      destFolder
      status
      lastTestedAt
      hasCredentials
    }
  }
`;

export const SAVE_NAS_CONNECTION = gql`
  mutation SaveNasConnection($input: NasConnectionInput!) {
    saveNasConnection(input: $input) {
      nasUrl
      destFolder
      status
      lastTestedAt
      hasCredentials
    }
  }
`;

export const TEST_NAS_CONNECTION = gql`
  mutation TestNasConnection {
    testNasConnection {
      nasUrl
      destFolder
      status
      lastTestedAt
      hasCredentials
    }
  }
`;

export const DELETE_NAS_CONNECTION = gql`
  mutation DeleteNasConnection {
    deleteNasConnection
  }
`;

export const ARCHIVE_CHAPTER_TO_NAS = gql`
  mutation ArchiveChapterToNas($bookId: ID!, $chapterIndex: Int!) {
    archiveChapterToNas(bookId: $bookId, chapterIndex: $chapterIndex) {
      bookId
      chapterIndex
      success
      nasPath
      error
    }
  }
`;

export const ARCHIVE_BOOK_TO_NAS = gql`
  mutation ArchiveBookToNas($bookId: ID!) {
    archiveBookToNas(bookId: $bookId) {
      bookId
      chapterIndex
      success
      nasPath
      error
    }
  }
`;

export const RESTORE_CHAPTER_FROM_NAS = gql`
  mutation RestoreChapterFromNas($bookId: ID!, $chapterIndex: Int!) {
    restoreChapterFromNas(bookId: $bookId, chapterIndex: $chapterIndex) {
      id
      index
      title
      href
      characterCount
      audioUrl
      audioDuration
      nasArchived
      nasPath
    }
  }
`;

// ─── HSA Expenses ─────────────────────────────────────────────

export const GET_HSA_EXPENSES = gql`
  query GetHsaExpenses {
    hsaExpenses {
      id
      provider
      dateOfService
      amountCents
      category
      description
      status
      receiptUrl
      receiptContentType
      createdAt
      updatedAt
    }
  }
`;

export const ADD_HSA_EXPENSE = gql`
  mutation AddHsaExpense($input: HSAExpenseInput!) {
    addHsaExpense(input: $input) {
      id
      provider
      dateOfService
      amountCents
      category
      description
      status
      receiptUrl
      receiptContentType
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_HSA_EXPENSE = gql`
  mutation UpdateHsaExpense($id: ID!, $input: HSAExpenseUpdateInput!) {
    updateHsaExpense(id: $id, input: $input) {
      id
      provider
      dateOfService
      amountCents
      category
      description
      status
      receiptUrl
      receiptContentType
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_HSA_EXPENSE = gql`
  mutation DeleteHsaExpense($id: ID!) {
    deleteHsaExpense(id: $id)
  }
`;

export const UPLOAD_HSA_RECEIPT = gql`
  mutation UploadHsaReceipt($expenseId: ID!, $fileBase64: String!, $fileName: String!, $contentType: String!) {
    uploadHsaReceipt(expenseId: $expenseId, fileBase64: $fileBase64, fileName: $fileName, contentType: $contentType) {
      id
      provider
      dateOfService
      amountCents
      category
      description
      status
      receiptUrl
      receiptContentType
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_HSA_RECEIPT = gql`
  mutation DeleteHsaReceipt($expenseId: ID!) {
    deleteHsaReceipt(expenseId: $expenseId) {
      id
      provider
      dateOfService
      amountCents
      category
      description
      status
      receiptUrl
      receiptContentType
      createdAt
      updatedAt
    }
  }
`;

export const MARK_HSA_EXPENSE_REIMBURSED = gql`
  mutation MarkHsaExpenseReimbursed($id: ID!, $reimbursed: Boolean!) {
    markHsaExpenseReimbursed(id: $id, reimbursed: $reimbursed) {
      id
      provider
      dateOfService
      amountCents
      category
      description
      status
      receiptUrl
      receiptContentType
      createdAt
      updatedAt
    }
  }
`;
