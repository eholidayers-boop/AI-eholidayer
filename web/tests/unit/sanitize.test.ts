import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '@/lib/security/sanitize';

describe('sanitizeHtml', () => {
  it('strips script tags', () => {
    expect(sanitizeHtml('<p>hi</p><script>alert(1)</script>')).toBe('<p>hi</p>');
  });
  it('strips onclick handlers', () => {
    expect(sanitizeHtml('<a href="x" onclick="evil()">go</a>')).not.toContain('onclick');
  });
  it('strips iframes', () => {
    expect(sanitizeHtml('<iframe src="x"></iframe>')).toBe('');
  });
});
