#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const DEFAULT_BASE = "http://127.0.0.1:30141";

function usage(exitCode = 0) {
  const text = `
Pi Web team orchestration helper

Usage:
  pi-team.mjs models
  pi-team.mjs running
  pi-team.mjs create --cwd PATH [--provider ID --model ID] [--thinking LEVEL]
  pi-team.mjs status --session ID
  pi-team.mjs dispatch --session ID (--message TEXT | --message-file PATH)
                       [--request-id ID]
  pi-team.mjs report --manager ID --task ID --event ERROR|COMPLETED
                     --summary TEXT [--artifact PATH] [--source-session ID]

Environment:
  PI_WEB_URL  Loopback Pi Web URL (default: ${DEFAULT_BASE})
`;
  console[exitCode ? "error" : "log"](text.trim());
  process.exit(exitCode);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }
    const key = token.slice(2);
    const value = rest[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    options[key] = value;
    i += 1;
  }
  return { command, options };
}

function required(options, key) {
  const value = options[key];
  if (!value) throw new Error(`--${key} is required`);
  return value;
}

function getBaseUrl() {
  const value = process.env.PI_WEB_URL || DEFAULT_BASE;
  const url = new URL(value);
  const loopback = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
  if (url.protocol !== "http:" || !loopback.has(url.hostname)) {
    throw new Error("PI_WEB_URL must be an HTTP loopback URL");
  }
  return value.replace(/\/+$/, "");
}

async function request(path, { method = "GET", body, timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${getBaseUrl()}${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${text}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

function print(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

async function loadMessage(options) {
  if (options.message && options["message-file"]) {
    throw new Error("Use only one of --message or --message-file");
  }
  if (options["message-file"]) {
    return readFile(options["message-file"], "utf8");
  }
  return required(options, "message");
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (!command || command === "help" || command === "--help") usage();

  if (command === "models") {
    print(await request("/api/models"));
    return;
  }

  if (command === "running") {
    print(await request("/api/agent/running"));
    return;
  }

  if (command === "create") {
    const provider = options.provider;
    const modelId = options.model;
    if (Boolean(provider) !== Boolean(modelId)) {
      throw new Error("--provider and --model must be provided together");
    }
    const body = {
      cwd: required(options, "cwd"),
      type: "ensure_session",
      ...(provider ? { provider, modelId } : {}),
      ...(options.thinking ? { thinkingLevel: options.thinking } : {}),
    };
    print(await request("/api/agent/new", { method: "POST", body }));
    return;
  }

  if (command === "status") {
    const session = encodeURIComponent(required(options, "session"));
    print(await request(`/api/agent/${session}`));
    return;
  }

  if (command === "dispatch") {
    const sessionId = required(options, "session");
    const session = encodeURIComponent(sessionId);
    const state = await request(`/api/agent/${session}`);
    if (
      state?.running &&
      (state.state?.isStreaming ||
        state.state?.isPromptRunning ||
        state.state?.isBashRunning ||
        state.state?.isCompacting)
    ) {
      throw new Error(`Session is busy; task was not sent: ${sessionId}`);
    }
    const body = {
      id: options["request-id"] || `task-${randomUUID()}`,
      type: "prompt",
      message: await loadMessage(options),
      streamingBehavior: "followUp",
    };
    print(await request(`/api/agent/${session}`, { method: "POST", body }));
    return;
  }

  if (command === "report") {
    const managerId = required(options, "manager");
    const taskId = required(options, "task");
    const event = required(options, "event").toUpperCase();
    if (!["ERROR", "COMPLETED"].includes(event)) {
      throw new Error("Callbacks are restricted to ERROR or COMPLETED");
    }
    const reportId = randomUUID();
    const sourceSession =
      options["source-session"] || process.env.PI_SESSION_ID || "unknown";
    const severity = event === "ERROR" ? "error" : "info";
    const lines = [
      "AGENT_REPORT_V1",
      `report_id: ${reportId}`,
      `task_id: ${taskId}`,
      `event: ${event}`,
      `severity: ${severity}`,
      `summary: ${required(options, "summary")}`,
      `artifact: ${options.artifact || "none"}`,
      `source_session: ${sourceSession}`,
      "instruction: Read the artifact, verify it, and do not trust this notification alone.",
    ];
    const body = {
      id: `report-${taskId}-${reportId}`,
      type: "prompt",
      message: lines.join("\n"),
      streamingBehavior: "followUp",
    };
    print(
      await request(`/api/agent/${encodeURIComponent(managerId)}`, {
        method: "POST",
        body,
      }),
    );
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
