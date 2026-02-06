/// <reference types="node" />

import pino, { type DestinationStream } from "pino";

import { createPrettyStream } from "./pinoStream";

const isProd = process.env.NODE_ENV === "production";

const destination: DestinationStream | undefined = isProd ? undefined : createPrettyStream();

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
    base: null,
    redact: ["password", "token", "secret", "authorization"],
  },
  destination,
);

const createModuleLogger = (module: string) => logger.child({ module });

export const authLogger = createModuleLogger("auth");
export const dashboardLogger = createModuleLogger("dashboard");
export const usersLogger = createModuleLogger("users");
export const httpLogger = createModuleLogger("http");
export const commonLogger = createModuleLogger("common");
