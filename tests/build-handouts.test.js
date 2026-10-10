import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHandoutData } from "../src/build-handouts.js";

const toHtml = (markdown) => `<p>${markdown.trim()}</p>`;

test("builds Roll20 handouts from the vault, with links as tokens", () => {
  const markdownFiles = [
    { path: "Act I/Arc A.md", text: "# A1. Gate\nSee [[Arc B#B1. Village]]." },
    { path: "Act I/Arc B.md", text: "# B1. Village\nMud" }
  ];

  const data = buildHandoutData({ markdownFiles, imagePaths: [], imageUrl: () => null, toHtml, lang: "en" });

  assert.equal(data.lang, "en");
  assert.deepEqual(data.handouts.map((handout) => handout.name), ["Arc A | A1. Gate", "Arc B | B1. Village"]);
  assert.match(data.handouts[0].notes, /^<p>See \{\{cosr:[A-Za-z0-9]{16}\}\}B1\. Village\{\{\/cosr\}\}\.<\/p>$/);
  assert.equal(data.handouts[0].notes.match(/cosr:(\w+)/)[1], data.handouts[1].key);
});

test("only keeps handouts under the given path, while still resolving links to the others", () => {
  const markdownFiles = [
    { path: "Act I/Arc A.md", text: "# A1. Gate\nSee [[Arc B]]." },
    { path: "Act I/Arc B.md", text: "# B1. Village\nMud" }
  ];

  const data = buildHandoutData({ markdownFiles, imagePaths: [], imageUrl: () => null, toHtml, lang: "en", only: "Act I/Arc A" });

  assert.deepEqual(data.handouts.map((handout) => handout.name), ["Arc A | A1. Gate"]);
  assert.match(data.handouts[0].notes, /\{\{cosr:\w+\}\}Arc B\{\{\/cosr\}\}/);
});

test("applies the translation to names and up-to-date sections", async () => {
  const { sourceHashOf } = await import("cos-reloaded-importer/src/translate/localization.js");
  const { parseSections } = await import("cos-reloaded-importer/src/vault/markdown-tools.js");
  const english = "# A1. Gate\nFog";
  const markdownFiles = [{ path: "Act I/Arc A.md", text: english }];
  const manifest = {
    names: { "Arc A": "Arc A (FR)" },
    files: { "Act I/Arc A.md": { sources: parseSections(english).map(sourceHashOf) } }
  };
  const translation = { manifest, files: [{ path: "Act I/Arc A.md", text: "# A1. Portail\nBrume" }] };

  const data = buildHandoutData({ markdownFiles, imagePaths: [], imageUrl: () => null, toHtml, lang: "fr", translation });

  assert.deepEqual(
    data.handouts.map((handout) => [handout.name, handout.notes]),
    [["Arc A (FR) | A1. Portail", "<p>Brume</p>"]]
  );
});

test("a link followed by text in parentheses survives Markdown conversion", async () => {
  const showdown = (await import("showdown")).default;
  const { createMarkdownConverter } = await import("cos-reloaded-importer/src/convert/markdown-converter.js");
  const markdownFiles = [
    { path: "Act III/Summary.md", text: "# Timeline\n* Escape in [[Arc P]] (🔶)." },
    { path: "Act III/Arc P.md", text: "# P1. Castle\nDark" }
  ];

  const data = buildHandoutData({
    markdownFiles,
    imagePaths: [],
    imageUrl: () => null,
    toHtml: createMarkdownConverter(showdown),
    lang: "en",
    only: "Act III/Summary"
  });

  assert.match(data.handouts[0].notes, /Escape in \{\{cosr:\w{16}\}\}Arc P\{\{\/cosr\}\} \(🔶\)\./);
});
