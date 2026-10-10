import { contentHash } from "cos-reloaded-importer/src/resolve/document-ids.js";

const COMMAND = /^!cosr\s+import(?:\s+(force))?\s*$/i;
const LINK_TOKEN = /\{\{cosr:([A-Za-z0-9]{16})\}\}([\s\S]*?)\{\{\/cosr\}\}/g;
const HANDOUT_URL = "http://journal.roll20.net/handout/";
const DEFAULT_BATCH_SIZE = 10;

function plural(count, singular, pluralForm) {
  if (count > 1) {
    return pluralForm;
  }
  return singular;
}

const MESSAGES = {
  en: {
    started: (total) => `Importing ${total} handouts...`,
    alreadyRunning: () => "An import is already running.",
    finished: ({ created, updated, unchanged }) =>
      `Import finished: ${created} created, ${updated} updated, ${unchanged} unchanged.`
  },
  fr: {
    started: (total) => `Import de ${total} handouts...`,
    alreadyRunning: () => "Un import est déjà en cours.",
    finished: ({ created, updated, unchanged }) =>
      `Import terminé : ${created} ${plural(created, "créé", "créés")}, ${updated} mis à jour, ` +
      `${unchanged} ${plural(unchanged, "inchangé", "inchangés")}.`
  }
};

// `api` adapts the Roll20 sandbox: storage (the persisted state object), isGM,
// handoutExists, createHandout, writeHandout, defer and whisper.
export function createRoll20Importer({ data, api, batchSize = DEFAULT_BATCH_SIZE }) {
  const messages = MESSAGES[data.lang] ?? MESSAGES.en;
  let running = false;

  function store() {
    api.storage.handouts ??= {};
    return api.storage.handouts;
  }

  // Roll20 flags scripts that work too long in one go, so each tick handles a few items.
  function inBatches(items, step, onDone) {
    let index = 0;
    function tick() {
      const end = Math.min(index + batchSize, items.length);
      for (; index < end; index++) {
        step(items[index]);
      }
      if (index < items.length) {
        api.defer(tick);
        return;
      }
      onDone();
    }
    api.defer(tick);
  }

  function linkTo(key, label) {
    const target = store()[key];
    if (!target || !api.handoutExists(target.id)) {
      return label;
    }
    return `<a href="${HANDOUT_URL}${target.id}">${label}</a>`;
  }

  function resolveLinks(notes) {
    return notes.replace(LINK_TOKEN, (match, key, label) => linkTo(key, label));
  }

  function ensureHandout(handout, report) {
    const known = store()[handout.key];
    if (known && api.handoutExists(known.id)) {
      return;
    }
    store()[handout.key] = { id: api.createHandout(handout.name), hash: null };
    report.created++;
  }

  // The hash covers the resolved notes, so a recreated target also refreshes the pages linking to it.
  function writeHandout(handout, report, force) {
    const entry = store()[handout.key];
    const notes = resolveLinks(handout.notes);
    const hash = contentHash(`${handout.name}\n${notes}`);
    if (!force && entry.hash === hash) {
      report.unchanged++;
      return;
    }
    api.writeHandout(entry.id, { name: handout.name, notes });
    entry.hash = hash;
    report.updated++;
  }

  function runImport(force) {
    if (running) {
      api.whisper(messages.alreadyRunning());
      return;
    }
    running = true;
    const report = { created: 0, updated: 0, unchanged: 0 };
    api.whisper(messages.started(data.handouts.length));
    inBatches(data.handouts, (handout) => ensureHandout(handout, report), () => {
      inBatches(data.handouts, (handout) => writeHandout(handout, report, force), () => {
        running = false;
        api.whisper(messages.finished(report));
      });
    });
  }

  function handleChat(message) {
    if (message.type !== "api") {
      return;
    }
    const command = message.content.trim().match(COMMAND);
    if (!command || !api.isGM(message.playerid)) {
      return;
    }
    runImport(command[1] !== undefined);
  }

  return { handleChat };
}
