import re

with open('kanji.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_actions = """              <!-- Stroke Order Replay Button -->
              <button type="button" class="action-btn" id="replay-stroke-btn" title="เล่นลำดับขีดซ้ำ" style="width: 100%; margin-top: 8px; justify-content: center; background: var(--color-surface-2); border-color: var(--color-accent); color: var(--color-accent); font-weight: 600;">
                <span>🔄</span> เล่นลำดับขีดซ้ำ (Replay)
              </button>

              <button type="button" class="action-btn" id="enlarge-stroke-btn" title="ขยายดูลำดับขีด" style="width: 100%; margin-top: 8px; justify-content: center; background: var(--color-surface); border-color: var(--color-border); color: var(--color-text); font-weight: 600;">
                <span>🔍</span> ขยายลำดับขีด (Enlarge)
              </button>

              <!-- Action Buttons -->
              <div class="detail-card-actions">
                <button type="button" class="action-btn" id="favorite-btn">
                  <span>☆</span> เพิ่มในรายการโปรด
                </button>
                <button type="button" class="action-btn" id="share-btn">
                  <span>🔗</span> แชร์
                </button>
              </div>"""

new_actions = """              <!-- Action Buttons Grid -->
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px; width: 100%;">
                <div style="display: flex; gap: 8px; width: 100%;">
                  <button type="button" class="action-btn" id="replay-stroke-btn" title="เล่นลำดับขีดซ้ำ" style="flex: 1; justify-content: center; background: var(--color-surface-2); border-color: var(--color-accent); color: var(--color-accent); font-weight: 600;">
                    <span>🔄</span> เล่นซ้ำ
                  </button>
                  <button type="button" class="action-btn" id="enlarge-stroke-btn" title="ขยายดูลำดับขีด" style="flex: 1; justify-content: center; font-weight: 600;">
                    <span>🔍</span> ขยาย
                  </button>
                </div>
                
                <div style="display: flex; gap: 8px; width: 100%;">
                  <button type="button" class="action-btn" id="favorite-btn" style="flex: 1; justify-content: center;">
                    <span>☆</span> รายการโปรด
                  </button>
                  <button type="button" class="action-btn" id="share-btn" style="flex: 1; justify-content: center;">
                    <span>🔗</span> แชร์
                  </button>
                </div>
              </div>"""

content = content.replace(old_actions, new_actions)

with open('kanji.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("kanji.html layout patched!")
