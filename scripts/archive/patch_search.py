import re

with open('assets/js/search.js', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'export async function loadKanjiData\(\) \{.*?\n\}', re.DOTALL)

new_func = """export async function loadKanjiData() {
  if (cachedKanjiData) return cachedKanjiData;

  try {
    // 🚀 Load the optimized, minified bundle (1 HTTP request instead of 12)
    const res = await fetch('./data/kanji.min.json');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    cachedKanjiData = await res.json();
  } catch (err) {
    console.error('Fatal: Failed to load kanji.min.json. Did you forget to run scripts/build-data.py?', err);
    cachedKanjiData = [];
  }

  return cachedKanjiData;
}"""

content = pattern.sub(new_func, content)

with open('assets/js/search.js', 'w', encoding='utf-8') as f:
    f.write(content)
