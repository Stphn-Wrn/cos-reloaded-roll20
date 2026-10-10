import { test } from "node:test";
import assert from "node:assert/strict";
import { createRoll20Importer } from "../src/importer-core.js";

// In-memory stand-in for the Roll20 adapter. Deferred work is queued so tests
// can check how much happens per tick, and drained by runAll().
function createFakeApi({ gmIds = ["gm"] } = {}) {
  const handouts = new Map();
  const queue = [];
  const whispers = [];
  let nextId = 1;
  const api = {
    storage: {},
    handouts,
    whispers,
    writes: [],
    isGM: (playerId) => gmIds.includes(playerId),
    handoutExists: (id) => handouts.has(id),
    createHandout(name) {
      const id = `-H${nextId++}`;
      handouts.set(id, { name, notes: "" });
      return id;
    },
    writeHandout(id, { name, notes }) {
      handouts.set(id, { name, notes });
      api.writes.push(id);
    },
    defer: (fn) => queue.push(fn),
    whisper: (text) => whispers.push(text),
    runNext() {
      queue.shift()();
    },
    runAll() {
      while (queue.length > 0) {
        queue.shift()();
      }
    }
  };
  return api;
}

function gmCommand(content) {
  return { type: "api", content, playerid: "gm" };
}

test("creates every handout, then writes notes with links pointing to the created handouts", () => {
  const api = createFakeApi();
  const data = {
    lang: "en",
    handouts: [
      { key: "aaaaaaaaaaaaaaaa", name: "Arc A", notes: "<p>See {{cosr:bbbbbbbbbbbbbbbb}}the gate{{/cosr}}.</p>" },
      { key: "bbbbbbbbbbbbbbbb", name: "Arc A | A1. Gate", notes: "<p>Fog</p>" }
    ]
  };
  const importer = createRoll20Importer({ data, api });

  importer.handleChat(gmCommand("!cosr import"));
  api.runAll();

  const gateId = api.storage.handouts.bbbbbbbbbbbbbbbb.id;
  const arcId = api.storage.handouts.aaaaaaaaaaaaaaaa.id;
  assert.deepEqual(api.handouts.get(arcId), {
    name: "Arc A",
    notes: `<p>See <a href="http://journal.roll20.net/handout/${gateId}">the gate</a>.</p>`
  });
  assert.deepEqual(api.handouts.get(gateId), { name: "Arc A | A1. Gate", notes: "<p>Fog</p>" });
  assert.match(api.whispers.at(-1), /2 created, 2 updated, 0 unchanged/);
});

test("a link to a page outside the build keeps only its label", () => {
  const api = createFakeApi();
  const data = {
    lang: "en",
    handouts: [{ key: "aaaaaaaaaaaaaaaa", name: "Arc A", notes: "<p>Go to {{cosr:zzzzzzzzzzzzzzzz}}Vallaki{{/cosr}}.</p>" }]
  };
  const importer = createRoll20Importer({ data, api });

  importer.handleChat(gmCommand("!cosr import"));
  api.runAll();

  const [handout] = api.handouts.values();
  assert.equal(handout.notes, "<p>Go to Vallaki.</p>");
});

test("a second import with nothing changed writes nothing", () => {
  const api = createFakeApi();
  const data = { lang: "en", handouts: [{ key: "aaaaaaaaaaaaaaaa", name: "Arc A", notes: "<p>Fog</p>" }] };
  const importer = createRoll20Importer({ data, api });
  importer.handleChat(gmCommand("!cosr import"));
  api.runAll();
  api.writes.length = 0;

  importer.handleChat(gmCommand("!cosr import"));
  api.runAll();

  assert.deepEqual(api.writes, []);
  assert.match(api.whispers.at(-1), /0 created, 0 updated, 1 unchanged/);
});

