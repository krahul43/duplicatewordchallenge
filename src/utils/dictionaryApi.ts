const CACHE_KEY = 'word_validation_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface CacheEntry {
  isValid: boolean;
  timestamp: number;
}

interface WordCache {
  [word: string]: CacheEntry;
}

function getCache(): WordCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to load cache:', error);
  }
  return {};
}

function setCache(cache: WordCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to save cache:', error);
  }
}

function getCachedResult(word: string): boolean | null {
  const cache = getCache();
  const entry = cache[word.toLowerCase()];

  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.isValid;
  }

  return null;
}

function cacheResult(word: string, isValid: boolean): void {
  const cache = getCache();
  cache[word.toLowerCase()] = {
    isValid,
    timestamp: Date.now(),
  };
  setCache(cache);
}

export async function validateWordWithDictionary(word: string): Promise<boolean> {
  if (word.length < 2) {
    return false;
  }

  const lowerWord = word.toLowerCase();

  const cached = getCachedResult(lowerWord);
  if (cached !== null) {
    return cached;
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${lowerWord}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const isValid = response.ok;
    cacheResult(lowerWord, isValid);

    return isValid;
  } catch (error) {
    console.error('Dictionary API error:', error);
    return word.length >= 2 && /^[A-Za-z]+$/.test(word);
  }
}

export async function validateMultipleWords(words: string[]): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  await Promise.all(
    words.map(async (word) => {
      results[word] = await validateWordWithDictionary(word);
    })
  );

  return results;
}
