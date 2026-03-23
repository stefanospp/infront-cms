/**
 * Lightweight HTML sanitizer for CMS content rendered via set:html.
 * Strips dangerous tags (script, iframe, object, embed, form, etc.)
 * and dangerous attributes (onclick, onerror, javascript: URIs, etc.)
 *
 * For Directus WYSIWYG content that should contain only safe HTML
 * (paragraphs, headings, lists, links, images, formatting).
 */

const DANGEROUS_TAGS = /(<\s*\/?\s*(script|iframe|object|embed|applet|form|input|textarea|select|button|meta|link|base|style)\b[^>]*>)/gi;
const EVENT_HANDLERS = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;
const JAVASCRIPT_URIS = /(href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi;
const DATA_URIS_SCRIPT = /(href|src)\s*=\s*(?:"data:text\/html[^"]*"|'data:text\/html[^']*')/gi;

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(DANGEROUS_TAGS, '')
    .replace(EVENT_HANDLERS, '')
    .replace(JAVASCRIPT_URIS, '')
    .replace(DATA_URIS_SCRIPT, '');
}
