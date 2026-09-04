import re
import glob
import time

ts = int(time.time())
html_files = glob.glob('*.html')

for html_file in html_files:
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    html_content = re.sub(r'src="assets/js/main\.js(\?v=[0-9]+)?"', f'src="assets/js/main.js?v={ts}"', html_content)
    
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

print("Cache busting parameters added to all HTML.")
