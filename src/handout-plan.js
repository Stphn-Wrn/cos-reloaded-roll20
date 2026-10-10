import { toRoll20Html } from "./html.js";

const NAME_SEPARATOR = " | ";

function bySort(a, b) {
  return a.sort - b.sort;
}

function groupBy(items, keyOf) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  }
  return groups;
}

// Handouts all land at the journal root, so the folder tree is flattened
// depth first, subfolders before journals, as Foundry's sidebar shows it.
function journalsInTreeOrder({ folders, journals }) {
  const subfolders = groupBy(folders, (folder) => folder.parentId);
  const journalsByFolder = groupBy(journals, (journal) => journal.folderId);
  const ordered = [];

  function visit(folderId) {
    for (const folder of [...(subfolders.get(folderId) ?? [])].sort(bySort)) {
      visit(folder._id);
    }
    ordered.push(...[...(journalsByFolder.get(folderId) ?? [])].sort(bySort));
  }

  visit(null);
  return ordered;
}

function handoutName(journal, page) {
  if (page.name === journal.name) {
    return journal.name;
  }
  return `${journal.name}${NAME_SEPARATOR}${page.name}`;
}

export function buildHandoutPlan(journalPlan) {
  return journalsInTreeOrder(journalPlan).flatMap((journal) =>
    [...journal.pages].sort(bySort).map((page) => ({
      key: page._id,
      name: handoutName(journal, page),
      notes: toRoll20Html(page.content)
    }))
  );
}
