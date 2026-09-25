import assert from 'node:assert/strict';
// Dialogs legitimately have their own footer. Select the one site-shell footer,
// not the first semantic footer in the document; do not discard its contents.
export function siteFooter46(html, label = 'page') {
  const matches = [...html.matchAll(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi)].filter(match => {
    const tag = match[0].slice(0, match[0].indexOf('>') + 1);
    const classes = tag.match(/\sclass\s*=\s*(["'])(.*?)\1/i)?.[2].split(/\s+/) || [];
    return classes.includes('site-footer');
  });
  assert.equal(matches.length, 1, label + ': exactly one site-footer required');
  return matches[0][0];
}
