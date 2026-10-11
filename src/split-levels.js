import { parseWikilink } from "cos-reloaded-importer/src/convert/obsidian-syntax.js";

const WIKILINK = /(?<!!)\[\[([^\]]+)\]\]/g;

function targetHeading(index, link, document) {
  if (!link.anchor || link.anchor.startsWith("^")) {
    return null;
  }
  let target = document;
  if (link.page !== "") {
    target = index.findDocument(link.page);
  }
  if (!target) {
    return null;
  }
  return index.findHeading(target, link.anchor.split("#").pop());
}

// Roll20 links cannot reach a heading inside a handout, so a section is cut into
// handouts down to the deepest heading level that some link points to.
export function computeSplitLevels(index) {
  const levels = new Map();
  for (const document of index.documents) {
    for (const section of document.sections) {
      for (const match of section.markdown.matchAll(WIKILINK)) {
        const heading = targetHeading(index, parseWikilink(match[1]), document);
        if (!heading) {
          continue;
        }
        const key = heading.section.key;
        levels.set(key, Math.max(levels.get(key) ?? 1, heading.level));
      }
    }
  }
  return levels;
}
