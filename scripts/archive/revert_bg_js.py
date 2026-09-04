import re

with open('assets/js/kanji-detail.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_load = """    container.innerHTML = `<div class="stroke-bg" lang="ja">${kanji.kanji}</div>` + svgText;"""
new_load = """    container.innerHTML = svgText;"""
content = content.replace(old_load, new_load)

with open('assets/js/kanji-detail.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted background injection in kanji-detail.js")
