import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'word_validation_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface CacheEntry {
  isValid: boolean;
  timestamp: number;
}

interface WordCache {
  [word: string]: CacheEntry;
}

async function getCache(): Promise<WordCache> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to load cache:', error);
  }
  return {};
}

async function setCache(cache: WordCache): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to save cache:', error);
  }
}

async function getCachedResult(word: string): Promise<boolean | null> {
  const cache = await getCache();
  const entry = cache[word.toLowerCase()];

  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.isValid;
  }

  return null;
}

async function cacheResult(word: string, isValid: boolean): Promise<void> {
  const cache = await getCache();
  cache[word.toLowerCase()] = {
    isValid,
    timestamp: Date.now(),
  };
  await setCache(cache);
}

export async function validateWordWithDictionary(word: string): Promise<boolean> {
  if (word.length < 2) {
    return false;
  }

  const lowerWord = word.toLowerCase();

  const cached = await getCachedResult(lowerWord);
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
    await cacheResult(lowerWord, isValid);

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
