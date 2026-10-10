import { test } from "node:test";
import assert from "node:assert/strict";
import { createRoll20Adapter } from "../src/roll20-adapter.js";

function createFakeSandbox() {
  const objects = new Map();
  const calls = [];
  return {
    calls,
    state: {},
    createObj(type, properties) {
      const id = `-O${objects.size + 1}`;
      const object = { id, type, properties, set: (...args) => calls.push(["set", id, ...args]) };
      objects.set(id, object);
      calls.push(["createObj", type, properties]);
      return object;
    },
    getObj: (type, id) => objects.get(id),
    playerIsGM: (id) => id === "gm",
    sendChat: (...args) => calls.push(["sendChat", ...args]),
    setTimeout: (fn) => fn()
  };
}

test("creates GM-only handouts and sets the notes in their own call after creation", () => {
  const sandbox = createFakeSandbox();
  const api = createRoll20Adapter(sandbox);

  const id = api.createHandout("Arc A");
  api.writeHandout(id, { name: "Arc A", notes: "<p>Fog</p>" });

  assert.deepEqual(sandbox.calls, [
    ["createObj", "handout", { name: "Arc A", inplayerjournals: "", archived: false }],
    ["set", id, "name", "Arc A"],
    ["set", id, "notes", "<p>Fog</p>"]
  ]);
});

test("keeps its storage in the persisted state under CoSR", () => {
  const sandbox = createFakeSandbox();
  sandbox.state.CoSR = { handouts: { a: { id: "-O1", hash: "h" } } };

  const api = createRoll20Adapter(sandbox);

  assert.equal(api.storage, sandbox.state.CoSR);
});

test("whispers to the GM without archiving the message", () => {
  const sandbox = createFakeSandbox();
  const api = createRoll20Adapter(sandbox);

  api.whisper("Done");

  assert.deepEqual(sandbox.calls, [["sendChat", "CoS Reloaded", "/w gm Done", null, { noarchive: true }]]);
});
