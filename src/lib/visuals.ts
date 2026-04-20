/**
 * Extracts the concept image URL from a word's visuals relation.
 * Works with both the frontend seed shape (conceptImageUrl field)
 * and the API response shape (visuals[] array with kind discriminator).
 */
export function conceptImageUrl(
  word: { conceptImageUrl?: string; visuals?: Array<{ kind: string; url: string }> },
): string | null {
  const fromVisuals = word.visuals?.find((v) => v.kind === "CONCEPT")?.url;
  if (fromVisuals) return fromVisuals;
  if (word.conceptImageUrl) return word.conceptImageUrl;
  return null;
}
