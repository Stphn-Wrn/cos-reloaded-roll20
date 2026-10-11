/*
 * CoS Reloaded - anchor probe for Roll20.
 * Checks whether handouts keep in-page anchors, to decide how links to rooms are built.
 * Paste it as a Mod script, then a GM types !cosr-probe in the chat.
 */
on("ready", () => {
  const COMMAND = "!cosr-probe";
  const SPEAKER = "CoS Reloaded probe";
  const HANDOUT_URL = "http://journal.roll20.net/handout/";

  function whisper(text) {
    sendChat(SPEAKER, `/w gm ${text}`, null, { noarchive: true });
  }

  function filler(label) {
    const paragraphs = [];
    for (let i = 1; i <= 30; i++) {
      paragraphs.push(`<p>${label}, filler paragraph ${i}. Scroll down to reach the next target.</p>`);
    }
    return paragraphs.join("");
  }

  function probeNotes(handoutId) {
    return [
      "<h2>Anchor probe</h2>",
      "<p>Click each link below. Note whether the handout scrolls to the matching target.</p>",
      '<ul><li><a href="#cosr-probe-id">Link 1: to a heading with an id</a></li>',
      '<li><a href="#cosr-probe-name">Link 2: to a named anchor</a></li>',
      `<li><a href="${HANDOUT_URL}${handoutId}#cosr-probe-full">Link 3: handout URL with an anchor</a></li></ul>`,
      filler("Before target 1"),
      '<h3 id="cosr-probe-id">Target 1 (heading with an id)</h3>',
      filler("Before target 2"),
      '<a name="cosr-probe-name"></a><h3>Target 2 (named anchor)</h3>',
      filler("Before target 3"),
      '<h3 id="cosr-probe-full">Target 3 (reached from the handout URL)</h3>',
      filler("End of the probe")
    ].join("");
  }

  function kept(notes, fragment) {
    let decoded = notes;
    try {
      decoded = decodeURIComponent(notes);
    } catch (error) {
      decoded = notes;
    }
    if (notes.includes(fragment) || decoded.includes(fragment)) {
      return "kept";
    }
    return "REMOVED";
  }

  function report(handout) {
    handout.get("notes", (notes) => {
      log(`CoS Reloaded probe, stored notes: ${notes}`);
      const lines = [
        `heading id: ${kept(notes, 'id="cosr-probe-id"')}`,
        `named anchor: ${kept(notes, 'name="cosr-probe-name"')}`,
        `#link: ${kept(notes, 'href="#cosr-probe-id"')}`,
        `handout URL with anchor: ${kept(notes, "#cosr-probe-full")}`
      ];
      whisper(`Stored HTML check. ${lines.join(", ")}. Now open the handout "CoSR anchor probe" and click the three links.`);
    });
  }

  function runProbe() {
    const handout = createObj("handout", { name: "CoSR anchor probe", inplayerjournals: "", archived: false });
    handout.set("notes", probeNotes(handout.id));
    setTimeout(() => report(handout), 1000);
  }

  on("chat:message", (message) => {
    if (message.type !== "api" || message.content.trim() !== COMMAND) {
      return;
    }
    if (!playerIsGM(message.playerid)) {
      return;
    }
    runProbe();
  });

  log(`CoS Reloaded anchor probe ready. Type ${COMMAND}`);
});
