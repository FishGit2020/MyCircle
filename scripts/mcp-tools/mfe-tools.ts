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
  description: 'Navigate the user to a specific page in the MyCircle app. Available pages: weather (home), stocks, podcasts, compare, bible, worship, notebook, flashcards, baby, ai.',
  parameters: z.object({
    page: z.string().describe('Page to navigate to: "weather", "stocks", "podcasts", "compare", "bible", "worship", "notebook", "flashcards", "baby", "ai"'),
  }),
  category: 'navigation',
  isFrontendAction: true,
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

// ─── All tools registry ───────────────────────────────────────

export const ALL_TOOLS: ToolDef[] = [
  getWeatherTool,
  searchCitiesTool,
  getStockQuoteTool,
  getCryptoPricesTool,
  navigateToTool,
  addFlashcardTool,
  getBibleVerseTool,
  searchPodcastsTool,
  addBookmarkTool,
  listFlashcardsTool,
];

/** Tools that execute on the backend (return data) */
export const BACKEND_TOOLS = ALL_TOOLS.filter(t => !t.isFrontendAction);

/** Tools that return actions for the frontend to execute */
export const FRONTEND_ACTION_TOOLS = ALL_TOOLS.filter(t => t.isFrontendAction);
