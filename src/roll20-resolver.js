import { createLinkResolver } from "cos-reloaded-importer/src/resolve/link-resolver.js";
import { identityLocalization } from "cos-reloaded-importer/src/translate/localization.js";
import { chunkKeyFor, chunkPositionOf } from "./chunk-keys.js";

// Roll20 handout links cannot target a heading, so anchors are never used.
const noSlug = (text) => text;

// Reuses the shared resolver for labels, then points the link to the handout
// (chunk) holding its target. A link to its own handout gets no target.
export function createRoll20LinkResolver({ index, splitLevels, localization = identityLocalization }) {
  const resolveShared = createLinkResolver({ index, slugify: noSlug, localization });

  function targetKey(link, document, fallback) {
    if (!link.anchor || link.anchor.startsWith("^")) {
      return fallback;
    }
    let target = document;
    if (link.page !== "") {
      target = index.findDocument(link.page);
    }
    const heading = index.findHeading(target, link.anchor.split("#").pop());
    if (!heading) {
      return fallback;
    }
    if (heading.level === 1) {
      return chunkKeyFor(heading.section, -1);
    }
    const level = splitLevels.get(heading.section.key) ?? 1;
    return chunkKeyFor(heading.section, chunkPositionOf(heading.section, heading.position, level));
  }

  return function resolveLink(link, document, fromKey) {
    const resolved = resolveShared(link, document);
    if (!resolved) {
      return null;
    }
    let pageId = targetKey(link, document, resolved.pageId);
    if (pageId === fromKey) {
      pageId = null;
    }
    return { ...resolved, pageId };
  };
}
