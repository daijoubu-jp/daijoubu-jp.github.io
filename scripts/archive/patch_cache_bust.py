import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <script type="module" src="assets/js/main.js"></script> with a versioned one
import time
ts = int(time.time())
for html_file in ['index.html', 'browse.html', 'kanji.html', 'special-readings.html', 'handwriting-guide.html', 'about.html']:
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    html_content = re.sub(r'src="assets/js/main\.js(\?v=[0-9]+)?"', f'src="assets/js/main.js?v={ts}"', html_content)
    
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

print("Cache busting parameters added to HTML.")
