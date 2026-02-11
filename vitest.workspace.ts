import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/shell/vitest.config.ts',
  'packages/city-search/vitest.config.ts',
  'packages/weather-display/vitest.config.ts',
  'packages/stock-tracker/vitest.config.ts',
  'packages/podcast-player/vitest.config.ts',
  'packages/ai-assistant/vitest.config.ts',
])
