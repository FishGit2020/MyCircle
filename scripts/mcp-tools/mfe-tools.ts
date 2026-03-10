import { z } from 'zod';

/**
 * Shared tool definitions for the MyCircle AI assistant.
 * Used by both the MCP server (schema exposure) and Gemini backend (function calling).
 *
 * Each tool has a Zod schema for parameters, making definitions type-safe
 * and convertible to both MCP and Gemini formats.
 */

export interface ToolDef {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  category: string;
  /** Whether this tool returns a frontend action instead of data */
  isFrontendAction?: boolean;
}

// ─── Existing tools (refactored from inline declarations) ─────

export const getWeatherTool: ToolDef = {
  name: 'getWeather',
  description: 'Get current weather for a city. Returns temperature, conditions, humidity, and wind.',
  parameters: z.object({
    city: z.string().describe('City name (e.g., "Tokyo", "New York")'),
  }),
  category: 'weather',
};

export const searchCitiesTool: ToolDef = {
  name: 'searchCities',
  description: 'Search for cities by name. Returns matching city names with coordinates.',
  parameters: z.object({
    query: z.string().describe('Search query for city name'),
  }),
  category: 'weather',
};

export const getStockQuoteTool: ToolDef = {
  name: 'getStockQuote',
  description: 'Get the current stock price and daily change for a stock symbol.',
  parameters: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., "AAPL", "GOOGL")'),
  }),
  category: 'stocks',
};

export const getCryptoPricesTool: ToolDef = {
  name: 'getCryptoPrices',
  description: 'Get current prices for major cryptocurrencies (Bitcoin, Ethereum, Solana, etc.) from CoinGecko.',
  parameters: z.object({}),
  category: 'stocks',
};

export const navigateToTool: ToolDef = {
  name: 'navigateTo',
  description: 'Navigate the user to a specific page in the MyCircle app. Available pages: weather (home), stocks, podcasts, weather/compare, bible, worship, notebook, flashcards, baby, child-dev, daily-log, files, benchmark, immigration, ai, library, family-games, doc-scanner, hiking.',
  parameters: z.object({
    page: z.string().describe('Page to navigate to: "weather", "stocks", "podcasts", "weather/compare", "bible", "worship", "notebook", "flashcards", "baby", "child-dev", "daily-log", "files", "benchmark", "immigration", "ai", "library", "family-games", "doc-scanner", "hiking"'),
  }),
  category: 'navigation',
  isFrontendAction: true,
};

export const listFavoriteCitiesTool: ToolDef = {
  name: 'listFavoriteCities',
  description: 'List the user\'s favorite cities. Returns city names from user context. Use this when the user asks about their favorite cities or wants weather for all favorites.',
  parameters: z.object({}),
  category: 'weather',
};

export const listStockWatchlistTool: ToolDef = {
  name: 'listStockWatchlist',
  description: 'List the user\'s stock watchlist symbols. Returns stock symbols from user context.',
  parameters: z.object({}),
  category: 'stocks',
};

// ─── New tools ────────────────────────────────────────────────

export const addFlashcardTool: ToolDef = {
  name: 'addFlashcard',
  description: 'Create a new flashcard for the user to study. Returns an action for the frontend to execute.',
  parameters: z.object({
    front: z.string().describe('The question or prompt side of the flashcard'),
    back: z.string().describe('The answer side of the flashcard'),
    category: z.string().optional().describe('Category for the flashcard (e.g., "custom", "bible", "chinese")'),
    type: z.string().optional().describe('Card type: "custom", "bible", "chinese", "english"'),
  }),
  category: 'flashcards',
  isFrontendAction: true,
};

export const getBibleVerseTool: ToolDef = {
  name: 'getBibleVerse',
  description: 'Look up a Bible verse or passage. Returns the verse text and reference.',
  parameters: z.object({
    reference: z.string().describe('Bible reference (e.g., "John 3:16", "Psalm 23:1-6", "Genesis 1:1")'),
    translation: z.string().optional().describe('Bible translation/version ID (defaults to NIV)'),
  }),
  category: 'bible',
};

export const searchPodcastsTool: ToolDef = {
  name: 'searchPodcasts',
  description: 'Search for podcasts by keyword. Returns matching podcast feeds with title, author, and artwork.',
  parameters: z.object({
    query: z.string().describe('Search query for podcast name or topic'),
  }),
  category: 'podcasts',
};

