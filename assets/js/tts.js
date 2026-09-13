/**
 * tts.js
 * Shared Japanese text-to-speech helper (Web Speech API) used by the kanji
 * detail page and the prefecture pages.
 */

/**
 * Checks whether the Web Speech API is available in the current environment.
 * @returns {boolean}
 */
export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Speaks Japanese text via the Web Speech API with a ja-JP voice when one
 * exists. Handles Safari's paused-engine quirk (resume before cancel),
 * strips furigana/HTML tags and interpuncts from the spoken text when
 * stripRuby is set, and toggles a `.playing` state class on the trigger
 * button until speech ends or errors.
 * @param {string} rawText Text to speak; may contain HTML when stripRuby is true.
 * @param {HTMLElement|null} [btn] Optional trigger button to mark with .playing.
 * @param {{ stripRuby?: boolean, onUnsupported?: (btn: HTMLElement|null) => void }} [options]
 *   stripRuby strips <rt> furigana and other HTML tags before speaking;
 *   onUnsupported is invoked instead of any built-in handling when the
 *   Web Speech API is unavailable.
 * @returns {boolean} true when a speak was started, false when speech is
 *   unsupported or the cleaned text is empty.
 */
export function speakJapanese(rawText, btn = null, options = {}) {
  if (!isSpeechSupported()) {
    if (options.onUnsupported) options.onUnsupported(btn);
    return false;
  }
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
  window.speechSynthesis.cancel();
  let cleanText = String(rawText || '');
  if (options.stripRuby) {
    cleanText = cleanText.replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '');
  }
  cleanText = cleanText.replace(/[.・]/g, '').trim();
  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.88;

  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const jaVoice = voices.find((v) => v.lang === 'ja-JP' || v.lang === 'ja_JP' || (v.lang && v.lang.startsWith('ja')));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }
  }

  if (btn) {
    btn.classList.add('playing');
    utterance.onend = () => btn.classList.remove('playing');
    utterance.onerror = () => btn.classList.remove('playing');
  }

  window.speechSynthesis.speak(utterance);
  return true;
}