# Curse of Strahd: Reloaded for Roll20

A Roll20 Mod (API) script that imports DragnaCarta's
[Curse of Strahd: Reloaded](https://github.com/DragnaCarta/Curse-of-Strahd-Reloaded)
guide into linked handouts.

The conversion pipeline (vault parsing, link resolution, Markdown to HTML) is shared with
[cos-reloaded-importer](https://github.com/Stphn-Wrn/cos-reloaded-importer), the Foundry VTT version.
This repo only adds what is specific to Roll20: link format, handout HTML, the in-game importer and the build.

Mod scripts cannot fetch URLs, so the guide text is embedded in the generated script at build time.

## Requirements

- Roll20 Pro (needed by the GM to install Mod scripts)

## Development

```sh
npm install
npm test
```

Build a script (it fetches the latest guide from GitHub):

```sh
npm run build -- --lang en                  # dist/cos-reloaded-roll20-en.js
npm run build -- --lang fr                  # French translation
npm run build -- --lang fr --only "Act I - Into the Mists/Arc A" --out dist/arc-a-fr.js
```

Check a build in a simulated Roll20 sandbox:

```sh
npm run simulate -- dist/arc-a-fr.js
```

## Usage in Roll20

1. In the game's Mod (API) Scripts page, create a new script and paste the generated file.
2. In the chat, a GM types `!cosr import`. Handouts are created for the GM only, then filled.
3. Run it again after installing a newer build: only changed handouts are rewritten.
   `!cosr import force` rewrites everything.

Collapsible callouts are always expanded in Roll20, and links point to a section's handout, not to a heading inside it.

During development, `cos-reloaded-importer` is installed from the sibling folder `../cos-reloaded-importer`.

## License

MIT for the code. The guide content belongs to DragnaCarta and is included in the built scripts with the author's permission.