export const addBookmarkTool: ToolDef = {
  name: 'addBookmark',
  description: 'Bookmark a Bible passage for the user. Returns an action for the frontend to execute.',
  parameters: z.object({
    reference: z.string().describe('Bible reference to bookmark (e.g., "John 3:16")'),
  }),
  category: 'bible',
  isFrontendAction: true,
};

export const listFlashcardsTool: ToolDef = {
  name: 'listFlashcards',
  description: 'List the user\'s flashcards, optionally filtered by type. Returns an action for the frontend to read from local storage.',
  parameters: z.object({
    type: z.string().optional().describe('Filter by card type: "custom", "bible", "chinese", "english"'),
  }),
  category: 'flashcards',
  isFrontendAction: true,
};

export const checkCaseStatusTool: ToolDef = {
  name: 'checkCaseStatus',
  description: 'Check the status of a USCIS immigration case by receipt number. Returns the current status, form type, and description.',
  parameters: z.object({
    receiptNumber: z.string().describe('USCIS receipt number (e.g., "MSC2190012345")'),
  }),
  category: 'immigration',
};

export const addNoteTool: ToolDef = {
  name: 'addNote',
  description: 'Create a new note in the user\'s notebook. Returns an action for the frontend to execute.',
  parameters: z.object({
    title: z.string().describe('Note title'),
    content: z.string().describe('Note content (supports markdown)'),
  }),
  category: 'notebook',
  isFrontendAction: true,
};

export const addDailyLogEntryTool: ToolDef = {
  name: 'addDailyLogEntry',
  description: 'Add a daily log entry for the user. Returns an action for the frontend to execute.',
  parameters: z.object({
    date: z.string().describe('Date for the entry (YYYY-MM-DD format)'),
    content: z.string().describe('Description of activity'),
  }),
  category: 'daily-log',
  isFrontendAction: true,
};

export const setBabyDueDateTool: ToolDef = {
  name: 'setBabyDueDate',
  description: 'Set or update the baby due date. Returns an action for the frontend to execute.',
  parameters: z.object({
    dueDate: z.string().describe('Due date in YYYY-MM-DD format'),
  }),
  category: 'baby-tracker',
  isFrontendAction: true,
};

export const addChildMilestoneTool: ToolDef = {
  name: 'addChildMilestone',
  description: 'Record a child development milestone. Returns an action for the frontend to execute.',
  parameters: z.object({
    milestone: z.string().describe('Description of the milestone achieved'),
    date: z.string().optional().describe('Date achieved (YYYY-MM-DD), defaults to today'),
  }),
  category: 'child-development',
  isFrontendAction: true,
};

export const addImmigrationCaseTool: ToolDef = {
  name: 'addImmigrationCase',
  description: 'Add a USCIS immigration case to track. Returns an action for the frontend to execute.',
  parameters: z.object({
    receiptNumber: z.string().describe('USCIS receipt number (e.g., "MSC2190012345")'),
    formType: z.string().optional().describe('Form type (e.g., "I-485", "I-140")'),
    nickname: z.string().optional().describe('A friendly name for this case'),
  }),
  category: 'immigration',
  isFrontendAction: true,
};

export const planHikingRouteTool: ToolDef = {
  name: 'planHikingRoute',
  description: 'Plan a hiking route between two coordinates on the hiking map. Returns an action for the frontend to execute.',
  parameters: z.object({
    startLat: z.number().describe('Start latitude'),
    startLng: z.number().describe('Start longitude'),
    endLat: z.number().describe('End latitude'),
    endLng: z.number().describe('End longitude'),
  }),
  category: 'hiking-map',
  isFrontendAction: true,
};

// ─── All tools registry ───────────────────────────────────────

export const ALL_TOOLS: ToolDef[] = [
  getWeatherTool,
  searchCitiesTool,
  listFavoriteCitiesTool,
  getStockQuoteTool,
  listStockWatchlistTool,
  getCryptoPricesTool,
  navigateToTool,
  addFlashcardTool,
  getBibleVerseTool,
  searchPodcastsTool,
  addBookmarkTool,
  listFlashcardsTool,
  checkCaseStatusTool,
  addNoteTool,
  addDailyLogEntryTool,
  setBabyDueDateTool,
  addChildMilestoneTool,
  addImmigrationCaseTool,
  planHikingRouteTool,
];

/** Tools that execute on the backend (return data) */
export const BACKEND_TOOLS = ALL_TOOLS.filter(t => !t.isFrontendAction);

/** Tools that return actions for the frontend to execute */
export const FRONTEND_ACTION_TOOLS = ALL_TOOLS.filter(t => t.isFrontendAction);
