import { plainHeading } from "cos-reloaded-importer/src/vault/markdown-tools.js";

// Same heading pattern as the vault index, so positions match `section.headings`.
const HEADING = /^(#{1,6}) +(.+?)\s*#*\s*$/;

// Splits a section into the preamble (position -1) and one chunk per heading
// down to `level`; deeper headings stay inside their chunk.
export function splitMarkdown(markdown, level) {
  const preamble = { position: -1, level: 1, path: [], lines: [] };
  const chunks = [preamble];
  const ancestors = [];
  let current = preamble;
  let position = -1;

  for (const line of markdown.split("\n")) {
    const heading = line.match(HEADING);
    if (heading) {
      position++;
      const headingLevel = heading[1].length;
      if (headingLevel <= level) {
        while (ancestors.length > 0 && ancestors.at(-1).level >= headingLevel) {
          ancestors.pop();
        }
        ancestors.push({ level: headingLevel, plain: plainHeading(heading[2]) });
        current = { position, level: headingLevel, path: ancestors.map((ancestor) => ancestor.plain), lines: [] };
        chunks.push(current);
      }
    }
    current.lines.push(line);
  }

  return chunks.map(({ lines, ...chunk }) => ({ ...chunk, markdown: lines.join("\n").trim() }));
}
