/**
 * logger.ts — Captures console.log/warn/error + uncaught errors and ships
 * them to the backend so they're visible in Railway logs (Vercel can't show
 * frontend console output, but Railway can show what the backend prints).
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let buffer: { level: string; message: string; timestamp: string }[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function safeStringify(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function getUserId(): string | undefined {
  try {
    // Firebase Auth persists its current user under a key like
    // firebase:authUser:<apiKey>:[DEFAULT] — we just grab the first match.
    const key = Object.keys(localStorage).find((k) => k.startsWith('firebase:authUser:'));
    if (!key) return undefined;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw)?.uid : undefined;
  } catch {
    return undefined;
  }
}

function flush() {
  if (buffer.length === 0) return;
  const logs = buffer;
  buffer = [];
  fetch(`${API_URL}/logs/frontend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs, userId: getUserId() }),
  }).catch(() => {
    // Swallow — logging must never break the app
  });
}

function queue(level: string, args: unknown[]) {
  try {
    buffer.push({
      level,
      message: args.map(safeStringify).join(' '),
      timestamp: new Date().toISOString(),
    });
    if (buffer.length >= 20) {
      flush();
      return;
    }
    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flush();
        flushTimer = null;
      }, 3000);
    }
  } catch {
    // Never let logging crash the app
  }
}

export function initRemoteLogging() {
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  console.log = (...args: unknown[]) => {
    original.log(...args);
    queue('info', args);
  };
  console.warn = (...args: unknown[]) => {
    original.warn(...args);
    queue('warn', args);
  };
  console.error = (...args: unknown[]) => {
    original.error(...args);
    queue('error', args);
  };

  window.addEventListener('error', (e) => {
    queue('error', [`Uncaught error: ${e.message} @ ${e.filename}:${e.lineno}`]);
  });

  window.addEventListener('unhandledrejection', (e) => {
    queue('error', [`Unhandled promise rejection: ${String(e.reason)}`]);
  });

  window.addEventListener('beforeunload', flush);
}