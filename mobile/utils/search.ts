/**
 * utils/search.ts — fuzzy, alias-aware building search
 *
 * Matching pipeline (best → worst priority):
 *   1. Alias / nickname exact match  (e.g. "ict"  → ICT Innovation Centre)
 *   2. Code prefix match             (e.g. "lib"  → LIB)
 *   3. Name word starts-with         (e.g. "engi" → Engineering Block)
 *   4. Substring across all fields   (name, code, category, tags, departments)
 *   5. Edit-distance ≤ 2 on any word in the name (single-word typos)
 *
 * Category filtering is applied after text matching and is exact.
 * An empty query returns all buildings (respecting category filter only).
 *
 * The alias list is kept in sync with backend/api/views.py BUILDING_KEYWORDS
 * so the AI chat and the in-app search always agree on nicknames.
 */

import { Building, BuildingCategory } from '@/types/domain';

// ---------------------------------------------------------------------------
// Alias / nickname map
// Keys are lowercased query terms; values are building IDs (from Building.id).
// Mirrors the BUILDING_KEYWORDS dict in backend/api/views.py.
// ---------------------------------------------------------------------------
export const BUILDING_ALIASES: Record<string, string> = {
  // ICT centre
  ict: 'ict-center',
  'ict centre': 'ict-center',
  'ict center': 'ict-center',
  'innovation centre': 'ict-center',
  'tech hub': 'ict-center',
  // Engineering
  engineering: 'engineering-block',
  eng: 'engineering-block',
  'engineering block': 'engineering-block',
  mech: 'engineering-block',
  mechanical: 'engineering-block',
  electrical: 'engineering-block',
  // Library
  library: 'library-complex',
  lib: 'library-complex',
  'knowledge resource': 'library-complex',
  // Admin
  admin: 'admin-tower',
  adm: 'admin-tower',
  registry: 'admin-tower',
  bursary: 'admin-tower',
  'admin tower': 'admin-tower',
  // Science labs
  lab: 'science-labs',
  labs: 'science-labs',
  'science lab': 'science-labs',
  'science labs': 'science-labs',
  // Student hub
  hub: 'student-hub',
  cafeteria: 'student-hub',
  'student hub': 'student-hub',
  cafe: 'student-hub',
};

// ---------------------------------------------------------------------------
// Edit distance (Wagner-Fischer)
// Only runs on strings ≤ MAX_ED_LEN chars to stay cheap on device.
// ---------------------------------------------------------------------------
const MAX_ED_LEN = 14;

export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length > MAX_ED_LEN || b.length > MAX_ED_LEN) return Infinity;
  const m = a.length;
  const n = b.length;
  // Single allocation: reuse two rows
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  const curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev] = [[...curr]]; // swap rows
  }
  return prev[n];
}

// ---------------------------------------------------------------------------
// Score a single building against a normalised query.
// Higher score = better match. Returns 0 if no match at all.
// ---------------------------------------------------------------------------
const SCORE_ALIAS      = 100;
const SCORE_CODE       = 80;
const SCORE_NAME_START = 60;
const SCORE_SUBSTRING  = 40;
const SCORE_FUZZY      = 20;

function scoreBuilding(building: Building, query: string): number {
  if (!query) return 1; // empty query → everything matches at equal rank

  const q = query.toLowerCase().trim();
  const id = building.id.toLowerCase();
  const name = building.name.toLowerCase();
  const code = building.code.toLowerCase();
  const category = building.category.toLowerCase();

  // 1. Alias hit — check multi-word aliases first (longest first to prefer
  //    more specific matches), then single-word
  if (BUILDING_ALIASES[q] === id) return SCORE_ALIAS;

  // 2. Code prefix (e.g. "lib" matches "LIB")
  if (code.startsWith(q) || q.startsWith(code)) return SCORE_CODE;

  // 3. Any word in the name starts with the query
  const nameWords = name.split(/\s+/);
  if (nameWords.some((w) => w.startsWith(q))) return SCORE_NAME_START;

  // 4. Substring across searchable fields
  const haystack = [
    name,
    code,
    category,
    building.id,
    ...building.tags.map((t) => t.toLowerCase()),
    ...building.departments.map((d) => d.toLowerCase()),
    ...building.facilities.map((f) => f.toLowerCase()),
  ].join(' ');
  if (haystack.includes(q)) return SCORE_SUBSTRING;

  // 5. Fuzzy: edit-distance ≤ 2 on any individual word of the name
  //    Split query into words too — match single-word typos
  const queryWords = q.split(/\s+/);
  for (const qWord of queryWords) {
    if (qWord.length < 3) continue; // too short to fuzzy-match reliably
    for (const nWord of nameWords) {
      if (editDistance(qWord, nWord) <= 2) return SCORE_FUZZY;
    }
  }

  return 0; // no match
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Options accepted by searchBuildings. */
export interface SearchOptions {
  query: string;
  category?: BuildingCategory | 'all';
}

/**
 * Filter and rank a list of buildings against a text query and optional
 * category filter. Returns a new array — does not mutate the input.
 */
export function searchBuildings(
  buildings: Building[],
  { query, category = 'all' }: SearchOptions,
): Building[] {
  const normalised = query.trim().toLowerCase();

  const results: Array<{ building: Building; score: number }> = [];

  for (const building of buildings) {
    // Category gate (fast, checked first)
    if (category !== 'all' && building.category !== category) continue;

    const score = scoreBuilding(building, normalised);
    if (score > 0) {
      results.push({ building, score });
    }
  }

  // Sort descending by score; preserve original order for ties
  results.sort((a, b) => b.score - a.score);

  return results.map((r) => r.building);
}
