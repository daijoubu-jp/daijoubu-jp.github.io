import re

with open('assets/css/components.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the .stroke-order-view and its svg definition
pattern = re.compile(r'\.stroke-order-view \{.*?\n\}\n\n\.stroke-order-view svg \{.*?\n\}', re.DOTALL)

new_css = """.stroke-order-view {
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
}

.stroke-order-view svg,
#stroke-modal-view svg {
  width: 100%;
  height: 100%;
}

.stroke-order-view svg path,
#stroke-modal-view svg path {
  stroke: #000000 !important;
}

.stroke-order-view svg text,
#stroke-modal-view svg text {
  fill: #808080 !important;
}"""

content = pattern.sub(new_css, content)

with open('assets/css/components.css', 'w', encoding='utf-8') as f:
    f.write(content)
print("components.css patched!")
