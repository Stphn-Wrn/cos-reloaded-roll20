import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRoll20Link } from "../src/links.js";

test("formats a resolved link as a token carrying the target page id", () => {
  const link = { page: "Arc A", anchor: null, alias: null };
  const resolved = { uuid: "JournalEntry.abc", pageId: "page123", label: "Arc A" };

  const result = formatRoll20Link(link, resolved, "Escape From Death House");

  assert.equal(result, "{{cosr:page123}}Escape From Death House{{/cosr}}");
});

test("keeps only the label when the link is unresolved", () => {
  const link = { page: "Missing", anchor: null, alias: null };

  const result = formatRoll20Link(link, null, "Missing");

  assert.equal(result, "Missing");
});

test("plugs into the shared wikilink pipeline as the link strategy", async () => {
  const { replaceWikilinks } = await import("cos-reloaded-importer/src/convert/obsidian-syntax.js");
  const resolve = (link) => {
    if (link.page === "Strahd") {
      return { uuid: "x", pageId: "p1", label: "Strahd von Zarovich" };
    }
    return null;
  };

  const result = replaceWikilinks("See [[Strahd]] and [[Nowhere]].", resolve, formatRoll20Link);

  assert.equal(result, "See {{cosr:p1}}Strahd von Zarovich{{/cosr}} and Nowhere.");
});

test("keeps only the label when the target document has no page", () => {
  const link = { page: "Empty", anchor: null, alias: null };
  const resolved = { uuid: "JournalEntry.abc", pageId: null, label: "Empty" };

  const result = formatRoll20Link(link, resolved, "Empty");

  assert.equal(result, "Empty");
});
