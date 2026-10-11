# Curse of Strahd: Reloaded for Roll20

A Roll20 Mod (API) script that imports DragnaCarta's
[Curse of Strahd: Reloaded](https://github.com/DragnaCarta/Curse-of-Strahd-Reloaded)
guide into linked handouts, in English or French.

## Requirements

- Roll20 Pro: the game's creator needs it to install Mod scripts.

## Installation

1. Download the script from the [latest release](https://github.com/Stphn-Wrn/cos-reloaded-roll20/releases/latest):
   `cos-reloaded-roll20-en.js` (English) or `cos-reloaded-roll20-fr.js` (French).
2. On the game's page, open **Settings > Mod (API) Scripts** and click **New Script**.
3. Open the downloaded file in a text editor, copy all of it, paste it into the script editor and click **Save Script**.
   The API Output Console shows `CoS Reloaded importer ready (en, 1035 handouts). Type !cosr import`.
4. Launch the game and type `!cosr import` in the chat.
   The import runs in small batches and whispers a summary to the GM when it is done.

Handouts are created for the GM only. Share one with **Show to Players** or through its permissions.

Install it in a new game, or in a game without handouts from an earlier version: see [Journal order](#journal-order).

## Updating

Paste the new version over the old script, save, and type `!cosr import` again.
Only handouts whose content changed are rewritten, and handouts you deleted are recreated.
`!cosr import force` rewrites every handout.

An update overwrites the changed handouts, including your edits to them.
Copy a handout before editing it if you want to keep your notes.

## How the guide is laid out

- One handout per arc or chapter, numbered in the guide's order: `12 Arc A - Escape From Death House`.
  It holds the introduction and a list of links to its sections.
- One handout per section: `12.02 A2. Death House`.
- Sections whose rooms or sub-parts are linked from elsewhere are split further, one handout per part:
  `12.02.03 A2c. The Second Floor`, then `12.02.03.04 Library`. A split section ends with a list of its parts.
- Each section starts with a link back to its arc, and each part with a link back to its section.

Collapsible callouts are always expanded, since handouts cannot fold content.

## Roll20 limits behind this layout

- A link cannot open a handout at a heading: in-page anchors are ignored, and a handout URL with an anchor
  is treated as an external link. Sections are therefore split down to the headings that links point to,
  so every link opens the exact room or part.
- Mod scripts cannot create Journal folders, and Roll20 lists entries outside folders alphabetically.
  The outline number at the start of each name keeps the guide's order.

### Journal order

Roll20 places a new handout at its alphabetical position when it is created, and does not move it when it is
renamed. Handouts created by an earlier version, with different names, keep their old position. To get the
right order, delete them and type `!cosr import` again: the script recreates the missing handouts.

## Development

The conversion pipeline (vault parsing, link resolution, Markdown to HTML, French translation) is shared with
[cos-reloaded-importer](https://github.com/Stphn-Wrn/cos-reloaded-importer), the Foundry VTT version,
installed from GitHub as a dependency. This repo adds what is specific to Roll20: handout layout, link format,
handout HTML, the in-game importer and the build. Mod scripts cannot fetch URLs, so the guide text is embedded
in the generated script.

```sh
npm install
npm test
```

Build a script (the English guide is fetched from GitHub, the French text comes from the importer dependency):

```sh
npm run build -- --lang en                  # dist/cos-reloaded-roll20-en.js
npm run build -- --lang fr                  # dist/cos-reloaded-roll20-fr.js
npm run build -- --lang en --only "Act I - Into the Mists/Arc A" --out dist/arc-a-en.js
```

`--only` keeps the journals under a path, with the same numbers as in the full guide.

Check a build in a simulated Roll20 sandbox. It fails on unreplaced links, leftover classes or self links:

```sh
npm run simulate -- dist/arc-a-en.js
```

After pushing changes to the importer (for example to the translation), run `npm update cos-reloaded-importer`
and commit the lock file.

Releases are made with the **Release CoS Reloaded for Roll20** workflow in the Actions tab. It runs the tests,
builds both languages, checks them in the simulator and attaches them to a GitHub release.

`probes/` holds the two Mod scripts that established the anchor and folder limits above.

## License

MIT for the code. The guide content belongs to DragnaCarta and is included in the built scripts with the author's permission.
