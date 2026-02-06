/// <reference types="node" />

import type { DestinationStream } from "pino";

import { formatPrettyLog } from "./pinoFormatter";

export function createPrettyStream(): DestinationStream {
  return {
    write(chunk) {
      const input = typeof chunk === "string" ? chunk : chunk.toString();
      const formatted = formatPrettyLog(input);
      const output = formatted.endsWith("\n") ? formatted : `${formatted}\n`;
      process.stdout.write(output);
    },
  };
}
