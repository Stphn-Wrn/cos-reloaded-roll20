/*
 * CoS Reloaded - journal folder probe for Roll20.
 * Checks whether a Mod script can put handouts in a Journal folder, to keep the guide's tree.
 * Paste it as a Mod script, then a GM types !cosr-folder-probe in the chat.
 */
on("ready", () => {
  const COMMAND = "!cosr-folder-probe";
  const SPEAKER = "CoS Reloaded probe";
  const FOLDER_NAME = "CoSR folder probe";
  const PROPERTIES = ["_journalfolder", "journalfolder"];

  function whisper(text) {
    sendChat(SPEAKER, `/w gm ${text}`, null, { noarchive: true });
  }

  function readTree() {
    const raw = Campaign().get("journalfolder");
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      return [];
    }
  }

  function createHandout(name) {
    return createObj("handout", { name, inplayerjournals: "", archived: false });
  }

  // Tries to write the tree through one property name, then reports whether it stuck.
  function attempt(properties, folder, done) {
    if (properties.length === 0) {
      done("no property name worked");
      return;
    }
    const [property, ...rest] = properties;
    const tree = [folder, ...readTree().filter((item) => !folder.d.includes(item))];
    let error = "";
    try {
      Campaign().set(property, JSON.stringify(tree));
    } catch (caught) {
      error = ` (error: ${caught.message})`;
    }
    setTimeout(() => {
      const stored = Campaign().get("journalfolder") || "";
      log(`CoS Reloaded folder probe, journalfolder after setting ${property}: ${stored}`);
      if (stored.includes(FOLDER_NAME)) {
        done(`setting ${property} worked${error}`);
        return;
      }
      whisper(`Setting ${property} did not stick${error}.`);
      attempt(rest, folder, done);
    }, 1000);
  }

  function runProbe() {
    // Created in reverse alphabetical order, to see whether the folder keeps our order.
    const second = createHandout("aa CoSR folder probe, should be SECOND");
    const first = createHandout("zz CoSR folder probe, should be FIRST");
    const folder = { n: FOLDER_NAME, d: [first.id, second.id], i: `-cosrprobe${Date.now()}` };
    attempt(PROPERTIES, folder, (result) => {
      whisper(`Folder check: ${result}. Look in the Journal (refresh the page if needed) for a folder "${FOLDER_NAME}" and note the order of the two handouts inside it.`);
    });
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

  log(`CoS Reloaded folder probe ready. Type ${COMMAND}`);
});
