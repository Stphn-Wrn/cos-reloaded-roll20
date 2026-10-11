import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVaultIndex } from "cos-reloaded-importer/src/vault/vault-index.js";
import { computeSplitLevels } from "../src/split-levels.js";

test("each section is split down to the deepest heading a link points to", () => {
  const index = buildVaultIndex({
    markdownFiles: [
      { path: "Act I/Arc A.md", text: "# A2. House\n## Floor\n### Library\nBooks\n# A3. Outside\n## Road\nMud" },
      { path: "Act I/Arc B.md", text: "# B1. Village\nSee [[Arc A#Library]], [[Arc A#Road]] and [[Arc A#A3. Outside]]." }
    ],
    imagePaths: []
  });
  const [arcA] = index.documents;

  const levels = computeSplitLevels(index);

  assert.equal(levels.get(arcA.sections[0].key), 3);
  assert.equal(levels.get(arcA.sections[1].key), 2);
});

test("links within the same file and links without a heading count too, or not at all", () => {
  const index = buildVaultIndex({
    markdownFiles: [{ path: "Act I/Arc A.md", text: "# A2. House\nGo to [[#Library]] or [[Arc A]] or [[Arc A#^block]].\n### Library\nBooks" }],
    imagePaths: []
  });
  const [arcA] = index.documents;

  const levels = computeSplitLevels(index);

  assert.equal(levels.get(arcA.sections[0].key), 3);
});

test("sections nobody links into stay whole", () => {
  const index = buildVaultIndex({ markdownFiles: [{ path: "Act I/Arc A.md", text: "# A2. House\n## Floor\nText" }], imagePaths: [] });
  const [arcA] = index.documents;

  const levels = computeSplitLevels(index);

  assert.equal(levels.get(arcA.sections[0].key) ?? 1, 1);
});
