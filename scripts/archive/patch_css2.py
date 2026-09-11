import re

with open('assets/css/components.css', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('.stroke-order-view {\n  width: 200px;', '.stroke-order-view {\n  font-size: 0; /* Bulletproof fix for rogue DOCTYPE text */\n  width: 200px;')
content = content.replace('#stroke-modal-view {\n', '#stroke-modal-view {\n  font-size: 0;\n')

with open('assets/css/components.css', 'w', encoding='utf-8') as f:
    f.write(content)
print("CSS patched with font-size: 0.")
