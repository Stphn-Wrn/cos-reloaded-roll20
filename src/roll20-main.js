/* global on, log, state, createObj, getObj, playerIsGM, sendChat */
import { createRoll20Adapter } from "./roll20-adapter.js";
import { createRoll20Importer } from "./importer-core.js";

// Entry point of the generated Mod script; `data` is embedded by tools/build.mjs.
export function startRoll20Importer(data) {
  on("ready", () => {
    const sandbox = { state, createObj, getObj, playerIsGM, sendChat, setTimeout };
    const importer = createRoll20Importer({ data, api: createRoll20Adapter(sandbox) });
    on("chat:message", (message) => importer.handleChat(message));
    log(`CoS Reloaded importer ready (${data.lang}, ${data.handouts.length} handouts). Type !cosr import`);
  });
}
