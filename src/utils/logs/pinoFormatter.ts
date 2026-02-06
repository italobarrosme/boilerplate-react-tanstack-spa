type LevelName = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

type LogPayload = {
  level?: number;
  time?: number;
  msg?: string;
  module?: string;
  context?: string;
  err?: unknown;
  [key: string]: unknown;
};

const LEVEL_NAMES: Record<number, LevelName> = {
  10: "trace",
  20: "debug",
  30: "info",
  40: "warn",
  50: "error",
  60: "fatal",
};

const LEVEL_ICONS: Record<LevelName, string> = {
  trace: "T",
  debug: "D",
  info: "I",
  warn: "W",
  error: "E",
  fatal: "F",
};

const color = (code: string) => (value: string) => `\u001B[${code}m${value}\u001B[0m`;

const COLORS: Record<LevelName, (value: string) => string> & {
  dim: (value: string) => string;
} = {
  trace: color("90"),
  debug: color("36"),
  info: color("32"),
  warn: color("33"),
  error: color("31"),
  fatal: color("1;31"),
  dim: color("90"),
};

const BASE_KEYS = new Set([
  "level",
  "time",
  "msg",
  "module",
  "context",
  "err",
  "pid",
  "hostname",
  "v",
]);

const formatterOptions: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

function formatTimestamp(value?: number) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("pt-BR", formatterOptions);
}

function formatScope(module?: string, context?: string) {
  const scope = [module, context].filter(Boolean).join(":");
  return scope ? `[${scope}]` : "";
}

function extractExtras(payload: LogPayload) {
  const entries = Object.entries(payload).filter(
    ([key, value]) => !BASE_KEYS.has(key) && value !== undefined,
  );

  return entries.length === 0 ? "" : JSON.stringify(Object.fromEntries(entries));
}

function normalizeError(err: unknown) {
  if (!err) return null;

  const asError = err as Partial<Error> & Record<string, unknown>;

  const name = typeof asError.name === "string" ? asError.name : asError.type;
  const message = typeof asError.message === "string" ? asError.message : "";
  const stackSource = typeof asError.stack === "string" ? asError.stack : "";

  const title = [name ?? "Error", message].filter(Boolean).join(": ");
  const stackLines = stackSource
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  return {
    title,
    stackLines,
  };
}

function formatErrorBlock(err: unknown) {
  const normalized = normalizeError(err);

  if (!normalized) return "";

  const stack = normalized.stackLines.map((line) => `  ${COLORS.dim(line)}`);

  return [`  ${COLORS.error(normalized.title)}`, ...stack].join("\n");
}

export function formatPrettyLog(chunk: string): string {
  let payload: LogPayload;

  try {
    payload = JSON.parse(chunk);
  } catch (error) {
    return chunk.trimEnd();
  }

  const levelName = payload.level ? LEVEL_NAMES[payload.level] ?? "info" : "info";
  const icon = LEVEL_ICONS[levelName];
  const timestamp = formatTimestamp(payload.time);
  const scope = formatScope(payload.module, payload.context);
  const extras = extractExtras(payload);
  const errorBlock = formatErrorBlock(payload.err);

  const parts = [
    COLORS[levelName](icon.padEnd(2)),
    timestamp ? COLORS.dim(`[${timestamp}]`) : "",
    scope,
    payload.msg ?? "",
    extras ? COLORS.dim(extras) : "",
  ].filter(Boolean);

  const header = parts.join(" ").trim();

  return errorBlock ? `${header}\n${errorBlock}` : header;
}

export const pinoDevFormatter = formatPrettyLog;
