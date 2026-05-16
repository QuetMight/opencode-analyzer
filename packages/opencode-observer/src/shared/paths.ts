import { constants, accessSync, mkdirSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

import { DATA_DIR_NAME } from "../constants.js";

/**
 * Returns the user-level data directory.
 * Matches OpenCode's behavior via xdg-basedir:
 * - All platforms: XDG_DATA_HOME or ~/.local/share
 */
export function getDataDir(): string {
  const preferredDir =
    process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
  try {
    mkdirSync(preferredDir, { recursive: true });
    accessSync(preferredDir, constants.W_OK);
    return preferredDir;
  } catch {
    const fallbackDir = join(tmpdir(), "opencode-data");
    mkdirSync(fallbackDir, { recursive: true });
    accessSync(fallbackDir, constants.W_OK);
    return fallbackDir;
  }
}

/**
 * Returns the OpenCode data directory path.
 * All platforms: ~/.local/share/opencode
 */
export function getOpenCodeDataDir(): string {
  return join(getDataDir(), "opencode");
}

/**
 * Returns the OpenCode analyzer directory path.
 * All platforms: ~/.local/share/opencode-analyzer
 */
export function getOpenCodeAnalyzerDir(): string {
  return join(getDataDir(), DATA_DIR_NAME);
}
