import { chunkKeyFor } from "./chunk-keys.js";
import { splitMarkdown } from "./chunks.js";

const INDENT_PER_LEVEL = 1.5;

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

// Roll20 sorts Journal entries alphabetically and the API cannot create folders,
// so every handout name starts with its number in the guide's outline.
const MAX_PER_LEVEL = 99;

function pad(count) {
  if (count > MAX_PER_LEVEL) {
    throw new Error(`More than ${MAX_PER_LEVEL} handouts at one outline level: widen the numbers`);
  }
  return String(count).padStart(2, "0");
}

function numberedParts(parts) {
  const counters = [];
  return parts.map((part) => {
    const depth = part.path.length;
    counters.length = depth;
    counters[depth - 1] = (counters[depth - 1] ?? 0) + 1;
    return { ...part, number: counters.map(pad).join(".") };
  });
}

function escapeHtml(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function linkToken(key, label) {
  return `{{cosr:${key}}}${escapeHtml(label)}{{/cosr}}`;
}

function contentsItem(entry) {
  const indent = (entry.level - 2) * INDENT_PER_LEVEL;
  let style = "";
  if (indent > 0) {
    style = ` style="margin-left: ${indent}em;"`;
  }
  return `<li${style}>${linkToken(entry.key, entry.label)}</li>`;
}

function contents(entries) {
  if (entries.length === 0) {
    return "";
  }
  return `<ul style="list-style: none; padding-left: 0;">${entries.map(contentsItem).join("")}</ul>`;
}

function backLink(key, label) {
  return `<p style="font-size: 0.85em;">${linkToken(key, label)}</p>`;
}

function partsOf(section, markdown, level, numberPrefix) {
  const [preamble, ...chunks] = splitMarkdown(markdown, level);
  const parts = numberedParts(chunks).map((chunk) => ({
    ...chunk,
    key: chunkKeyFor(section, chunk.position),
    label: chunk.path.at(-1),
    name: `${numberPrefix}.${chunk.number} ${chunk.path.at(-1)}`
  }));
  return { preamble, parts };
}

function partHandouts(parts, document, parent, renderChunk) {
  return parts.map((part) => ({
    key: part.key,
    name: part.name,
    notes: backLink(parent.key, parent.label) + renderChunk(part.markdown, document, part.key)
  }));
}

// Per journal: a numbered journal handout (its introduction, or only a contents list),
// then each section, then the parts of split sections (see computeSplitLevels).
// `journalPlan` pages hold the displayed markdown; `renderChunk(markdown, document, key)`
// turns a chunk into handout HTML. Journals left out by `includes` keep their number.
export function buildHandoutPlan({ journalPlan, index, splitLevels, renderChunk, includes = () => true }) {
  const sections = new Map();
  const documents = new Map();
  for (const document of index.documents) {
    documents.set(document.path, document);
    for (const section of document.sections) {
      sections.set(section.key, section);
    }
  }
  const levelOf = (page) => splitLevels.get(page.key) ?? 1;

  return journalsInTreeOrder(journalPlan).flatMap((journal, journalPosition) => {
    if (!includes(journal)) {
      return [];
    }
    const document = documents.get(journal.path);
    const journalNumber = pad(journalPosition + 1);
    const pages = [...journal.pages].sort(bySort);
    let introduction = null;
    if (pages.length > 0 && sections.get(pages[0].key).title === null) {
      introduction = pages.shift();
    }

    const handouts = [];
    let journalKey = journal._id;
    let journalNotes = "";
    if (introduction) {
      const section = sections.get(introduction.key);
      journalKey = chunkKeyFor(section, -1);
      const { preamble, parts } = partsOf(section, introduction.content, levelOf(introduction), `${journalNumber}.00`);
      journalNotes = renderChunk(preamble.markdown, document, journalKey) + contents(parts);
      handouts.push(...partHandouts(parts, document, { key: journalKey, label: journal.name }, renderChunk));
    }

    const sectionEntries = pages.map((page) => ({ key: chunkKeyFor(sections.get(page.key), -1), level: 2, label: page.name }));
    const journalHandout = { key: journalKey, name: `${journalNumber} ${journal.name}`, notes: journalNotes + contents(sectionEntries) };

    pages.forEach((page, pagePosition) => {
      const section = sections.get(page.key);
      const sectionKey = chunkKeyFor(section, -1);
      const sectionNumber = `${journalNumber}.${pad(pagePosition + 1)}`;
      const { preamble, parts } = partsOf(section, page.content, levelOf(page), sectionNumber);
      handouts.push({
        key: sectionKey,
        name: `${sectionNumber} ${page.name}`,
        notes: backLink(journalKey, journal.name) + renderChunk(preamble.markdown, document, sectionKey) + contents(parts)
      });
      handouts.push(...partHandouts(parts, document, { key: sectionKey, label: page.name }, renderChunk));
    });

    return [journalHandout, ...handouts];
  });
}
