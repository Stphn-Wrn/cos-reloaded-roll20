import { documentId, pageIdFor } from "cos-reloaded-importer/src/resolve/document-ids.js";

// The preamble keeps the Foundry page id, so handouts imported before the split stay linked.
export function chunkKeyFor(section, position) {
  if (position < 0) {
    return pageIdFor(section);
  }
  return documentId(`handout:${section.key}::${position}`);
}

// Position of the chunk holding the heading at `position` when the section is split at `level`.
export function chunkPositionOf(section, position, level) {
  for (let candidate = position; candidate >= 0; candidate--) {
    if (section.headings[candidate].level <= level) {
      return candidate;
    }
  }
  return -1;
}
