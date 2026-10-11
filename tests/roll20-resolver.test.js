import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVaultIndex } from "cos-reloaded-importer/src/vault/vault-index.js";
import { pageIdFor } from "cos-reloaded-importer/src/resolve/document-ids.js";
import { chunkKeyFor } from "../src/chunk-keys.js";
import { createRoll20LinkResolver } from "../src/roll20-resolver.js";

function setup(splitLevel) {
  const index = buildVaultIndex({
    markdownFiles: [
      { path: "Act I/Arc A.md", text: "# A2. House\nIntro\n## Second Floor\n### Library\nBooks\n#### Shelf\nDust" },
      { path: "Act I/Arc B.md", text: "# B1. Village\nMud" }
    ],
    imagePaths: []
  });
  const [arcA, arcB] = index.documents;
  const house = arcA.sections[0];
  const resolve = createRoll20LinkResolver({ index, splitLevels: new Map([[house.key, splitLevel]]) });
  return { resolve, arcA, arcB, house };
}

test("a link to a room points to the room's handout", () => {
  const { resolve, arcB, house } = setup(3);

  const resolved = resolve({ page: "Arc A", anchor: "Library", alias: null }, arcB, pageIdFor(arcB.sections[0]));

  assert.equal(resolved.pageId, chunkKeyFor(house, 1));
  assert.equal(resolved.label, "Library");
});

test("a link to a heading deeper than the split points to the handout containing it", () => {
  const { resolve, arcB, house } = setup(3);

  const resolved = resolve({ page: "Arc A", anchor: "Shelf", alias: null }, arcB, pageIdFor(arcB.sections[0]));

  assert.equal(resolved.pageId, chunkKeyFor(house, 1));
});

test("a link to a section or a file points to the section's first handout", () => {
  const { resolve, arcB, house } = setup(3);

  const toSection = resolve({ page: "Arc A", anchor: "A2. House", alias: null }, arcB, pageIdFor(arcB.sections[0]));
  const toFile = resolve({ page: "Arc A", anchor: null, alias: null }, arcB, pageIdFor(arcB.sections[0]));

  assert.equal(toSection.pageId, pageIdFor(house));
  assert.equal(toFile.pageId, pageIdFor(house));
});

test("a link to the handout it sits in has no target", () => {
  const { resolve, arcA, house } = setup(2);

  const resolved = resolve({ page: "", anchor: "Library", alias: null }, arcA, chunkKeyFor(house, 0));

  assert.equal(resolved.pageId, null);
  assert.equal(resolved.label, "Library");
});

test("an unknown file gives no link", () => {
  const { resolve, arcB } = setup(3);

  assert.equal(resolve({ page: "Nowhere", anchor: null, alias: null }, arcB, "x"), null);
});
