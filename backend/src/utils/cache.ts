import NodeCache from "node-cache";

// stdTTL=300 (5 min default), checkperiod=60 (cleanup every minute).
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const WORD_COUNT_KEY = "word:count";
const WORD_COUNT_TTL = 3600; // 1 hour
const WORD_TTL = 600; // 10 min

export function getWordCount<T>(): T | undefined {
  return cache.get<T>(WORD_COUNT_KEY);
}
export function setWordCount<T>(val: T): void {
  cache.set(WORD_COUNT_KEY, val, WORD_COUNT_TTL);
}

export function getWord<T>(id: string): T | undefined {
  return cache.get<T>(`word:${id}`);
}
export function setWord<T>(id: string, val: T): void {
  cache.set(`word:${id}`, val, WORD_TTL);
}

export function invalidateWordCounts(): void {
  cache.del(WORD_COUNT_KEY);
}
export function invalidateWord(id: string): void {
  cache.del(`word:${id}`);
}
export function invalidateAll(): void {
  cache.flushAll();
}
