import { describe, it, expect } from 'vitest';
import { getDirectusImageUrl } from '../../packages/utils/src/image';

const CMS_URL = 'https://cms.example.com';

describe('getDirectusImageUrl', () => {
  it('generates correct Directus image URL with defaults', () => {
    const url = getDirectusImageUrl(CMS_URL, 'abc-123');
    expect(url).toContain('abc-123');
    expect(url).toMatch(/\/assets\/abc-123/);
    expect(url).toContain('format=webp');
    expect(url).toContain('quality=80');
  });

  it('generates correct URL with all options', () => {
    const url = getDirectusImageUrl(CMS_URL, 'abc-123', {
      width: 800,
      height: 600,
      quality: 80,
      format: 'webp',
      fit: 'cover',
    });
    expect(url).toContain('width=800');
    expect(url).toContain('height=600');
    expect(url).toContain('quality=80');
    expect(url).toContain('format=webp');
    expect(url).toContain('fit=cover');
  });

  it('handles missing options gracefully', () => {
    const url = getDirectusImageUrl(CMS_URL, 'abc-123', {});
    expect(url).toContain('abc-123');
    expect(url).not.toContain('undefined');
  });
});
