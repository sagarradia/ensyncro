import { COLLECTION_SPECS, SPEC_BY_SLUG } from './collection-specs';

describe('collection specs', () => {
  it('maps every spec by slug, with unique slugs and kinds', () => {
    expect(SPEC_BY_SLUG.size).toBe(COLLECTION_SPECS.length);
    const slugs = COLLECTION_SPECS.map((s) => s.slug);
    const kinds = COLLECTION_SPECS.map((s) => s.kind);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it('every spec has at least one field and a required title field', () => {
    for (const spec of COLLECTION_SPECS) {
      expect(spec.fields.length).toBeGreaterThan(0);
      const title = spec.fields.find((f) => f.name === 'title');
      expect(title).toBeDefined();
      expect(title?.required).toBe(true);
    }
  });

  it('marks only the sample-listing and match-preview collections as illustrative', () => {
    const illustrative = COLLECTION_SPECS.filter((s) => s.illustrative).map((s) => s.slug).sort();
    expect(illustrative).toEqual(['match-preview', 'sample-listings']);
  });

  it('flags the real-content collections to hide when empty', () => {
    for (const slug of ['team', 'testimonials', 'blog', 'achievements']) {
      expect(SPEC_BY_SLUG.get(slug)?.hideWhenEmpty).toBe(true);
    }
  });

  it('only allows image uploads on collections that need them', () => {
    expect(SPEC_BY_SLUG.get('team')?.image).toBe(true);
    expect(SPEC_BY_SLUG.get('testimonials')?.image).toBe(true);
    expect(SPEC_BY_SLUG.get('blog')?.image).toBe(true);
    expect(SPEC_BY_SLUG.get('sample-listings')?.image).toBe(false);
    expect(SPEC_BY_SLUG.get('achievements')?.image).toBe(false);
  });
});
