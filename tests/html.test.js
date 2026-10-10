import { test } from "node:test";
import assert from "node:assert/strict";
import { toRoll20Html } from "../src/html.js";

test("drops the page wrapper", () => {
  const html = '<div class="cosr-page"><p>Text</p></div>';

  assert.equal(toRoll20Html(html), "<p>Text</p>");
});

test("turns guide classes into inline styles", () => {
  const html = '<span class="citation">Strahd</span>';

  assert.equal(toRoll20Html(html), '<span style="font-variant: small-caps; font-weight: bold; color: #7a1f1f;">Strahd</span>');
});

test("keeps the element's own style after the class style", () => {
  const html = '<div class="description" style="text-align: center">Read aloud</div>';

  const result = toRoll20Html(html);

  assert.match(result, /^<div style="margin: [^"]*font-style: italic; text-align: center;">Read aloud<\/div>$/);
});

test("reads unquoted class attributes", () => {
  const html = "<div class=description>Read aloud</div>";

  assert.match(toRoll20Html(html), /^<div style="[^"]*font-style: italic;">/);
});

test("drops classes it does not know", () => {
  const html = '<div class="flowchart" id="x">Chart</div>';

  assert.equal(toRoll20Html(html), '<div id="x">Chart</div>');
});

test("styles tables and images, including self-closing tags", () => {
  const html = '<table><tr><td>A</td></tr></table><img src="a.png" />';

  const result = toRoll20Html(html);

  assert.match(result, /^<table style="width: 100%; border-collapse: collapse;"><tr><td style="padding: [^"]*">A<\/td><\/tr><\/table>/);
  assert.match(result, /<img src="a.png" style="max-width: 100%; height: auto;" \/>$/);
});

test("turns a foldable callout into an always open block coloured by its type, without icon", () => {
  const html =
    '<details class="cosr-callout cosr-callout-combat"><summary><i class="fa-solid fa-skull"></i> Fight</summary>' +
    '<div class="cosr-callout-body"><p>Stats</p></div></details>';

  const result = toRoll20Html(html);

  assert.equal(
    result,
    '<div style="margin: 0.75em 0; border: 1px solid #d1d1d1; border-left: 4px solid #8a1c1c; border-radius: 4px; background: #f5f5f5;">' +
      '<div style="padding: 0.4em 0.75em; font-weight: bold; color: #8a1c1c;">Fight</div>' +
      '<div style="padding: 0 0.75em 0.5em;"><p>Stats</p></div></div>'
  );
});

test("gives unknown callout types the accent colour", () => {
  const html =
    '<div class="cosr-callout cosr-callout-mystery"><div class="cosr-callout-title"><i class="fa-solid fa-circle-info"></i> Odd</div>' +
    '<div class="cosr-callout-body"><p>x</p></div></div>';

  const result = toRoll20Html(html);

  assert.match(result, /^<div style="[^"]*border-left: 4px solid #7a1f1f;[^"]*"><div style="[^"]*color: #7a1f1f;">Odd<\/div>/);
});

test("renders a guide page end to end with the shared pipeline", async () => {
  const showdown = (await import("showdown")).default;
  const { createMarkdownConverter } = await import("cos-reloaded-importer/src/convert/markdown-converter.js");
  const { createPageRenderer } = await import("cos-reloaded-importer/src/convert/page-renderer.js");
  const { formatRoll20Link } = await import("../src/links.js");
  const renderPage = createPageRenderer({
    resolveLink: () => ({ uuid: "x", pageId: "p1", label: "Ismark" }),
    imageUrl: (name) => name,
    toHtml: createMarkdownConverter(showdown),
    formatLink: formatRoll20Link
  });
  const markdown = '<div class="description">Fog rolls in.</div>\n\n> [!info]+ Note\n> Ask [[Ismark]].';

  const result = toRoll20Html(renderPage(markdown, {}));

  assert.doesNotMatch(result, /class=|<details|<summary|<i /);
  assert.match(result, /font-style: italic;">Fog rolls in\.<\/div>/);
  assert.match(result, /color: #2f5f8a;">Note<\/div>/);
  assert.match(result, /Ask \{\{cosr:p1\}\}Ismark\{\{\/cosr\}\}\./);
});
