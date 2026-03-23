/**
 * Lightweight structured logger for the agency platform.
 * Outputs JSON lines for easy parsing by log aggregators.
 * No external dependencies — uses console.log/error/warn underneath.
 *
 * Usage:
 *   import { logger } from '@agency/utils/logger';
 *   logger.info('Site created', { slug: 'acme', tier: 'cms' });
 *   logger.error('Deploy failed', { slug: 'acme', error: err });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  msg: string;
  ts: string;
  [key: string]: unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const envLevel = typeof process !== 'undefined'
    ? (process.env.LOG_LEVEL as LogLevel | undefined)
    : undefined;
  return envLevel && LOG_LEVEL_PRIORITY[envLevel] !== undefined ? envLevel : 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[getMinLevel()];
}

function formatError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 5).join('\n'),
    };
  }
  return { error: String(err) };
}

function log(level: LogLevel, msg: string, data?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...data,
  };

  // Serialize error objects if present
  if (entry.error && entry.error instanceof Error) {
    Object.assign(entry, formatError(entry.error));
  }
  if (entry.err && entry.err instanceof Error) {
    Object.assign(entry, formatError(entry.err));
    delete entry.err;
  }

  const json = JSON.stringify(entry);

  switch (level) {
    case 'error':
      console.error(json);
      break;
    case 'warn':
      console.warn(json);
      break;
    default:
      console.log(json);
  }
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, data),
  info: (msg: string, data?: Record<string, unknown>) => log('info', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => log('warn', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log('error', msg, data),
};

/**
 * Audit logger for admin actions.
 * Logs who did what to which resource.
 */
export function auditLog(action: string, details: {
  user?: string;
  slug?: string;
  resource?: string;
  [key: string]: unknown;
}) {
  log('info', `AUDIT: ${action}`, {
    audit: true,
    action,
    ...details,
  });
}
