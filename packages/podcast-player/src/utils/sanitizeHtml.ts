/**
 * Sanitises untrusted HTML (e.g. podcast descriptions from PodcastIndex).
 * - Removes dangerous tags: script, iframe, style, object, embed, form, input, textarea, select
 * - Strips all inline event handlers (on*) and style attributes
 * - Forces anchor links to open in a new tab with rel="noopener noreferrer"
 */
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,iframe,style,object,embed,form,input,textarea,select').forEach(el => el.remove());
  doc.querySelectorAll('*').forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('on') || attr.name === 'style') {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName === 'A') {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return doc.body.innerHTML;
}
