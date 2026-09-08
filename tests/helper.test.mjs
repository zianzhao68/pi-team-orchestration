import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const helper = path.join(
  root,
  "skills/pi-team-orchestration/scripts/pi-team.mjs",
);

function run(args, env = {}) {
  return spawnSync(process.execPath, [helper, ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

test("help prints usage and succeeds", () => {
  const result = run(["help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Pi Web team orchestration helper/);
});

test("unknown commands fail", () => {
  const result = run(["not-a-command"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown command/);
});

test("non-loopback Pi Web URLs are rejected", () => {
  const result = run(["models"], { PI_WEB_URL: "http://example.com:30141" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must be an HTTP loopback URL/);
});
