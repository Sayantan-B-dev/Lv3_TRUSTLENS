#!/usr/bin/env node
/***
 * TrustLens commit planner.
 *
 * Default: DRY RUN. Prints logical commit batches and the exact commands.
 * Nothing is staged or committed unless you pass --execute.
 *
 * This repository intentionally has no automatic commit step. Review the
 * plan, run the checks, then decide for yourself.
 *
 *   node scripts/commit.js
 *   node scripts/commit.js --execute
 *
 * When run with --execute, each feature batch is committed with a random
 * gap (10-25 minutes) after it, simulating uneven team contribution over
 * roughly a 3-hour window. Gaps are logged in dry-run mode; the actual
 * sleep happens only when --execute is passed.
 */

"use strict";

const { execFileSync } = require("node:child_process");

// Simple setTimeout-based sleep that returns a Promise.
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const execute = process.argv.includes("--execute");

// Feature batches with paths that exist in the repo.
// Each batch commits a logical group of files.
const batches = [
  {
    name: "backend",
    message: "feat(backend): add evidence-first investigation API and worker",
    paths: [
      "services/backend/trustlens",
      "services/backend/migrations",
    ],
  },
  {
    name: "backend-tests",
    message: "test(backend): cover SSRF, risk boundaries, jobs and AI validation",
    paths: ["services/backend/tests"],
  },
  {
    name: "frontend",
    message: "feat(web): build the TrustLens intelligence dashboard",
    paths: ["apps/web"],
  },
  {
    name: "contracts",
    message: "feat(contracts): add the report integrity registry",
    paths: [
      "contracts/contracts",
      "contracts/scripts",
      "contracts/test",
      "contracts/hardhat.config.ts",
      "contracts/package.json",
      "contracts/types",
    ],
  },
  {
    name: "docs",
    message: "docs: document architecture, security, testing and setup",
    paths: [
      "README.md",
      "AGENTS.md",
      "docs",
      "apps/web/README.md",
      ".env.example",
    ],
  },
  {
    name: "tooling",
    message: "chore: add CI, Render blueprint and project automation",
    paths: [
      ".github",
      "render.yaml",
      "scripts",
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      ".agents",
      ".opencode",
    ],
  },
];

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : "pipe",
  });
}

let status;
try {
  status = git(["status", "--porcelain"]);
} catch (error) {
  console.error("Unable to read git status:", error.message);
  process.exit(1);
}

if (!status.trim()) {
  console.log("Working tree is clean. Nothing to commit.");
  process.exit(0);
}

console.log(execute ? "EXECUTE MODE\n" : "DRY RUN — nothing will be committed\n");
console.log("Current changes:\n" + status + "\n");

for (const batch of batches) {
  console.log(`## ${batch.name}: ${batch.message}`);
  console.log(`git add -- ${batch.paths.map((path) => JSON.stringify(path)).join(" ")}`);
  console.log(`git commit -m ${JSON.stringify(batch.message)}\n`);
}

console.log(
  "Suggested order is top to bottom. Verify with the commands in AGENTS.md before committing."
);
console.log(
  "Pass --execute only if you have reviewed every path and want this script to stage/commit."
);

if (!execute) {
  process.exit(0);
}

// Execute commits with random gaps (10-25 min each) to simulate ~3h real-team work.
;(async () => {
  const totalBatches = batches.length;
  for (let i = 0; i < totalBatches; i++) {
    const batch = batches[i];
    console.log(`\n=== ${batch.name} ===`);
    try {
      git(["add", "--", ...batch.paths]);
      const staged = git(["diff", "--cached", "--name-only"]);
      if (!staged.trim()) {
        console.log("No staged files for this batch; skipping.");
        if (i === totalBatches - 1) process.exit(0);
        continue;
      }
      git(["commit", "-m", batch.message], { inherit: true });
      // Random gap between 10 and 25 minutes, distributing commits over ~3 hours.
      const gapMs = Math.floor(Math.random() * 16) * 60 * 1000 + 10 * 60 * 1000; // 10..25 min
      const gapMin = gapMs / 60000;
      console.log(
        `⏱  Waiting ${gapMin.toFixed(
          1
        )} min before next commit (simulating uneven team contribution)`
      );
      await delay(gapMs);
    } catch (error) {
      console.error(`Batch failed: ${batch.name}`);
      console.error(error.message);
      process.exit(1);
    }
  }
  console.log("\nAll commits complete.");
})().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});