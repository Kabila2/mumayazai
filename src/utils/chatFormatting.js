/**
 * Turn an assistant reply into tidy HTML for a chat bubble.
 *
 * The models answer in light Markdown even when asked not to: `**bold**`,
 * `### headings`, `* bullets`, `---` rules. Painting that raw leaves asterisks
 * and hashes all over the bubble. This converts the handful of marks that
 * actually show up and drops the rest, and it escapes the text first so the
 * bubble can never run anything the model (or a learner) typed.
 */

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const MARKER_HTML = (marker) =>
  `<span style="display: inline-block; margin-right: 8px;">${marker}</span>`;

// Real Markdown emphasis hugs its text: "**bold**", never "** bold **".
const HUGGED = '([^*\\s](?:[^*\\n]*?[^*\\s])?)';
const BOLD_ITALIC = new RegExp(`\\*\\*\\*${HUGGED}\\*\\*\\*`, 'g');
const BOLD = new RegExp(`\\*\\*${HUGGED}\\*\\*`, 'g');
const ITALIC = new RegExp(`(^|[\\s(])\\*${HUGGED}\\*(?=[\\s).,;:!?]|$)`, 'g');
const BOLD_UNDERSCORE = /__(\S(?:[^_\n]*?\S)?)__/g;
const ITALIC_UNDERSCORE = /(^|[\s(])_(\S(?:[^_\n]*?\S)?)_(?=[\s).,;:!?]|$)/g;
const RULE = /^\s*([-*_])\s*(\1\s*){2,}$/;

/** Inline marks: bold, italic, inline code. Order matters — bold before italic. */
const inlineHtml = (line) =>
  line
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(BOLD_ITALIC, '<strong><em>$1</em></strong>')
    .replace(BOLD, '<strong>$1</strong>')
    .replace(BOLD_UNDERSCORE, '<strong>$1</strong>')
    .replace(ITALIC, '$1<em>$2</em>')
    .replace(ITALIC_UNDERSCORE, '$1<em>$2</em>')
    // Anything still wrapped in stray asterisks is noise, not formatting
    .replace(/\*+/g, '');

const lineHtml = (rawLine) => {
  const line = rawLine.trimEnd();
  if (!line.trim()) return '';

  // Horizontal rules (---, ***, ___) carry nothing in a chat bubble
  if (RULE.test(line)) return null;

  // "### Heading" → a bold line
  const heading = line.match(/^\s*#{1,6}\s+(.+?)\s*#*\s*$/);
  if (heading) return `<strong>${inlineHtml(heading[1])}</strong>`;

  // "* item", "- item", "• item", "+ item" → one shared bullet style
  const bullet = line.match(/^\s*[-*+•]\s+(.+)$/);
  if (bullet) return `${MARKER_HTML('•')}${inlineHtml(bullet[1])}`;

  // "1. item" / "1) item" keeps its number
  const numbered = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
  if (numbered) return `${MARKER_HTML(`${numbered[1]}.`)}${inlineHtml(numbered[2])}`;

  // A quoted line just loses its marker
  const quote = line.match(/^\s*>\s?(.+)$/);
  if (quote) return inlineHtml(quote[1]);

  return inlineHtml(line.trim());
};

/** HTML for a chat bubble. Safe to hand to dangerouslySetInnerHTML. */
export const chatHtml = (text) => {
  if (!text) return '';
  const lines = escapeHtml(text).replace(/\r\n?/g, '\n').split('\n');
  const rendered = [];
  for (const raw of lines) {
    const html = lineHtml(raw);
    if (html === null) continue; // dropped rule
    // Collapse runs of blank lines to a single one
    if (html === '' && rendered[rendered.length - 1] === '') continue;
    rendered.push(html);
  }
  while (rendered[0] === '') rendered.shift();
  while (rendered[rendered.length - 1] === '') rendered.pop();
  return rendered.join('<br/>');
};

/** The same reply as plain text, for speech, saving and previews. */
export const chatPlainText = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => {
      if (RULE.test(line)) return null;
      return line
        .replace(/^\s*#{1,6}\s+/, '')
        .replace(/^\s*(?:[-*+•]|\d+[.)])\s+/, '• ')
        .replace(/^\s*>\s?/, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(BOLD_ITALIC, '$1')
        .replace(BOLD, '$1')
        .replace(BOLD_UNDERSCORE, '$1')
        .replace(ITALIC, '$1$2')
        .replace(ITALIC_UNDERSCORE, '$1$2')
        .replace(/\*+/g, '')
        .trimEnd();
    })
    .filter((line) => line !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
