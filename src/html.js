// Roll20 handouts have no stylesheet and no Font Awesome, so the module's CSS
// is inlined element by element and callouts lose their icons and folding.

const ACCENT = "#7a1f1f";
const BORDER = "#d1d1d1";
const PANEL = "#f5f5f5";

const CALLOUT_COLORS = {
  info: "#2f5f8a",
  abstract: "#3b7a6b",
  lore: "#6b4f2a",
  combat: "#8a1c1c",
  warning: "#a35a00",
  profile: "#5a3d7a",
  item: "#7a6a1f",
  design: "#4a4a4a",
  tip: "#4a4a4a"
};

const TAG_STYLES = {
  img: "max-width: 100%; height: auto;",
  table: "width: 100%; border-collapse: collapse;",
  th: `padding: 0.25em 0.5em; border: 1px solid ${BORDER}; vertical-align: top;`,
  td: `padding: 0.25em 0.5em; border: 1px solid ${BORDER}; vertical-align: top;`
};

const CLASS_STYLES = {
  description: `margin: 0.75em 0; padding: 0.6em 1em; border-left: 4px solid ${ACCENT}; background: #f6eded; font-style: italic;`,
  citation: `font-variant: small-caps; font-weight: bold; color: ${ACCENT};`,
  highlight: "font-weight: bold;",
  credit: "display: block; font-size: 0.85em; color: #555555;",
  subtitle: "display: block; font-size: 0.85em; color: #555555;",
  statblock: `margin: 0.75em 0; padding: 0.5em 0.75em; border-top: 3px solid ${ACCENT}; border-bottom: 3px solid ${ACCENT}; background: ${PANEL}; font-size: 0.9em;`,
  "ability-table": "text-align: center;",
  "cosr-callout-body": "padding: 0 0.75em 0.5em;"
};

const PAGE_WRAPPER = /^<div class="cosr-page">([\s\S]*)<\/div>$/;
const ICON = /<i class="fa-[^"]*"><\/i>\s?/g;
const CALLOUT_OPENING = /<(?:details|div) class="cosr-callout cosr-callout-([\w-]+)"(?: open)?><(?:summary|div class="cosr-callout-title")>/g;
const OPENING_TAG = /<([a-zA-Z][\w-]*)(\s[^>]*?)?(\s*\/)?>/g;
const CLASS_ATTR = /\s+class=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;
const STYLE_ATTR = /\s+style=(?:"([^"]*)"|'([^']*)')/i;

function calloutOpening(match, type) {
  const color = CALLOUT_COLORS[type] ?? ACCENT;
  const box = `margin: 0.75em 0; border: 1px solid ${BORDER}; border-left: 4px solid ${color}; border-radius: 4px; background: ${PANEL};`;
  const title = `padding: 0.4em 0.75em; font-weight: bold; color: ${color};`;
  return `<div style="${box}"><div style="${title}">`;
}

function flattenCallouts(html) {
  return html.replace(CALLOUT_OPENING, calloutOpening).replaceAll("</summary>", "</div>").replaceAll("</details>", "</div>");
}

// Takes an attribute out of the attribute string and returns its value and the rest.
function extractAttribute(attributes, pattern) {
  const match = attributes.match(pattern);
  if (!match) {
    return { value: null, rest: attributes };
  }
  const value = match[1] ?? match[2] ?? match[3] ?? "";
  return { value, rest: attributes.replace(match[0], "") };
}

function asDeclaration(style) {
  const trimmed = style.trim();
  if (trimmed === "" || trimmed.endsWith(";")) {
    return trimmed;
  }
  return `${trimmed};`;
}

function inlineStyles(match, tag, attributes = "", selfClosing = "") {
  const classAttribute = extractAttribute(attributes, CLASS_ATTR);
  const styleAttribute = extractAttribute(classAttribute.rest, STYLE_ATTR);
  const classes = (classAttribute.value ?? "").split(/\s+/);
  const styles = [TAG_STYLES[tag.toLowerCase()], ...classes.map((name) => CLASS_STYLES[name]), styleAttribute.value]
    .filter(Boolean)
    .map(asDeclaration)
    .filter((style) => style !== "");

  let styleText = "";
  if (styles.length > 0) {
    styleText = ` style="${styles.join(" ")}"`;
  }
  return `<${tag}${styleAttribute.rest}${styleText}${selfClosing}>`;
}

export function toRoll20Html(html) {
  let text = html.replace(PAGE_WRAPPER, "$1");
  text = text.replace(ICON, "");
  text = flattenCallouts(text);
  return text.replace(OPENING_TAG, inlineStyles);
}
