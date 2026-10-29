import type { Logger } from '../../domain/ports/Logger';

const sensitiveKey = /token|secret|password|otp|birth|email|phone|payload|content|cause|api[_-]?key|authorization|cookie|private[_-]?key|signature/i;
const MAX_DEPTH = 3;

function sanitizeString(value: string) {
  return value
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/(token|api[_-]?key|secret|password|otp)\s*[:=]\s*\S+/gi, '$1=[REDACTED]')
    .replace(/(birth\s*year|year\s*of\s*birth)\s*[:=]?\s*\d{4}/gi, '$1=[REDACTED]')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/\b(?:\+?\d[\d\s-]{7,}\d)\b/g, '[REDACTED_PHONE]');
}

export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[TRUNCATED]';
  if (value === null || typeof value !== 'object') {
    if (typeof value !== 'string') return value;
    const sanitized = sanitizeString(value);
    return sanitized.length > 200 ? `${sanitized.slice(0, 200)}…` : sanitized;
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeForLog(item, depth + 1));

  return Object.fromEntries(
    Object.entries(value).slice(0, 30).map(([key, nestedValue]) => [
      key,
      sensitiveKey.test(key) ? '[REDACTED]' : sanitizeForLog(nestedValue, depth + 1),
    ]),
  );
}

function sanitize(context?: Record<string, unknown>) {
  return context ? sanitizeForLog(context) : undefined;
}

export const consoleLogger: Logger = {
  info: (message, context) => console.info(sanitizeString(message), sanitize(context)),
  warn: (message, context) => console.warn(sanitizeString(message), sanitize(context)),
  error: (message, context) => console.error(sanitizeString(message), sanitize(context)),
};
