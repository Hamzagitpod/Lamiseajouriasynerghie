
export function toPlainText(input: string): string {
  if (!input) return "";
  // Remove common markdown symbols
  let out = input
    .replace(/\*\*(.*?)\*\*/g, '$1')     // bold
    .replace(/\*(.*?)\*/g, '$1')           // italics
    .replace(/`{1,3}[^`]*`{1,3}/g, '')       // inline/blocks code
    .replace(/^#{1,6}\s*/gm, '')            // headings
    .replace(/^>\s*/gm, '')                 // blockquotes
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')// links
    .replace(/^-\s+/gm, '')                 // list dashes
    .replace(/^\d+\.\s+/gm, '');          // numbered lists
  // Normalize whitespace
  out = out.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return out;
}
