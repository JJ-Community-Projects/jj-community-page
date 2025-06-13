


/**
 * Finds the length of the longest common substring between two strings using dynamic programming.
 * Time complexity: O(m*n) where m and n are the lengths of the strings.
 * Space complexity: O(m*n) for the DP table.
 */
function longestCommonSubstring(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  let maxLength = 0;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        maxLength = Math.max(maxLength, dp[i][j]);
      }
    }
  }
  return maxLength;
}

export function similarity<T>(searchTerm: string, objs:T[], getKey: (obj: T) => string): {data: T, score: number}[] {
  if (!searchTerm || !objs.length) {
    return [];
  }

  const normalizedSearchTerm = searchTerm.toLowerCase();

  // Calculate similarity scores for each object
  const results = objs.map(obj => {
    const key = getKey(obj).toLowerCase();
    let score = 0;

    // Exact match gets highest score
    if (key === normalizedSearchTerm) {
      score = 1;
    }
    // If key contains the search term, score based on position and relative length
    else if (key.includes(normalizedSearchTerm)) {
      // Position factor: earlier matches get higher scores
      const positionFactor = 1 - (key.indexOf(normalizedSearchTerm) / key.length);
      // Length factor: longer matches relative to key length get higher scores
      const lengthFactor = normalizedSearchTerm.length / key.length;
      score = 0.8 * positionFactor + 0.2 * lengthFactor;
    }
    // If search term contains the key, partial score
    else if (normalizedSearchTerm.includes(key)) {
      score = 0.7 * (key.length / normalizedSearchTerm.length);
    }
    // Check for partial matches (common substrings)
    else {
      // Find longest common substring using dynamic programming
      const longestMatch = longestCommonSubstring(key, normalizedSearchTerm);

      if (longestMatch > 0) {
        // Score based on the length of the longest common substring
        score = 0.5 * (longestMatch / Math.max(key.length, normalizedSearchTerm.length));
      }
    }

    return { data: obj, score };
  });

  // Sort by score in descending order
  return results
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
}
