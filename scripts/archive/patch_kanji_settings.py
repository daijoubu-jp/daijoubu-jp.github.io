import re

with open('kanji.html', 'r', encoding='utf-8') as f:
    content = f.read()

settings_html = """              <!-- Stroke Settings -->
              <div class="stroke-settings" style="margin-top: 12px; width: 100%; background: var(--color-surface); padding: 12px; border: 1px solid var(--color-border); border-radius: var(--border-radius-sm); font-size: var(--font-size-xs);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <label for="stroke-speed-input" style="color: var(--color-text-muted); font-weight: 600;">เวลาลากเส้น (Speed): <span id="stroke-speed-val">1.25s</span></label>
                  <input type="range" id="stroke-speed-input" min="0.1" max="3.0" step="0.05" value="1.25" style="width: 80px; accent-color: var(--color-accent);">
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <label for="stroke-pause-input" style="color: var(--color-text-muted); font-weight: 600;">หน่วงเวลา (Pause): <span id="stroke-pause-val">0.75s</span></label>
                  <input type="range" id="stroke-pause-input" min="0.1" max="3.0" step="0.05" value="0.75" style="width: 80px; accent-color: var(--color-accent);">
                </div>
              </div>"""

# Find the end of the action buttons grid and insert the settings
# The grid ends with:
#                 </div>
#               </div>
# Wait, I'll just use a precise replace.

target = """                <div style="display: flex; gap: 8px; width: 100%;">
                  <button type="button" class="action-btn" id="favorite-btn" style="flex: 1; justify-content: center;">
                    <span>☆</span> รายการโปรด
                  </button>
                  <button type="button" class="action-btn" id="share-btn" style="flex: 1; justify-content: center;">
                    <span>🔗</span> แชร์
                  </button>
                </div>
              </div>"""

content = content.replace(target, target + "\n\n" + settings_html)

with open('kanji.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Settings HTML injected.")
