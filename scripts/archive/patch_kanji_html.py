import re

with open('kanji.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the Enlarge button right under Replay button
replay_btn_str = """<button type="button" class="action-btn" id="replay-stroke-btn" title="เล่นลำดับขีดซ้ำ" style="width: 100%; margin-top: 8px; justify-content: center; background: var(--color-surface-2); border-color: var(--color-accent); color: var(--color-accent); font-weight: 600;">
                <span>🔄</span> เล่นลำดับขีดซ้ำ (Replay)
              </button>"""

enlarge_btn_str = """<button type="button" class="action-btn" id="enlarge-stroke-btn" title="ขยายดูลำดับขีด" style="width: 100%; margin-top: 8px; justify-content: center; background: var(--color-surface); border-color: var(--color-border); color: var(--color-text); font-weight: 600;">
                <span>🔍</span> ขยายลำดับขีด (Enlarge)
              </button>"""

content = content.replace(replay_btn_str, replay_btn_str + "\n\n              " + enlarge_btn_str)

# Add Modal HTML at the end of the body
modal_html = """
  <!-- Stroke Order Modal -->
  <div id="stroke-modal" class="modal-backdrop" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease;">
    <div class="modal-content" style="background: white; border-radius: var(--border-radius-lg); padding: var(--spacing-lg); max-width: 90vw; max-height: 90vh; position: relative; box-shadow: var(--shadow-lg); text-align: center;">
      <button id="close-stroke-modal" type="button" style="position: absolute; top: 12px; right: 12px; background: #f1f1f1; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-weight: bold; color: #333;">✕</button>
      <div id="stroke-modal-view" style="width: 70vw; height: 70vw; max-width: 400px; max-height: 400px; margin: 0 auto;"></div>
      <button type="button" class="action-btn" id="modal-replay-btn" style="margin-top: 16px; justify-content: center; background: #f1f1f1; border-color: #ddd; color: #333; font-weight: 600; width: 100%;">
        <span>🔄</span> เล่นลำดับขีดซ้ำ
      </button>
    </div>
  </div>
"""

content = content.replace("  <!-- Site Footer -->", modal_html + "\n  <!-- Site Footer -->")

with open('kanji.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("kanji.html patched!")
