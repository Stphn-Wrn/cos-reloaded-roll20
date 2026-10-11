import { buildJournalPlan } from "cos-reloaded-importer/src/build/journal-plan.js";
import { createPageRenderer } from "cos-reloaded-importer/src/convert/page-renderer.js";
import { createLocalization, identityLocalization } from "cos-reloaded-importer/src/translate/localization.js";
import { buildVaultIndex } from "cos-reloaded-importer/src/vault/vault-index.js";
import { buildHandoutPlan } from "./handout-plan.js";
import { toRoll20Html } from "./html.js";
import { formatRoll20Link } from "./links.js";
import { createRoll20LinkResolver } from "./roll20-resolver.js";
import { computeSplitLevels } from "./split-levels.js";

const ROOT_NAME = "Curse of Strahd: Reloaded";

function localizationFor(translation, index) {
  if (!translation) {
    return identityLocalization;
  }
  return createLocalization({ index, manifest: translation.manifest, files: translation.files });
}

// The whole vault is always indexed so that `only` builds still get the right link labels;
// links to pages left out of the build fall back to their label inside Roll20.
export function buildHandoutData({ markdownFiles, imagePaths, imageUrl, toHtml, lang, translation = null, only = "" }) {
  const index = buildVaultIndex({ markdownFiles, imagePaths });
  const localization = localizationFor(translation, index);
  const splitLevels = computeSplitLevels(index);
  const resolveLink = createRoll20LinkResolver({ index, splitLevels, localization });

  // Pages keep their displayed markdown: they are cut into handouts before rendering.
  const journalPlan = buildJournalPlan({ index, renderPage: (markdown) => markdown, rootName: ROOT_NAME, localization });

  function renderChunk(markdown, document, key) {
    const renderPage = createPageRenderer({
      resolveLink: (link, fromDocument) => resolveLink(link, fromDocument, key),
      imageUrl,
      toHtml,
      formatLink: formatRoll20Link
    });
    return toRoll20Html(renderPage(markdown, document));
  }

  return {
    lang,
    handouts: buildHandoutPlan({
      journalPlan,
      index,
      splitLevels,
      renderChunk,
      includes: (journal) => journal.path.startsWith(only)
    }),
    translation: localization.stats
  };
}
