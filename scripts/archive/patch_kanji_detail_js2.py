import re

with open('assets/js/kanji-detail.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update loadStrokeOrder to inject faint Kanji background
old_load = """    container.innerHTML = svgText;
    animateSvgPaths(container);"""

new_load = """    container.innerHTML = `<div class="stroke-bg" lang="ja">${kanji.kanji}</div>` + svgText;
    animateSvgPaths(container);"""
content = content.replace(old_load, new_load)

# 2. Update animateSvgPaths to read from inputs
old_animate = """function animateSvgPaths(container) {
  if (!container) return;
  const paths = container.querySelectorAll('path');
  if (!paths || paths.length === 0) return;

  paths.forEach((path) => {
    const length = path.getTotalLength ? path.getTotalLength() : 100;
    path.style.animation = 'none';
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
  });

  // Force reflow to restart CSS animations cleanly
  void container.offsetWidth;

  paths.forEach((path, idx) => {
    const length = path.getTotalLength ? path.getTotalLength() : 100;
    path.style.animation = `drawStroke 1.5s ease forwards ${idx * 0.9}s`;
  });
}"""

new_animate = """function animateSvgPaths(container) {
  if (!container) return;
  const paths = container.querySelectorAll('path');
  if (!paths || paths.length === 0) return;
  
  // Read dynamic speed and pause from UI
  const speedInput = document.getElementById('stroke-speed-input');
  const pauseInput = document.getElementById('stroke-pause-input');
  const duration = speedInput ? parseFloat(speedInput.value) : 1.25;
  const pause = pauseInput ? parseFloat(pauseInput.value) : 0.75;

  paths.forEach((path) => {
    const length = path.getTotalLength ? path.getTotalLength() : 100;
    path.style.animation = 'none';
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
  });

  // Force reflow to restart CSS animations cleanly
  void container.offsetWidth;

  paths.forEach((path, idx) => {
    const length = path.getTotalLength ? path.getTotalLength() : 100;
    path.style.animation = `drawStroke ${duration}s ease forwards ${idx * pause}s`;
  });
}"""
content = content.replace(old_animate, new_animate)

# 3. Add Event Listeners for the new Inputs inside initKanjiDetail()
# The start of initKanjiDetail:
# export async function initKanjiDetail() {
# Let's insert the event bindings inside the replayBtn check block, which already exists.

target = """    modalReplayBtn.addEventListener('click', () => {
      if (typeof animateSvgPaths === 'function') {
        animateSvgPaths(modalView);
      }
    });
  }"""

new_target = """    modalReplayBtn.addEventListener('click', () => {
      if (typeof animateSvgPaths === 'function') {
        animateSvgPaths(modalView);
      }
    });
  }

  // Stroke Settings Logic
  const speedInput = document.getElementById('stroke-speed-input');
  const pauseInput = document.getElementById('stroke-pause-input');
  const speedVal = document.getElementById('stroke-speed-val');
  const pauseVal = document.getElementById('stroke-pause-val');

  if (speedInput && speedVal) {
    speedInput.addEventListener('input', (e) => {
      speedVal.textContent = parseFloat(e.target.value).toFixed(2) + 's';
    });
    speedInput.addEventListener('change', () => {
      replayStrokeOrder();
      // If modal is open, also replay it
      const modal = document.getElementById('stroke-modal');
      const modalView = document.getElementById('stroke-modal-view');
      if (modal && modal.style.display === 'flex') animateSvgPaths(modalView);
    });
  }

  if (pauseInput && pauseVal) {
    pauseInput.addEventListener('input', (e) => {
      pauseVal.textContent = parseFloat(e.target.value).toFixed(2) + 's';
    });
    pauseInput.addEventListener('change', () => {
      replayStrokeOrder();
      const modal = document.getElementById('stroke-modal');
      const modalView = document.getElementById('stroke-modal-view');
      if (modal && modal.style.display === 'flex') animateSvgPaths(modalView);
    });
  }"""
content = content.replace(target, new_target)


with open('assets/js/kanji-detail.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("kanji-detail.js updated with speed logic and faint Kanji background.")
