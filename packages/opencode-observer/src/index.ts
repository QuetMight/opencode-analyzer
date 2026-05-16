import type { Hooks, Plugin, PluginInput } from "@opencode-ai/plugin";
import { PLUGIN_NAME, PLUGIN_VERSION } from "./constants.js";
import { log } from "./shared/log.js";

const OpenCodeObserver: Plugin = async (ctx: PluginInput): Promise<Hooks> => {
  log(`Initializing ${PLUGIN_NAME} v${PLUGIN_VERSION}...`);
  return {};
};

export default OpenCodeObserver;
