import { describe, expect, it } from "vitest";

import { formatPrettyLog } from "./pinoFormatter";

const stripAnsi = (value: string) => value.replaceAll(/\u001B\[[0-9;]*m/g, "");

describe("formatPrettyLog", () => {
  it("formata chunk JSON com escopo e extras", () => {
    const chunk = JSON.stringify({
      level: 30,
      time: new Date("2024-01-02T03:04:05Z").getTime(),
      msg: "Usuário logado",
      module: "auth",
      context: "login",
      userId: "abc123",
    });

    const formatted = stripAnsi(formatPrettyLog(chunk));

    expect(formatted.startsWith("I ")).toBe(true);
    expect(formatted).toMatch(/\[\d{2}\/\d{2}\/\d{4}/);
    expect(formatted).toContain("[auth:login]");
    expect(formatted).toContain("Usuário logado");
    expect(formatted).toContain('"userId":"abc123"');
  });

  it("retorna chunk original quando não for JSON", () => {
    expect(formatPrettyLog("não é json")).toBe("não é json");
  });

  it("inclui erro e stack limitada", () => {
    const chunk = JSON.stringify({
      level: 50,
      msg: "Falha na operação",
      err: {
        name: "Error",
        message: "Boom",
        stack: [
          "Error: Boom",
          "    at module.js:1:1",
          "    at module.js:2:2",
          "    at module.js:3:3",
          "    at module.js:4:4",
          "    at module.js:5:5",
          "    at module.js:6:6",
        ].join("\n"),
      },
    });

    const formatted = stripAnsi(formatPrettyLog(chunk)).split("\n");

    expect(formatted[0]).toContain("Falha na operação");
    expect(formatted[1]).toContain("Error: Boom");
    expect(formatted.slice(1)).toHaveLength(6);
  });
});
