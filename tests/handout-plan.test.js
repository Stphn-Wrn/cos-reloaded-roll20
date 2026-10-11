import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVaultIndex } from "cos-reloaded-importer/src/vault/vault-index.js";
import { buildJournalPlan } from "cos-reloaded-importer/src/build/journal-plan.js";
import { chunkKeyFor } from "../src/chunk-keys.js";
import { buildHandoutPlan } from "../src/handout-plan.js";

function planFor(markdownFiles, levelsByTitle = {}) {
  const index = buildVaultIndex({ markdownFiles, imagePaths: [] });
  const journalPlan = buildJournalPlan({ index, renderPage: (markdown) => markdown, rootName: "CoS Reloaded" });
  const splitLevels = new Map();
  for (const document of index.documents) {
    for (const section of document.sections) {
      if (levelsByTitle[String(section.title)]) {
        splitLevels.set(section.key, levelsByTitle[String(section.title)]);
      }
    }
  }
  const renderChunk = (markdown) => `<p>${markdown}</p>`;
  return { index, handouts: buildHandoutPlan({ journalPlan, index, splitLevels, renderChunk }) };
}

test("a journal's introduction becomes the numbered journal handout, listing its sections", () => {
  const { index, handouts } = planFor([{ path: "Act I/Arc A.md", text: "Intro\n# A1. Gate\nFog" }]);
  const [intro, gate] = index.documents[0].sections;

  assert.deepEqual(
    handouts.map((handout) => [handout.key, handout.name]),
    [
      [chunkKeyFor(intro, -1), "01 Arc A"],
      [chunkKeyFor(gate, -1), "01.01 A1. Gate"]
    ]
  );
  assert.match(handouts[0].notes, new RegExp(`^<p>Intro</p><ul[^>]*><li>\\{\\{cosr:${chunkKeyFor(gate, -1)}\\}\\}A1\\. Gate\\{\\{/cosr\\}\\}</li></ul>$`));
  assert.match(handouts[1].notes, new RegExp(`^<p[^>]*>\\{\\{cosr:${chunkKeyFor(intro, -1)}\\}\\}Arc A\\{\\{/cosr\\}\\}</p><p>Fog</p>$`));
});

test("a journal without introduction gets a contents-only handout", () => {
  const { index, handouts } = planFor([{ path: "Act I/Arc B.md", text: "# B1. Village\nMud" }]);
  const village = index.documents[0].sections[0];

  assert.deepEqual(handouts.map((handout) => handout.name), ["01 Arc B", "01.01 B1. Village"]);
  assert.match(handouts[0].key, /^[A-Za-z0-9]{16}$/);
  assert.notEqual(handouts[0].key, chunkKeyFor(village, -1));
  assert.match(handouts[0].notes, new RegExp(`^<ul[^>]*><li>\\{\\{cosr:${chunkKeyFor(village, -1)}\\}\\}B1\\. Village\\{\\{/cosr\\}\\}</li></ul>$`));
});

test("numbers follow the guide's folder tree, so Roll20's alphabetical Journal keeps the guide order", () => {
  const { handouts } = planFor([
    { path: "Appendices/Bestiary.md", text: "# Wolf\nx" },
    { path: "Act II - The Shadowed Town/Arc D.md", text: "# D1\nx" },
    { path: "Act I - Into the Mists/Arc B.md", text: "# B1\nx" },
    { path: "Act I - Into the Mists/Arc A.md", text: "# A1\nx\n# A2\ny" },
    { path: "Introduction/Using This Guide.md", text: "# Use\nx" }
  ]);

  const names = handouts.map((handout) => handout.name);

  assert.deepEqual(names, [
    "01 Using This Guide", "01.01 Use",
    "02 Arc A", "02.01 A1", "02.02 A2",
    "03 Arc B", "03.01 B1",
    "04 Arc D", "04.01 D1",
    "05 Bestiary", "05.01 Wolf"
  ]);
  assert.deepEqual(names, [...names].sort());
});

test("a split section numbers its parts by heading level", () => {
  const { index, handouts } = planFor(
    [{ path: "Act I/Arc A.md", text: "# A2. House\nIntro\n## Second Floor\nStairs\n### Library\nBooks\n### Study\nInk\n## Attic\nBats" }],
    { "A2. House": 3 }
  );
  const house = index.documents[0].sections[0];

  assert.deepEqual(
    handouts.slice(1).map((handout) => [handout.key, handout.name]),
    [
      [chunkKeyFor(house, -1), "01.01 A2. House"],
      [chunkKeyFor(house, 0), "01.01.01 Second Floor"],
      [chunkKeyFor(house, 1), "01.01.01.01 Library"],
      [chunkKeyFor(house, 2), "01.01.01.02 Study"],
      [chunkKeyFor(house, 3), "01.01.02 Attic"]
    ]
  );
});

test("the section handout lists its parts and each part links back to the section", () => {
  const { index, handouts } = planFor(
    [{ path: "Act I/Arc A.md", text: "# A2. House\nIntro\n## Second Floor\nStairs\n### Library\nBooks" }],
    { "A2. House": 3 }
  );
  const house = index.documents[0].sections[0];
  const [, section, floor, library] = handouts;

  assert.match(section.notes, /<p>Intro<\/p><ul[^>]*>/);
  assert.match(section.notes, new RegExp(`<li>\\{\\{cosr:${chunkKeyFor(house, 0)}\\}\\}Second Floor\\{\\{/cosr\\}\\}</li>`));
  assert.match(section.notes, new RegExp(`<li style="margin-left: 1.5em;">\\{\\{cosr:${chunkKeyFor(house, 1)}\\}\\}Library\\{\\{/cosr\\}\\}</li>`));
  assert.match(floor.notes, new RegExp(`^<p[^>]*>\\{\\{cosr:${chunkKeyFor(house, -1)}\\}\\}A2\\. House\\{\\{/cosr\\}\\}</p><p>## Second Floor`));
  assert.match(library.notes, /<p>### Library\nBooks<\/p>$/);
});

test("parts of a split introduction are numbered apart from the sections", () => {
  const { handouts } = planFor([{ path: "Act I/Arc A.md", text: "Intro\n## Map\nx\n# A1. Gate\nFog" }], { [null]: 2 });

  assert.deepEqual(handouts.map((handout) => handout.name), ["01 Arc A", "01.00.01 Map", "01.01 A1. Gate"]);
});

test("renders each part with its own handout key, so self links can be spotted", () => {
  const index = buildVaultIndex({ markdownFiles: [{ path: "Act I/Arc A.md", text: "# A2. House\n## Floor\nx" }], imagePaths: [] });
  const journalPlan = buildJournalPlan({ index, renderPage: (markdown) => markdown, rootName: "CoS Reloaded" });
  const house = index.documents[0].sections[0];
  const calls = [];
  const renderChunk = (markdown, document, key) => {
    calls.push([document.path, key]);
    return "";
  };

  buildHandoutPlan({ journalPlan, index, splitLevels: new Map([[house.key, 2]]), renderChunk });

  assert.deepEqual(calls, [
    ["Act I/Arc A.md", chunkKeyFor(house, -1)],
    ["Act I/Arc A.md", chunkKeyFor(house, 0)]
  ]);
});
