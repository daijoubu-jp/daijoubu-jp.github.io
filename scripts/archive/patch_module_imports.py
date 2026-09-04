import re
import time

ts = int(time.time())

with open('assets/js/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'from \'./kanji-detail\.js(\?v=[0-9]+)?\'', f'from \'./kanji-detail.js?v={ts}\'', content)
content = re.sub(r'from \'./search\.js(\?v=[0-9]+)?\'', f'from \'./search.js?v={ts}\'', content)
content = re.sub(r'from \'./storage\.js(\?v=[0-9]+)?\'', f'from \'./storage.js?v={ts}\'', content)
content = re.sub(r'from \'./browse\.js(\?v=[0-9]+)?\'', f'from \'./browse.js?v={ts}\'', content)
content = re.sub(r'from \'./theme\.js(\?v=[0-9]+)?\'', f'from \'./theme.js?v={ts}\'', content)

with open('assets/js/main.js', 'w', encoding='utf-8') as f:
    f.write(content)

# We should do the same in browse.js and search.js and kanji-detail.js
files = ['assets/js/search.js', 'assets/js/kanji-detail.js', 'assets/js/browse.js', 'assets/js/theme.js', 'assets/js/storage.js']
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        file_content = f.read()
    
    file_content = re.sub(r'from \'./([a-z-]+)\.js(\?v=[0-9]+)?\'', rf"from './\1.js?v={ts}'", file_content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(file_content)

print("Module imports cache-busted.")
