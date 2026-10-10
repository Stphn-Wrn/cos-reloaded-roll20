const SPEAKER = "CoS Reloaded";

// Adapter between the importer core and the Roll20 Mod sandbox functions.
export function createRoll20Adapter(sandbox) {
  sandbox.state.CoSR ??= {};
  return {
    storage: sandbox.state.CoSR,
    isGM: (playerId) => sandbox.playerIsGM(playerId),
    handoutExists: (id) => Boolean(sandbox.getObj("handout", id)),
    // Notes cannot be given to createObj; they are written by writeHandout.
    createHandout: (name) => sandbox.createObj("handout", { name, inplayerjournals: "", archived: false }).id,
    writeHandout(id, { name, notes }) {
      const handout = sandbox.getObj("handout", id);
      if (!handout) {
        return;
      }
      handout.set("name", name);
      handout.set("notes", notes);
    },
    defer: (task) => sandbox.setTimeout(task, 0),
    whisper: (text) => sandbox.sendChat(SPEAKER, `/w gm ${text}`, null, { noarchive: true })
  };
}
