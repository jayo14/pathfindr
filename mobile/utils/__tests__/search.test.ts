import { searchBuildings, editDistance, BUILDING_ALIASES } from '../search';
import { campusBuildings } from '@/mocks/campus';
import { Building } from '@/types/domain';

// ---------------------------------------------------------------------------
// editDistance unit tests
// ---------------------------------------------------------------------------
describe('editDistance', () => {
  test('identical strings → 0', () => {
    expect(editDistance('library', 'library')).toBe(0);
  });

  test('single substitution', () => {
    expect(editDistance('libary', 'library')).toBeLessThanOrEqual(2);
  });

  test('single deletion', () => {
    expect(editDistance('enginering', 'engineering')).toBeLessThanOrEqual(2);
  });

  test('completely different short words → > 2', () => {
    expect(editDistance('cat', 'dog')).toBeGreaterThan(2);
  });

  test('strings over MAX_ED_LEN cap → Infinity', () => {
    const long = 'a'.repeat(20);
    expect(editDistance(long, 'b')).toBe(Infinity);
  });
});

// ---------------------------------------------------------------------------
// Alias map sanity
// ---------------------------------------------------------------------------
describe('BUILDING_ALIASES', () => {
  test('ict maps to ict-center', () => {
    expect(BUILDING_ALIASES['ict']).toBe('ict-center');
  });

  test('library maps to library-complex', () => {
    expect(BUILDING_ALIASES['library']).toBe('library-complex');
  });

  test('admin maps to admin-tower', () => {
    expect(BUILDING_ALIASES['admin']).toBe('admin-tower');
  });

  test('hub maps to student-hub', () => {
    expect(BUILDING_ALIASES['hub']).toBe('student-hub');
  });
});

// ---------------------------------------------------------------------------
// searchBuildings — acceptance criteria from the spec
// ---------------------------------------------------------------------------
describe('searchBuildings', () => {
  // Convenience: get the first result id
  const firstId = (query: string, category?: any) =>
    searchBuildings(campusBuildings, { query, category })[0]?.id;

  const resultIds = (query: string, category?: any) =>
    searchBuildings(campusBuildings, { query, category }).map((b) => b.id);

  // ── Typo tolerance ──────────────────────────────────────────────────────
  test('"libary" (missing r) surfaces library-complex', () => {
    expect(firstId('libary')).toBe('library-complex');
  });

  test('"enginering" (missing e) surfaces engineering-block', () => {
    expect(firstId('enginering')).toBe('engineering-block');
  });

  test('"administation" (transposition) surfaces admin-tower', () => {
    // Edit distance from "administation" to "administrative" is 2
    expect(resultIds('administation')).toContain('admin-tower');
  });

  // ── Abbreviations / aliases ─────────────────────────────────────────────
  test('"ict" surfaces ict-center at top', () => {
    expect(firstId('ict')).toBe('ict-center');
  });

  test('"lib" surfaces library-complex at top', () => {
    expect(firstId('lib')).toBe('library-complex');
  });

  test('"admin" surfaces admin-tower', () => {
    expect(firstId('admin')).toBe('admin-tower');
  });

  test('"hub" surfaces student-hub', () => {
    expect(firstId('hub')).toBe('student-hub');
  });

  test('"cafeteria" surfaces student-hub', () => {
    expect(firstId('cafeteria')).toBe('student-hub');
  });

  test('"registry" surfaces admin-tower', () => {
    expect(firstId('registry')).toBe('admin-tower');
  });

  // ── Partial / word-start matching ───────────────────────────────────────
  test('"know" (word start in name) surfaces library-complex', () => {
    expect(firstId('know')).toBe('library-complex');
  });

  test('"appli" (word start) surfaces science-labs', () => {
    expect(firstId('appli')).toBe('science-labs');
  });

  test('"student" surfaces student-hub', () => {
    expect(firstId('student')).toBe('student-hub');
  });

  // ── Case insensitivity ──────────────────────────────────────────────────
  test('"ICT" (uppercase) surfaces ict-center', () => {
    expect(firstId('ICT')).toBe('ict-center');
  });

  test('"Library" (title case) surfaces library-complex', () => {
    expect(firstId('Library')).toBe('library-complex');
  });

  // ── Empty query ─────────────────────────────────────────────────────────
  test('empty query returns all buildings', () => {
    const all = searchBuildings(campusBuildings, { query: '' });
    expect(all.length).toBe(campusBuildings.length);
  });

  test('whitespace-only query returns all buildings', () => {
    const all = searchBuildings(campusBuildings, { query: '   ' });
    expect(all.length).toBe(campusBuildings.length);
  });

  // ── Category filter ─────────────────────────────────────────────────────
  test('category "library" filter limits results', () => {
    const results = searchBuildings(campusBuildings, { query: '', category: 'library' });
    expect(results.every((b) => b.category === 'library')).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  test('category filter applied alongside text search', () => {
    // "lab" alias maps to science-labs (category: lab). With category:"facility"
    // it should NOT appear because category is wrong.
    const results = resultIds('lab', 'facility');
    expect(results).not.toContain('science-labs');
  });

  test('matching building excluded when wrong category selected', () => {
    // "ict" is facility — should not appear when category is "library"
    const results = resultIds('ict', 'library');
    expect(results).not.toContain('ict-center');
  });

  // ── No false-positive flood ─────────────────────────────────────────────
  test('query "xyz" returns empty result', () => {
    expect(resultIds('xyz').length).toBe(0);
  });

  test('query "zzz" returns empty result', () => {
    expect(resultIds('zzz').length).toBe(0);
  });

  test('"library" query does not return engineering-block', () => {
    expect(resultIds('library')).not.toContain('engineering-block');
  });

  // ── Results are Building objects (shape check) ──────────────────────────
  test('returned items match Building shape', () => {
    const [b] = searchBuildings(campusBuildings, { query: 'ict' });
    expect(b).toHaveProperty('id');
    expect(b).toHaveProperty('name');
    expect(b).toHaveProperty('category');
    expect(b).toHaveProperty('coordinate');
  });

  // ── Does not mutate input ───────────────────────────────────────────────
  test('does not mutate the input array', () => {
    const input = [...campusBuildings];
    searchBuildings(input, { query: 'lib' });
    expect(input).toEqual(campusBuildings);
  });
});
