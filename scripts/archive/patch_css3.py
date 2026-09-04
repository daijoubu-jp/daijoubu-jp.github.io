import re

with open('assets/css/components.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Update .stroke-order-view
old_stroke_view = """.stroke-order-view {
  font-size: 0; /* Bulletproof fix for rogue DOCTYPE text */
  width: 200px;
  height: 200px;
  margin: 0 auto var(--spacing-md);
  border: 1px dashed var(--color-border);
  border-radius: var(--border-radius-sm);
  background: #ffffff !important;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}"""

new_stroke_view = """.stroke-order-view {
  font-size: 0; /* Bulletproof fix for rogue DOCTYPE text */
  width: 200px;
  height: 200px;
  margin: 0 auto var(--spacing-md);
  border: 1px dashed var(--color-border);
  border-radius: var(--border-radius-sm);
  background: #ffffff !important;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.stroke-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-display-jp);
  font-size: 150px;
  color: #f0f0f0;
  z-index: 0;
  line-height: 1;
  pointer-events: none;
  user-select: none;
}

#stroke-modal-view {
  position: relative;
}

#stroke-modal-view .stroke-bg {
  font-size: 300px;
}
"""

content = content.replace(old_stroke_view, new_stroke_view)

# Update the SVG inside to have z-index: 1 so it sits on top of the faint bg
old_svg_rule = """.stroke-order-view svg,
#stroke-modal-view svg {
  width: 100%;
  height: 100%;
}"""

new_svg_rule = """.stroke-order-view svg,
#stroke-modal-view svg {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}"""

content = content.replace(old_svg_rule, new_svg_rule)

with open('assets/css/components.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("components.css updated with stroke-bg.")
