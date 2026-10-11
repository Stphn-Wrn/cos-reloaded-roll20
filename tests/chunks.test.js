import { test } from "node:test";
import assert from "node:assert/strict";
import { splitMarkdown } from "../src/chunks.js";

test("level 1 keeps the section whole", () => {
  const markdown = "Intro\n## Floor\n### Room\nText";

  const chunks = splitMarkdown(markdown, 1);

  assert.deepEqual(chunks, [{ position: -1, level: 1, path: [], markdown }]);
});

test("splits at every heading down to the level, keeping each heading in its chunk", () => {
  const markdown = "Intro\n## First Floor\nStairs\n### Library\nBooks\n#### Shelf\nDust\n## Attic\nBats";

  const chunks = splitMarkdown(markdown, 3);

  assert.deepEqual(chunks, [
    { position: -1, level: 1, path: [], markdown: "Intro" },
    { position: 0, level: 2, path: ["First Floor"], markdown: "## First Floor\nStairs" },
    { position: 1, level: 3, path: ["First Floor", "Library"], markdown: "### Library\nBooks\n#### Shelf\nDust" },
    { position: 3, level: 2, path: ["Attic"], markdown: "## Attic\nBats" }
  ]);
});

test("a room directly under the section has no floor in its path", () => {
  const markdown = "### Cellar\nDark";

  const chunks = splitMarkdown(markdown, 3);

  assert.deepEqual(chunks.map((chunk) => chunk.path), [[], ["Cellar"]]);
  assert.equal(chunks[0].markdown, "");
});

test("headings are named in plain text", () => {
  const markdown = "## **The** [[Arc B|Village]]\nMud";

  const chunks = splitMarkdown(markdown, 2);

  assert.deepEqual(chunks[1].path, ["The Village"]);
});
