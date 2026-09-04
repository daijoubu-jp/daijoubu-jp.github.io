with open('assets/js/theme.js', 'r', encoding='utf-8') as f:
    content = f.read()

patch = """
  setTheme(selectedTheme.id);
  setThemeMode(validMode);

  // Update theme color meta tag for mobile browsers
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.content = validMode === 'dark' ? selectedTheme.swatchDark[1] : selectedTheme.swatchLight[1];
"""

content = content.replace("  setTheme(selectedTheme.id);\n  setThemeMode(validMode);", patch.strip())

with open('assets/js/theme.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("theme.js patched")
