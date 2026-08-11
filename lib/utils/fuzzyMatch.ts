/**
 * Levenshtein-Distanz Berechnungs-Utility für fuzzy Matching
 * von Kundennummern und Artikelnummern.
 */

export function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // replacement
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

export interface NearestMatchResult<T> {
  match: T | null
  confidence: number // 0.0 to 1.0
  distance: number
  isExact: boolean
  warningMessage?: string
}

export function findNearestMatch<T>(
  input: string,
  candidates: T[],
  keyExtractor: (candidate: T) => string,
  maxDistanceThreshold: number = 3
): NearestMatchResult<T> {
  const cleanInput = input.trim().toLowerCase()
  if (!cleanInput) {
    return { match: null, confidence: 0, distance: 999, isExact: false, warningMessage: 'Keine Zahl erkannt' }
  }

  let bestCandidate: T | null = null
  let minDistance = 999
  let isExact = false

  for (const candidate of candidates) {
    const key = keyExtractor(candidate).trim().toLowerCase()
    if (!key) continue

    if (key === cleanInput) {
      return { match: candidate, confidence: 1.0, distance: 0, isExact: true }
    }

    const dist = getLevenshteinDistance(cleanInput, key)
    if (dist < minDistance) {
      minDistance = dist
      bestCandidate = candidate
    }
  }

  if (bestCandidate && minDistance <= maxDistanceThreshold) {
    const keyLength = keyExtractor(bestCandidate).length
    const confidence = Math.max(0.4, 1.0 - minDistance / Math.max(keyLength, 1))
    return {
      match: bestCandidate,
      confidence,
      distance: minDistance,
      isExact: false,
      warningMessage: `Gelesener Wert '${input}' ➔ Nächste Übereinstimmung: '${keyExtractor(bestCandidate)}'`,
    }
  }

  return {
    match: null,
    confidence: 0,
    distance: minDistance,
    isExact: false,
    warningMessage: `Die Zahl '${input}' konnte keiner registrierten Nummer zugeordnet werden.`,
  }
}