test("a handout deleted by the GM is recreated and pages linking to it are rewritten", () => {
  const api = createFakeApi();
  const data = {
    lang: "en",
    handouts: [
      { key: "aaaaaaaaaaaaaaaa", name: "Arc A", notes: "<p>{{cosr:bbbbbbbbbbbbbbbb}}Gate{{/cosr}}</p>" },
      { key: "bbbbbbbbbbbbbbbb", name: "Gate", notes: "<p>Fog</p>" }
    ]
  };
  const importer = createRoll20Importer({ data, api });
  importer.handleChat(gmCommand("!cosr import"));
  api.runAll();
  api.handouts.delete(api.storage.handouts.bbbbbbbbbbbbbbbb.id);

  importer.handleChat(gmCommand("!cosr import"));
  api.runAll();

  const newGateId = api.storage.handouts.bbbbbbbbbbbbbbbb.id;
  assert.ok(api.handouts.has(newGateId));
  assert.match(api.handouts.get(api.storage.handouts.aaaaaaaaaaaaaaaa.id).notes, new RegExp(`handout/${newGateId}"`));
  assert.match(api.whispers.at(-1), /1 created, 2 updated, 0 unchanged/);
});

test("force rewrites unchanged handouts", () => {
  const api = createFakeApi();
  const data = { lang: "en", handouts: [{ key: "aaaaaaaaaaaaaaaa", name: "Arc A", notes: "<p>Fog</p>" }] };
  const importer = createRoll20Importer({ data, api });
  importer.handleChat(gmCommand("!cosr import"));
  api.runAll();
  api.writes.length = 0;

  importer.handleChat(gmCommand("!cosr import force"));
  api.runAll();

  assert.equal(api.writes.length, 1);
});

test("works in small batches, deferring between them", () => {
  const api = createFakeApi();
  const handouts = ["a", "b", "c", "d", "e"].map((letter) => ({ key: letter.repeat(16), name: letter, notes: "<p>x</p>" }));
  const importer = createRoll20Importer({ data: { lang: "en", handouts }, api, batchSize: 2 });

  importer.handleChat(gmCommand("!cosr import"));
  const createdAfterEachTick = [api.handouts.size];
  while (api.handouts.size < 5) {
    api.runNext();
    createdAfterEachTick.push(api.handouts.size);
  }

  assert.deepEqual(createdAfterEachTick, [0, 2, 4, 5]);
});

test("ignores players who are not GM and messages that are not commands", () => {
  const api = createFakeApi();
  const data = { lang: "en", handouts: [{ key: "aaaaaaaaaaaaaaaa", name: "Arc A", notes: "<p>Fog</p>" }] };
  const importer = createRoll20Importer({ data, api });

  importer.handleChat({ type: "api", content: "!cosr import", playerid: "player" });
  importer.handleChat({ type: "general", content: "!cosr import", playerid: "gm" });
  importer.handleChat(gmCommand("!other import"));
  api.runAll();

  assert.equal(api.handouts.size, 0);
});

test("refuses to start a second import while one is running", () => {
  const api = createFakeApi();
  const data = { lang: "en", handouts: [{ key: "aaaaaaaaaaaaaaaa", name: "Arc A", notes: "<p>Fog</p>" }] };
  const importer = createRoll20Importer({ data, api });

  importer.handleChat(gmCommand("!cosr import"));
  importer.handleChat(gmCommand("!cosr import"));
  api.runAll();

  assert.equal(api.handouts.size, 1);
  assert.ok(api.whispers.some((text) => /already running/.test(text)));
});

test("speaks the build's language", () => {
  const api = createFakeApi();
  const data = { lang: "fr", handouts: [{ key: "aaaaaaaaaaaaaaaa", name: "Arc A", notes: "<p>Brume</p>" }] };
  const importer = createRoll20Importer({ data, api });

  importer.handleChat(gmCommand("!cosr import"));
  api.runAll();

  assert.match(api.whispers.at(-1), /1 créé, 1 mis à jour, 0 inchangé/);
});
