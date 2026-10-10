import { buildJournalPlan } from "cos-reloaded-importer/src/build/journal-plan.js";
import { createPageRenderer } from "cos-reloaded-importer/src/convert/page-renderer.js";
import { createLinkResolver } from "cos-reloaded-importer/src/resolve/link-resolver.js";
import { createLocalization, identityLocalization } from "cos-reloaded-importer/src/translate/localization.js";
import { buildVaultIndex } from "cos-reloaded-importer/src/vault/vault-index.js";
import { buildHandoutPlan } from "./handout-plan.js";
import { formatRoll20Link } from "./links.js";

const ROOT_NAME = "Curse of Strahd: Reloaded";

// Roll20 handout links cannot target a heading, so anchors are never used.
const noSlug = (text) => text;

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
  const resolveLink = createLinkResolver({ index, slugify: noSlug, localization });
  const renderPage = createPageRenderer({ resolveLink, imageUrl, toHtml, formatLink: formatRoll20Link });
  const journalPlan = buildJournalPlan({ index, renderPage, rootName: ROOT_NAME, localization });
  const journals = journalPlan.journals.filter((journal) => journal.path.startsWith(only));
  return {
    lang,
    handouts: buildHandoutPlan({ ...journalPlan, journals }),
    translation: localization.stats
  };
}
