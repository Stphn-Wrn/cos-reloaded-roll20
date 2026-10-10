import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVaultIndex } from "cos-reloaded-importer/src/vault/vault-index.js";
import { buildJournalPlan } from "cos-reloaded-importer/src/build/journal-plan.js";
import { buildHandoutPlan } from "../src/handout-plan.js";

function journalPlanFor(markdownFiles) {
  const index = buildVaultIndex({ markdownFiles, imagePaths: [] });
  const renderPage = (markdown) => `<div class="cosr-page"><p class="highlight">${markdown}</p></div>`;
  return buildJournalPlan({ index, renderPage, rootName: "CoS Reloaded" });
}

test("creates one handout per page, named after its journal and section, with Roll20 notes", () => {
  const journalPlan = journalPlanFor([{ path: "Act I/Arc A.md", text: "Intro\n# A1. Gate\nFog" }]);

  const handouts = buildHandoutPlan(journalPlan);

  assert.deepEqual(
    handouts.map((handout) => [handout.name, handout.notes]),
    [
      ["Arc A", '<p style="font-weight: bold;">Intro</p>'],
      ["Arc A | A1. Gate", '<p style="font-weight: bold;">Fog</p>']
    ]
  );
  assert.deepEqual(
    handouts.map((handout) => handout.key),
    journalPlan.journals[0].pages.map((page) => page._id)
  );
});

test("orders handouts like the guide's folder tree, not alphabetically", () => {
  const journalPlan = journalPlanFor([
    { path: "Appendices/Bestiary.md", text: "# Wolf\nx" },
    { path: "Act II - The Shadowed Town/Arc D.md", text: "# D1\nx" },
    { path: "Act I - Into the Mists/Arc B.md", text: "# B1\nx" },
    { path: "Act I - Into the Mists/Arc A.md", text: "# A1\nx" },
    { path: "Introduction/Using This Guide.md", text: "# Use\nx" }
  ]);

  const handouts = buildHandoutPlan(journalPlan);

  assert.deepEqual(
    handouts.map((handout) => handout.name),
    ["Using This Guide | Use", "Arc A | A1", "Arc B | B1", "Arc D | D1", "Bestiary | Wolf"]
  );
});
