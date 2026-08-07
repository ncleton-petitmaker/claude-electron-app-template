import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

export interface LocalAiJanRepoStatus {
  path: string;
  exists: boolean;
  isGitRepo: boolean;
  branch?: string;
  commit?: string;
  remoteUrl?: string;
  statusShort: string[];
  licenseName?: string;
  licenseText?: string;
  packageName?: string;
  packageManager?: string;
  scripts: Record<string, string>;
  lastFetchAt?: string;
  error?: string;
}

export interface LocalAiJanStatus {
  upstream: LocalAiJanRepoStatus;
  worktree: LocalAiJanRepoStatus;
  generatedAt: string;
  sourceEnvVar: "YAKA_JAN_SOURCE_DIR";
  worktreeEnvVar: "YAKA_JAN_WORKTREE_DIR";
}

export interface LocalAiJanInstructions {
  sourceDir: string;
  worktreeDir: string;
  policy: string[];
  inspectCommands: string[];
  upstreamCommands: string[];
  worktreeCommands: string[];
  janDevCommands: string[];
  notes: string[];
}

const DEFAULT_SOURCE_DIR = "/Volumes/Docker/jan-upstream";
const DEFAULT_WORKTREE_DIR = "/Volumes/Docker/jan-yaka-bridge";

export function janSourceDir(input?: { sourceDir?: string }): string {
  return input?.sourceDir?.trim() || process.env.YAKA_JAN_SOURCE_DIR || DEFAULT_SOURCE_DIR;
}

export function janWorktreeDir(input?: { worktreeDir?: string }): string {
  return input?.worktreeDir?.trim() || process.env.YAKA_JAN_WORKTREE_DIR || DEFAULT_WORKTREE_DIR;
}

export function localAiJanStatus(input: { sourceDir?: string; worktreeDir?: string } = {}): LocalAiJanStatus {
  return {
    upstream: repoStatus(janSourceDir(input)),
    worktree: repoStatus(janWorktreeDir(input)),
    generatedAt: new Date().toISOString(),
    sourceEnvVar: "YAKA_JAN_SOURCE_DIR",
    worktreeEnvVar: "YAKA_JAN_WORKTREE_DIR",
  };
}

export function localAiJanInstructions(input: { sourceDir?: string; worktreeDir?: string } = {}): LocalAiJanInstructions {
  const sourceDir = janSourceDir(input);
  const worktreeDir = janWorktreeDir(input);
  return {
    sourceDir,
    worktreeDir,
    policy: [
      "Keep jan-upstream intact as the upstream reference clone.",
      "Use jan-yaka-bridge for every Bridge adaptation.",
      "Do not vendor Jan source inside the public yaka-bridge repository before license and dependency audit.",
      "Do not start Jan automatically from Bridge in this v1 inspection module.",
    ],
    inspectCommands: [
      `git -C ${sourceDir} status --short --branch`,
      `git -C ${sourceDir} rev-parse --abbrev-ref HEAD`,
      `git -C ${sourceDir} rev-parse HEAD`,
      `git -C ${worktreeDir} status --short --branch`,
    ],
    upstreamCommands: [
      `git clone --recurse-submodules https://github.com/janhq/jan.git ${sourceDir}`,
      `git -C ${sourceDir} fetch --tags origin`,
      `git -C ${sourceDir} pull --ff-only origin main`,
    ],
    worktreeCommands: [
      `git -C ${sourceDir} worktree add ${worktreeDir} -b yaka-bridge-integration`,
      `git -C ${worktreeDir} status --short --branch`,
      `git -C ${worktreeDir} rev-parse HEAD`,
    ],
    janDevCommands: [
      `cd ${worktreeDir}`,
      "yarn install",
      "yarn build",
      "yarn dev",
      "make dev",
      "make test",
    ],
    notes: [
      "Jan README lists Node.js >= 20, Yarn >= 4.5.3, Make, Rust/Tauri, and Apple Metal toolchain on Apple Silicon.",
      "The root Jan LICENSE is Apache 2.0 with attribution requested in user-facing documentation where appropriate.",
      "GitHub currently reports the repository license as NOASSERTION/Other, so keep Jan outside yaka-bridge until audit.",
    ],
  };
}

function repoStatus(dir: string): LocalAiJanRepoStatus {
  const status: LocalAiJanRepoStatus = {
    path: dir,
    exists: existsSync(dir),
    isGitRepo: false,
    statusShort: [],
    scripts: {},
  };
  if (!status.exists) return status;

  try {
    const gitDir = git(dir, ["rev-parse", "--git-dir"]);
    status.isGitRepo = Boolean(gitDir);
    status.branch = git(dir, ["rev-parse", "--abbrev-ref", "HEAD"]);
    status.commit = git(dir, ["rev-parse", "HEAD"]);
    status.remoteUrl = git(dir, ["config", "--get", "remote.origin.url"], { optional: true }) || undefined;
    status.statusShort = git(dir, ["status", "--short"])
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .slice(0, 100);
    status.lastFetchAt = lastFetchAt(dir, gitDir);
  } catch (err) {
    status.error = err instanceof Error ? err.message : String(err);
  }

  const license = readText(join(dir, "LICENSE"));
  if (license) {
    status.licenseText = license;
    status.licenseName = /Apache License, Version 2\.0/i.test(license) ? "Apache-2.0" : "Unknown";
  }

  const pkg = readJson(join(dir, "package.json"));
  if (pkg) {
    status.packageName = typeof pkg.name === "string" ? pkg.name : undefined;
    status.packageManager = typeof pkg.packageManager === "string" ? pkg.packageManager : undefined;
    status.scripts = isRecord(pkg.scripts) ? stringRecord(pkg.scripts) : {};
  }

  return status;
}

function git(dir: string, args: string[], opts: { optional?: boolean } = {}): string {
  try {
    return execFileSync("git", ["-C", dir, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000,
    }).trim();
  } catch (err) {
    if (opts.optional) return "";
    throw err;
  }
}

function lastFetchAt(repoDir: string, gitDir: string): string | undefined {
  const resolvedGitDir = gitDir.startsWith("/") ? gitDir : resolve(repoDir, gitDir);
  const fetchHead = join(resolvedGitDir, "FETCH_HEAD");
  try {
    return statSync(fetchHead).mtime.toISOString();
  } catch {
    return undefined;
  }
}

function readText(path: string): string | undefined {
  try {
    return readFileSync(path, "utf8").trim();
  } catch {
    return undefined;
  }
}

function readJson(path: string): Record<string, unknown> | undefined {
  try {
    const value = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return isRecord(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringRecord(value: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}
