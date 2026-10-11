# Curse of Strahd: Reloaded for Roll20

[Version française](README.fr.md)

A Roll20 Mod script that imports DragnaCarta's [Curse of Strahd: Reloaded](https://www.strahdreloaded.com) guide into your game as linked handouts, in English or French.

It is the Roll20 version of [cos-reloaded-importer](https://github.com/Stphn-Wrn/cos-reloaded-importer) for Foundry VTT. Roll20 scripts cannot download anything, so the guide is included in the script, with the author's permission.

## What it does

- The whole guide as about 1,000 handouts, numbered in the guide's order: `12 Arc A - Escape From Death House`, `12.02 A2. Death House`, `12.02.03.04 Library`.
- One handout per section, and one per room or sub-part when the guide links to it, so every link opens the right place.
- Each arc and section lists its parts as links, and each part links back to its parent.
- Read-aloud text, callouts, tables, stat blocks and images are styled.
- Running the import again after an update only rewrites the handouts that changed.

## Requirements

Roll20 Pro, for the game's creator: Mod scripts are a Pro feature.

## Installation

1. Download `cos-reloaded-roll20-en.js` (English) or `cos-reloaded-roll20-fr.js` (French) from the [latest release](https://github.com/Stphn-Wrn/cos-reloaded-roll20/releases/latest).
2. On your game's page, open **Settings > Mod (API) Scripts** and click **New Script**.
3. Paste the whole content of the file and click **Save Script**.

## Usage

In the game, type `!cosr import` in the chat. The GM gets a whisper when the import is done.

Handouts are visible to the GM only. Use **Show to Players** to share one.

## Updating

Replace the script's content with the new version, save, and type `!cosr import` again. Handouts you edited are overwritten if the guide changed them, so keep your notes in your own handouts.

Roll20 sorts the Journal alphabetically when a handout is created. If you installed an earlier version with different names, delete its handouts before importing so that everything is in order.

## French version

The French script contains the whole guide translated into French, except the Changelog, with the same layout.

## Credits

Curse of Strahd: Reloaded is written by DragnaCarta and published for free under the Wizards of the Coast Fan Content Policy. If the guide helps you, [support the author](https://www.strahdreloaded.com).

This script is not affiliated with DragnaCarta, Wizards of the Coast or Roll20.

## Development

The conversion is shared with the Foundry importer, installed from GitHub as a dependency.

```sh
npm install
npm test
npm run build -- --lang en                  # dist/cos-reloaded-roll20-en.js
npm run simulate -- dist/cos-reloaded-roll20-en.js
```

`--only "<path>"` builds part of the guide for tests. After changing the importer, run `npm update cos-reloaded-importer`. Releases are built by the **Release** workflow. `probes/` holds the scripts that showed Roll20 ignores in-handout anchors and cannot create folders from a script.
