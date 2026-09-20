/**
 * Levenshtein distance between two strings (case-insensitive).
 */
function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  const dp: number[][] = Array.from({ length: la + 1 }, (_, i) =>
    Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[la][lb];
}

/**
 * Score a product against a query.  Lower = better match.
 * Returns Infinity when there's no reasonable match.
 */
export function fuzzyScore(query: string, name: string, brand: string): number {
  const q = query.toLowerCase().trim();
  const n = name.toLowerCase();
  const b = brand.toLowerCase();
  const full = `${b} ${n}`;

  // Exact substring → best score
  if (full.includes(q) || n.includes(q) || b.includes(q)) return 0;

  // Word-level matching: compare each query word to each target word
  const qWords = q.split(/\s+/);
  const tWords = full.split(/\s+/);

  let totalScore = 0;
  for (const qw of qWords) {
    let bestWord = Infinity;
    for (const tw of tWords) {
      // Substring within word
      if (tw.includes(qw) || qw.includes(tw)) {
        bestWord = Math.min(bestWord, 0.5);
        continue;
      }
      const dist = levenshtein(qw, tw);
      const maxLen = Math.max(qw.length, tw.length);
      const similarity = 1 - dist / maxLen;
      if (similarity >= 0.4) {
        bestWord = Math.min(bestWord, dist);
      }
    }
    if (bestWord === Infinity) return Infinity;
    totalScore += bestWord;
  }

  return totalScore;
}

export interface ScoredItem<T> {
  item: T;
  score: number;
}

export function fuzzySearch<T>(
  items: T[],
  query: string,
  getName: (item: T) => string,
  getBrand: (item: T) => string
): ScoredItem<T>[] {
  if (!query.trim()) return items.map((item) => ({ item, score: 0 }));

  return items
    .map((item) => ({
      item,
      score: fuzzyScore(query, getName(item), getBrand(item)),
    }))
    .filter((s) => s.score !== Infinity)
    .sort((a, b) => a.score - b.score);
}
