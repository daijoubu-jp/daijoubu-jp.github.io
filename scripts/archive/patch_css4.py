import re

with open('assets/css/components.css', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('  font-size: 300px;', '  font-size: min(300px, 52vw);')

with open('assets/css/components.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS updated for responsive modal faint background.")
