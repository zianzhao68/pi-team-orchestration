#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publishMode = process.argv.includes("--publish");
const requiredFiles = [
  "README.md",
  "PUBLISHING.zh-CN.md",
  "LICENSE",
  "CHANGELOG.md",
  "SECURITY.md",
  "skills/pi-team-orchestration/SKILL.md",
  "skills/pi-team-orchestration/references/protocol.md",
  "skills/pi-team-orchestration/scripts/pi-team.mjs",
];

const errors = [];

for (const relativePath of requiredFiles) {
  try {
    await access(path.join(root, relativePath), constants.R_OK);
  } catch {
    errors.push(`Missing or unreadable file: ${relativePath}`);
  }
}

const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
const skill = await readFile(
  path.join(root, "skills/pi-team-orchestration/SKILL.md"),
  "utf8",
);

if (!packageJson.keywords?.includes("pi-package")) {
  errors.push('package.json keywords must include "pi-package"');
}
if (!packageJson.pi?.skills?.includes("./skills")) {
  errors.push('package.json pi.skills must include "./skills"');
}
if (!/^---\s*[\s\S]*?name:\s*pi-team-orchestration\s*$/m.test(skill)) {
  errors.push("SKILL.md must declare name: pi-team-orchestration");
}
if (!/^---\s*[\s\S]*?description:\s*\S+/m.test(skill)) {
  errors.push("SKILL.md must declare a non-empty description");
}

if (publishMode) {
  const serialized = JSON.stringify(packageJson);
  if (serialized.includes("YOUR_GITHUB_USERNAME")) {
    errors.push(
      "Replace YOUR_GITHUB_USERNAME in package.json before publishing",
    );
  }
}

if (errors.length > 0) {
  for (const error of errors) process.stderr.write(`ERROR: ${error}\n`);
  process.exit(1);
}

process.stdout.write(
  `Package validation passed${publishMode ? " for publishing" : ""}.\n`,
);
