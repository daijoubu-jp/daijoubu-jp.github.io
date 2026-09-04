import re

with open('assets/js/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import if not present
if 'loadKanjiData' not in content:
    content = content.replace("import { getTheme", "import { loadKanjiData, searchKanji } from './search.js';\nimport { getTheme")

# Prefetch in initHomePage
pattern = re.compile(r'(async function initHomePage\(\) \{\s+const searchInput = document\.getElementById\(\'hero-search-input\'\);\s+const dropdown = document\.getElementById\(\'hero-autocomplete\'\);\s+const clearBtn = document\.getElementById\(\'search-clear-btn\'\);\s+const searchForm = document\.getElementById\(\'hero-search-form\'\);)', re.DOTALL)

new_logic = r"""\1

  // Prefetch the kanji database asynchronously so search is instantaneous
  loadKanjiData().catch(e => console.warn('Prefetch failed:', e));"""

content = pattern.sub(new_logic, content)

with open('assets/js/main.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("main.js patched with prefetch!")
