// Builds the Roll20 Mod script: fetches the guide from GitHub, converts it with the
// shared pipeline and bundles the handouts with the importer into one file.
//
//   node tools/build.mjs --lang en --only "Act I - Into the Mists/Arc A" --out dist/arc-a-en.js
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import * as esbuild from "esbuild";
import showdown from "showdown";
import { SOURCE } from "cos-reloaded-importer/src/constants.js";
import { createMarkdownConverter } from "cos-reloaded-importer/src/convert/markdown-converter.js";
import { createGithubSource } from "cos-reloaded-importer/src/source/github-source.js";
import { buildVaultIndex } from "cos-reloaded-importer/src/vault/vault-index.js";
import { buildHandoutData } from "../src/build-handouts.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TRANSLATIONS = join(ROOT, "node_modules", "cos-reloaded-importer", "translations");
const LANGUAGES = ["en", "fr"];

function readOptions() {
  const { values } = parseArgs({
    options: {
      lang: { type: "string", default: "en" },
      only: { type: "string", default: "" },
      out: { type: "string" }
    }
  });
  if (!LANGUAGES.includes(values.lang)) {
    throw new Error(`--lang must be one of ${LANGUAGES.join(", ")}`);
  }
  let out = values.out;
  if (!out) {
    out = join(ROOT, "dist", `cos-reloaded-roll20-${values.lang}.js`);
  }
  return { lang: values.lang, only: values.only, out };
}

async function fetchGuide() {
  const source = createGithubSource(SOURCE);
  const commit = await source.latestCommit();
  const files = await source.listFiles(commit.sha);
  const markdownFiles = await Promise.all(
    files.markdown.map(async (path) => ({ path, text: await source.readFile(commit.sha, path) }))
  );
  const index = buildVaultIndex({ markdownFiles, imagePaths: files.images });
  const imageUrl = (name) => {
    const path = index.imagePath(name);
    if (!path) {
      return null;
    }
    return source.fileUrl(commit.sha, path);
  };
  return { commit, markdownFiles, imagePaths: files.images, imageUrl };
}

async function readTranslation(lang) {
  if (lang === "en") {
    return null;
  }
  const folder = join(TRANSLATIONS, lang);
  const manifest = JSON.parse(await readFile(join(folder, "manifest.json"), "utf8"));
  const files = await Promise.all(
    Object.keys(manifest.files).map(async (path) => ({ path, text: await readFile(join(folder, path), "utf8") }))
  );
  return { manifest, files };
}

function header({ version, lang, commit, count }) {
  return [
    "/*",
    ` * Curse of Strahd: Reloaded - Roll20 importer v${version}`,
    ` * Guide: DragnaCarta, https://github.com/${SOURCE.owner}/${SOURCE.repo} (commit ${commit.sha.slice(0, 7)}, ${commit.date})`,
    " * Importer code: MIT License, https://github.com/Stphn-Wrn/cos-reloaded-roll20",
    ` * Language: ${lang}, ${count} handouts. In game, a GM types: !cosr import`,
    " */"
  ].join("\n");
}

async function main() {
  const options = readOptions();
  const { version } = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
  const guide = await fetchGuide();
  const translation = await readTranslation(options.lang);
  const data = buildHandoutData({
    markdownFiles: guide.markdownFiles,
    imagePaths: guide.imagePaths,
    imageUrl: guide.imageUrl,
    toHtml: createMarkdownConverter(showdown),
    lang: options.lang,
    translation,
    only: options.only
  });
  if (data.handouts.length === 0) {
    throw new Error(`No guide page matches --only "${options.only}"`);
  }

  const embedded = { lang: data.lang, handouts: data.handouts };
  await mkdir(dirname(options.out), { recursive: true });
  await esbuild.build({
    stdin: {
      contents: `import { startRoll20Importer } from "./src/roll20-main.js";\nstartRoll20Importer(${JSON.stringify(embedded)});\n`,
      resolveDir: ROOT,
      loader: "js"
    },
    bundle: true,
    format: "iife",
    target: "es2017",
    charset: "utf8",
    banner: { js: header({ version, lang: data.lang, commit: guide.commit, count: data.handouts.length }) },
    outfile: options.out,
    logLevel: "warning"
  });

  console.log(`${data.handouts.length} handouts written to ${options.out}`);
  if (translation) {
    console.log(`Translation: ${data.translation.translated} sections translated, ${data.translation.outdated} outdated (kept in English)`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
