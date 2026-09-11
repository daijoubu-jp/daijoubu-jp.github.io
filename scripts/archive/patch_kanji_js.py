import re

with open('assets/js/kanji-detail.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Slow down the animation
content = content.replace("drawStroke 0.6s ease forwards ${idx * 0.35}s", "drawStroke 1.5s ease forwards ${idx * 0.9}s")

# 2. Fix the "]> " issue by stripping DOCTYPE
old_fetch_logic = """    const svgText = await res.text();

    container.innerHTML = svgText;"""

new_fetch_logic = """    let svgText = await res.text();
    
    // Fix: Remove XML DOCTYPE which causes rogue "]> " to appear in the browser HTML parser
    const svgStart = svgText.indexOf('<svg');
    if (svgStart !== -1) {
      svgText = svgText.substring(svgStart);
    }

    container.innerHTML = svgText;"""
content = content.replace(old_fetch_logic, new_fetch_logic)

# 3. Add logic for the Enlarge button and Modal
init_logic_pattern = re.compile(r"(  const replayBtn = document\.getElementById\('replay-stroke-btn'\);\s+if \(replayBtn\) \{\s+replayBtn\.addEventListener\('click', \(\) => \{\s+replayStrokeOrder\(\);\s+\}\);\s+\})", re.DOTALL)

new_init_logic = """\\1

  // Enlarge Button Logic
  const enlargeBtn = document.getElementById('enlarge-stroke-btn');
  const modal = document.getElementById('stroke-modal');
  const modalView = document.getElementById('stroke-modal-view');
  const closeModalBtn = document.getElementById('close-stroke-modal');
  const modalReplayBtn = document.getElementById('modal-replay-btn');

  if (enlargeBtn && modal && modalView) {
    enlargeBtn.addEventListener('click', () => {
      const mainContainer = document.getElementById('stroke-order-view');
      modalView.innerHTML = mainContainer.innerHTML;
      
      modal.style.display = 'flex';
      // tiny delay for CSS transition
      setTimeout(() => modal.style.opacity = '1', 10);
      
      // Animate the modal paths
      if (typeof animateSvgPaths === 'function') {
        animateSvgPaths(modalView);
      }
    });

    closeModalBtn.addEventListener('click', () => {
      modal.style.opacity = '0';
      setTimeout(() => modal.style.display = 'none', 300);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.style.display = 'none', 300);
      }
    });

    modalReplayBtn.addEventListener('click', () => {
      if (typeof animateSvgPaths === 'function') {
        animateSvgPaths(modalView);
      }
    });
  }"""

content = init_logic_pattern.sub(new_init_logic, content)

with open('assets/js/kanji-detail.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("kanji-detail.js patched!")
