// Runs a generated Mod script inside a fake Roll20 sandbox and reports what the
// import produced, to check a build before trying it in a real game.
//
//   node tools/simulate.mjs dist/arc-a-fr.js
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node tools/simulate.mjs <script.js>");
  process.exit(1);
}

const handlers = {};
const handouts = new Map();
const timers = [];
const chat = [];
let ticks = 0;

const sandbox = {
  state: {},
  log: (text) => chat.push(`[log] ${text}`),
  on: (event, handler) => {
    handlers[event] ??= [];
    handlers[event].push(handler);
  },
  createObj(type, properties) {
    const id = `-Sim${handouts.size + 1}`;
    const object = { id, ...properties, set: (key, value) => { object[key] = value; } };
    handouts.set(id, object);
    return object;
  },
  getObj: (type, id) => handouts.get(id),
  playerIsGM: () => true,
  sendChat: (speaker, text) => chat.push(`${speaker}: ${text}`),
  setTimeout: (task) => timers.push(task)
};

function emit(event, payload) {
  for (const handler of handlers[event] ?? []) {
    handler(payload);
  }
}

function drainTimers() {
  while (timers.length > 0) {
    ticks++;
    timers.shift()();
  }
}

function runImport(command) {
  const started = performance.now();
  emit("chat:message", { type: "api", content: command, playerid: "gm" });
  drainTimers();
  return Math.round(performance.now() - started);
}

const code = await readFile(path, "utf8");
const compiled = performance.now();
vm.runInNewContext(code, sandbox);
const loadMs = Math.round(performance.now() - compiled);
emit("ready");

const firstMs = runImport("!cosr import");
const all = [...handouts.values()];
const leftovers = all.filter((handout) => /\[\[\/?cosr/.test(handout.notes));
const withClasses = all.filter((handout) => /\sclass=/.test(handout.notes));
const links = all.reduce((count, handout) => count + (handout.notes.match(/journal\.roll20\.net\/handout\//g) ?? []).length, 0);
const longest = all.reduce((longestName, handout) => {
  if (handout.name.length > longestName.length) {
    return handout.name;
  }
  return longestName;
}, "");
const firstTicks = ticks;
ticks = 0;
const secondMs = runImport("!cosr import");

console.log(chat.join("\n"));
console.log("");
console.log(`script load: ${loadMs} ms`);
console.log(`first import: ${firstMs} ms, ${firstTicks} ticks; second import: ${secondMs} ms, ${ticks} ticks`);
console.log(`handouts: ${all.length}, links: ${links}, unreplaced tokens: ${leftovers.length}, leftover classes: ${withClasses.length}`);
console.log(`longest name (${longest.length} chars): ${longest}`);
console.log(`state size: ${JSON.stringify(sandbox.state).length} bytes`);

if (all.length === 0 || leftovers.length > 0 || withClasses.length > 0) {
  console.error("Build check failed: no handouts, unreplaced link tokens or leftover classes.");
  process.exitCode = 1;
}
