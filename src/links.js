// Handout ids only exist once the handouts are created inside Roll20, so links
// carry the target page id and the importer swaps them for handout URLs at runtime.
export function formatRoll20Link(link, resolved, label) {
  if (!resolved || !resolved.pageId) {
    return label;
  }
  return `{{cosr:${resolved.pageId}}}${label}{{/cosr}}`;
}
