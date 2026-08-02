import { CMS_FIELDS, CMS_FIELD_BY_KEY, isKnownCmsKey, toList } from './cms-fields';

describe('cms-fields registry', () => {
  it('every field has a non-empty key, label and default, and a known group', () => {
    const groups = new Set(['homepage', 'pricing', 'settings']);
    for (const f of CMS_FIELDS) {
      expect(f.key).toMatch(/\S/);
      expect(f.label).toMatch(/\S/);
      expect(typeof f.default).toBe('string');
      expect(groups.has(f.group)).toBe(true);
    }
  });

  it('has no duplicate keys, and the lookup map covers every field', () => {
    const keys = CMS_FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(CMS_FIELD_BY_KEY.size).toBe(CMS_FIELDS.length);
  });

  it('isKnownCmsKey accepts registered keys and rejects anything else', () => {
    expect(isKnownCmsKey('homepage.headline')).toBe(true);
    expect(isKnownCmsKey('settings.success_fee_pct')).toBe(true);
    expect(isKnownCmsKey('bogus.key')).toBe(false);
    expect(isKnownCmsKey('')).toBe(false);
    // a would-be prototype-pollution key must not be treated as known
    expect(isKnownCmsKey('__proto__')).toBe(false);
  });
});

describe('toList', () => {
  it('splits on newlines, trims, and drops blank lines', () => {
    expect(toList('a\nb\nc')).toEqual(['a', 'b', 'c']);
    expect(toList('  a  \n\n  b \n')).toEqual(['a', 'b']);
    expect(toList('a\r\nb')).toEqual(['a', 'b']);
    expect(toList('')).toEqual([]);
    expect(toList('   \n  ')).toEqual([]);
  });
});
