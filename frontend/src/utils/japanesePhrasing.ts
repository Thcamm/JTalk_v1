/**
 * Japanese Phrasing & Bunsetsu (文節) Pause Optimizer for AI Speech Synthesis
 *
 * Japanese natural speech relies heavily on pitch accent (高低アクセント) and
 * bunsetsu boundary pauses after particles (助詞) and conjunctive forms (接続助詞).
 * This utility inserts natural phonetic phrasing markers to prevent robotic run-on speech.
 */

export interface PhrasingOptions {
  pauseAfterParticles?: boolean;
  normalizeNumbers?: boolean;
  slowRateForLearners?: number; // 0.85 - 0.95
}

/**
 * Common Japanese particle and conjunction patterns that mark natural bunsetsu pauses:
 * は, が, を, に, で, と, も, へ, から, まで, より,
 * ですが, ますが, ので, のに, けれども, けど, たら, なら, とき
 */
const BUNSETSU_PATTERNS = [
  // Multi-character conjunctions (higher priority)
  { regex: /(ですから|ですが|ますので|ますから|ましたら|ですので|なので|けれど|けど|ながら|として)/g, replace: "$1、" },
  // Conditional & connective forms
  { regex: /(たら|なら|ば|とき|前に|後で|ために)/g, replace: "$1、" },
  // Common grammatical particles followed by kanji or longer phrases
  { regex: /([ぁ-んァ-ヶ一-龥])(は|が|を|に|で|へ|から|まで)(?=[一-龥ァ-ヴA-Za-z])/g, replace: "$1$2、" },
];

/**
 * Optimize Japanese text with natural pauses (bunsetsu phrasing)
 */
export function formatJapaneseForSpeech(
  text: string,
  options: PhrasingOptions = {}
): string {
  if (!text) return "";

  let processed = text.trim();

  // 1. Remove duplicate existing punctuation
  processed = processed.replace(/([、。，．！？!?])+/g, "$1");

  // 2. Insert natural bunsetsu pauses if enabled (default true)
  if (options.pauseAfterParticles !== false) {
    for (const pattern of BUNSETSU_PATTERNS) {
      processed = processed.replace(pattern.regex, pattern.replace);
    }
    // Clean up any double commas introduced
    processed = processed.replace(/、、+/g, "、").replace(/、。/g, "。");
  }

  return processed;
}

/**
 * Split Japanese text into rhythmic breath segments for stepped audio playback
 */
export function splitIntoBunsetsuPhrases(text: string): string[] {
  if (!text) return [];

  const formatted = formatJapaneseForSpeech(text);
  return formatted
    .split(/([、。！？!?]+)/)
    .reduce<string[]>((acc, part, index, arr) => {
      if (index % 2 === 0 && part.trim()) {
        const punctuation = arr[index + 1] || "";
        acc.push((part + punctuation).trim());
      }
      return acc;
    }, [])
    .filter((phrase) => phrase.length > 0);
}

export default formatJapaneseForSpeech;
