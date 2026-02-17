/**
 * Unified logging utility for MyCircle.
 *
 * In production builds, Vite's `esbuild.drop: ['console', 'debugger']` strips
 * all console.* calls from the bundle. This logger adds a thin namespace
 * prefix so logs are easy to filter during development.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const minLevel: LogLevel =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
}

function createLogger(namespace: string) {
  const prefix = `[${namespace}]`;
  return {
    debug: (...args: unknown[]) => { if (shouldLog('debug')) console.debug(prefix, ...args); },
    info: (...args: unknown[]) => { if (shouldLog('info')) console.log(prefix, ...args); },
    warn: (...args: unknown[]) => { if (shouldLog('warn')) console.warn(prefix, ...args); },
    error: (...args: unknown[]) => { if (shouldLog('error')) console.error(prefix, ...args); },
  };
}

export type Logger = ReturnType<typeof createLogger>;
export { createLogger };
