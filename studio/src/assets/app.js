/**
 * Daijoubu JP Content Studio Frontend
 * Connects to the Rust Studio HTTP API to browse, filter, validate, preview,
 * and save all 6 Markdown content categories.
 */

const KANGXI_RADICALS = [
  '1 (一)','2 (丨)','3 (丶)','4 (丿)','5 (乙)','6 (亅)','7 (二)','8 (亠)','9 (人)','10 (儿)',
  '11 (入)','12 (八)','13 (冂)','14 (冖)','15 (冫)','16 (几)','17 (凵)','18 (刀)','19 (力)','20 (勹)',
  '21 (匕)','22 (匚)','23 (匸)','24 (十)','25 (卜)','26 (卩)','27 (厂)','28 (厶)','29 (又)','30 (口)',
  '31 (囗)','32 (土)','33 (士)','34 (夂)','35 (夊)','36 (夕)','37 (大)','38 (女)','39 (子)','40 (宀)',
  '41 (寸)','42 (小)','43 (尢)','44 (尸)','45 (屮)','46 (山)','47 (巛)','48 (工)','49 (己)','50 (巾)',
  '51 (干)','52 (幺)','53 (广)','54 (廴)','55 (廾)','56 (弋)','57 (弓)','58 (彐)','59 (彡)','60 (彳)',
  '61 (心)','62 (戈)','63 (戸)','64 (手)','65 (支)','66 (攴)','67 (文)','68 (斗)','69 (斤)','70 (方)',
  '71 (无)','72 (日)','73 (曰)','74 (月)','75 (木)','76 (欠)','77 (止)','78 (歹)','79 (殳)','80 (毋)',
  '81 (比)','82 (毛)','83 (氏)','84 (気)','85 (水)','86 (火)','87 (爪)','88 (父)','89 (爻)','90 (爿)',
  '91 (片)','92 (牙)','93 (牛)','94 (犬)','95 (玄)','96 (玉)','97 (瓜)','98 (瓦)','99 (甘)','100 (生)',
  '101 (用)','102 (田)','103 (疋)','104 (疒)','105 (癶)','106 (白)','107 (皮)','108 (皿)','109 (目)','110 (矛)',
  '111 (矢)','112 (石)','113 (示)','114 (禸)','115 (禾)','116 (穴)','117 (立)','118 (竹)','119 (米)','120 (糸)',
  '121 (缶)','122 (網)','123 (羊)','124 (羽)','125 (老)','126 (而)','127 (耒)','128 (耳)','129 (聿)','130 (肉)',
  '131 (臣)','132 (自)','133 (至)','134 (臼)','135 (舌)','136 (舛)','137 (舟)','138 (艮)','139 (色)','140 (艸)',
  '141 (虍)','142 (虫)','143 (血)','144 (行)','145 (衣)','146 (襾)','147 (見)','148 (角)','149 (言)','150 (谷)',
  '151 (豆)','152 (豕)','153 (豸)','154 (貝)','155 (赤)','156 (走)','157 (足)','158 (身)','159 (車)','160 (辛)',
  '161 (辰)','162 (辵)','163 (邑)','164 (酉)','165 (釆)','166 (里)','167 (金)','168 (長)','169 (門)','170 (阜)',
  '171 (隶)','172 (隹)','173 (雨)','174 (靑)','175 (非)','176 (面)','177 (革)','178 (韋)','179 (韭)','180 (音)',
  '181 (頁)','182 (風)','183 (飛)','184 (食)','185 (首)','186 (香)','187 (馬)','188 (骨)','189 (高)','190 (髟)',
  '191 (鬥)','192 (鬯)','193 (鬲)','194 (鬼)','195 (魚)','196 (鳥)','197 (鹵)','198 (鹿)','199 (麦)','200 (麻)',
  '201 (黄)','202 (黍)','203 (黒)','204 (黹)','205 (黽)','206 (鼎)','207 (鼓)','208 (鼠)','209 (鼻)','210 (齊)',
  '211 (歯)','212 (龍)','213 (亀)','214 (龠)',
];

const ORIGIN_TYPE_PAIRS = {
  '象形文字': 'อักษรภาพเลียนรูปทรง',
  '指事文字': 'อักษรสัญลักษณ์เชิงนามธรรม',
  '会意文字': 'อักษรประสมความหมาย',
  '形声文字': 'อักษรประสมเสียงและความหมาย',
};

const state = {
  category: 'kanji',
  erasSubTab: 'periods', // 'periods' | 'gengo'
  query: '',
  fileFilter: '',
  missingFilter: '',
  page: 1,
  limit: 60,
  total: 0,
  items: [],
  selectedIndex: -1,
  currentModel: null,
  isNew: false,
  kanjiFiles: [],
  vocabFiles: [],
};

function $(id) {
  return document.getElementById(id);
}

function showToast(msg, isError = false) {
  const t = $('studio-toast');
  t.textContent = msg;
  t.style.background = isError ? '#e11d48' : '#10b981';
  t.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    t.hidden = true;
  }, 2600);
}

export function furiganaToRubyHtml(text) {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(
    /([\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF々ヶ]+|[A-Za-z0-9]+|[\u30A0-\u30FF]+)\[([^\]]+)\]/g,
    '<ruby>$1<rt>$2</rt></ruby>'
  );
}

function guessCompoundBucket(reading) {
  const first = (reading || '').trim().charAt(0);
  if (!first) return 'content/compounds/a.md';
  if (/[あ-おぁ-ぉア-オァ-ォヴ]/.test(first)) return 'content/compounds/a.md';
  if (/[か-ごカ-ゴヵヶ]/.test(first)) return 'content/compounds/ka.md';
  if (/[さ-ぞサ-ゾ]/.test(first)) return 'content/compounds/sa.md';
  if (/[た-どっタ-ドッ]/.test(first)) return 'content/compounds/ta.md';
  if (/[な-のナ-ノ]/.test(first)) return 'content/compounds/na.md';
  if (/[は-ぽハ-ポ]/.test(first)) return 'content/compounds/ha.md';
  if (/[ま-もマ-モ]/.test(first)) return 'content/compounds/ma.md';
  if (/[や-よゃ-ょヤ-ヨャ-ョ]/.test(first)) return 'content/compounds/ya.md';
  if (/[ら-ろラ-ロ]/.test(first)) return 'content/compounds/ra.md';
  return 'content/compounds/wa.md';
}

async function fetchOverview() {
  const res = await fetch('/api/overview');
  const data = await res.json();
  $('count-kanji').textContent = data.kanji_count.toLocaleString();
  $('count-compounds').textContent = data.compounds_count.toLocaleString();
  $('count-vocabulary').textContent = data.vocabulary_count.toLocaleString();
  $('count-special-readings').textContent = data.special_readings_count.toLocaleString();
  $('count-prefectures').textContent = data.prefectures_count.toLocaleString();
  $('count-eras').textContent = (data.periods_count + data.gengo_count).toLocaleString();
  state.kanjiFiles = data.kanji_files || [];
  state.vocabFiles = data.vocabulary_files || [];
}

function renderSidebarFilters() {
  const container = $('sidebar-filters');
  container.innerHTML = '';

  if (state.category === 'kanji') {
    const fileSel = document.createElement('select');
    fileSel.innerHTML = `<option value="">ทุกไฟล์ (24 ไฟล์)</option>` +
      state.kanjiFiles.map((f) => `<option value="${f}">${f.replace('content/kanji/', '')}</option>`).join('');
    fileSel.value = state.fileFilter;
    fileSel.addEventListener('change', () => {
      state.fileFilter = fileSel.value;
      state.page = 1;
      loadList();
    });

    const missSel = document.createElement('select');
    missSel.innerHTML = `
      <option value="">ทั้งหมด (All Kanji)</option>
      <option value="no_examples">⚠️ ยังไม่มีประโยคตัวอย่าง (0 Examples)</option>
      <option value="no_origins">⚠️ ยังไม่มีข้อมูลที่มา (No Origins)</option>
      <option value="has_notes">💡 มีหมายเหตุ (Has Notes)</option>
    `;
    missSel.value = state.missingFilter;
    missSel.addEventListener('change', () => {
      state.missingFilter = missSel.value;
      state.page = 1;
      loadList();
    });

    container.append(fileSel, missSel);
  } else if (state.category === 'compounds') {
    const bucketSel = document.createElement('select');
    const buckets = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'];
    bucketSel.innerHTML = `<option value="">ทุกหมวดเสียง (a–wa)</option>` +
      buckets.map((b) => `<option value="content/compounds/${b}.md">${b}.md</option>`).join('');
    bucketSel.value = state.fileFilter;
    bucketSel.addEventListener('change', () => {
      state.fileFilter = bucketSel.value;
      state.page = 1;
      loadList();
    });

    const missSel = document.createElement('select');
    missSel.innerHTML = `
      <option value="">ทั้งหมด (All Compounds)</option>
      <option value="missing_th">⚠️ ยังไม่มีคำแปลไทย (Missing meaning_th)</option>
      <option value="has_th">✅ มีคำแปลไทยแล้ว (Has meaning_th)</option>
    `;
    missSel.value = state.missingFilter;
    missSel.addEventListener('change', () => {
      state.missingFilter = missSel.value;
      state.page = 1;
      loadList();
    });

    container.append(bucketSel, missSel);
  } else if (state.category === 'eras') {
    const subSel = document.createElement('select');
    subSel.innerHTML = `
      <option value="periods">15 ยุคประวัติศาสตร์ (時代 — periods.md)</option>
      <option value="gengo">19 รัชศกสำคัญ (元号・年号 — gengo.md)</option>
    `;
    subSel.value = state.erasSubTab;
    subSel.addEventListener('change', () => {
      state.erasSubTab = subSel.value;
      state.page = 1;
      loadList();
    });
    container.appendChild(subSel);
  }
}

async function loadList(preserveSelectionKey = null) {
  const params = new URLSearchParams({
    q: state.query,
    file: state.fileFilter,
    missing: state.missingFilter,
    sub: state.erasSubTab,
    page: String(state.page),
    limit: String(state.limit),
  });
  const res = await fetch(`/api/list/${state.category}?${params}`);
  const data = await res.json();
  state.items = data.items || [];
  state.total = data.total || 0;

  const totalPages = Math.max(1, Math.ceil(state.total / state.limit));
  $('list-summary-text').textContent = `พบ ${state.total.toLocaleString()} รายการ`;
  $('page-indicator').textContent = `${state.page} / ${totalPages}`;
  $('btn-prev-page').disabled = state.page <= 1;
  $('btn-next-page').disabled = state.page >= totalPages;

  renderEntryList();

  if (preserveSelectionKey) {
    const idx = state.items.findIndex((it) => getEntryKey(it) === preserveSelectionKey);
    if (idx !== -1) {
      selectEntryAtIndex(idx);
      return;
    }
  }
  if (state.items.length > 0 && state.selectedIndex === -1) {
    selectEntryAtIndex(0);
  }
}

function getEntryKey(item) {
  if (state.category === 'kanji') return item.kanji;
  if (state.category === 'compounds') return item.key || `${item.surface} (${item.reading})`;
  if (state.category === 'vocabulary') return item.id || item.word;
  if (state.category === 'special-readings') return item.word;
  if (state.category === 'prefectures') return item.slug;
  if (state.category === 'eras') return state.erasSubTab === 'periods' ? item.slug : item.id;
  return '';
}

function renderEntryList() {
  const listEl = $('entry-list');
  listEl.innerHTML = '';

  state.items.forEach((item, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'entry-item' + (idx === state.selectedIndex ? ' active' : '');

    if (state.category === 'kanji') {
      const exCount = item.examples_count || 0;
      btn.innerHTML = `
        <div class="entry-item-main">
          <div class="entry-char">${item.kanji}</div>
          <div class="entry-meta">
            <div class="entry-title-sub">${item.primary_reading || '—'}</div>
            <div class="entry-gloss">${item.primary_meaning_th || '—'}</div>
          </div>
        </div>
        <div class="entry-badges">
          <span class="mini-badge">漢検 ${item.kanken}</span>
          <span class="mini-badge ${exCount > 0 ? 'ok' : 'warn'}">${exCount} ตัวอย่าง</span>
        </div>
      `;
    } else if (state.category === 'compounds') {
      const hasTh = Boolean(item.meaning_th);
      btn.innerHTML = `
        <div class="entry-item-main">
          <div class="entry-char" style="font-size:16px;min-width:52px;">${item.surface}</div>
          <div class="entry-meta">
            <div class="entry-title-sub">${item.reading}</div>
            <div class="entry-gloss">${item.meaning_th || item.meaning_en}</div>
          </div>
        </div>
        <div class="entry-badges">
          <span class="mini-badge ${hasTh ? 'ok' : 'warn'}">${hasTh ? 'TH ✓' : 'No TH'}</span>
        </div>
      `;
    } else if (state.category === 'vocabulary') {
      btn.innerHTML = `
        <div class="entry-item-main">
          <div class="entry-meta">
            <div class="entry-title-sub">${item.word} (${item.reading})</div>
            <div class="entry-gloss">${item.meaning_th}</div>
          </div>
        </div>
        <div class="entry-badges">
          <span class="mini-badge">${item.category}</span>
        </div>
      `;
    } else if (state.category === 'special-readings') {
      btn.innerHTML = `
        <div class="entry-item-main">
          <div class="entry-meta">
            <div class="entry-title-sub">${item.word} (${item.reading})</div>
            <div class="entry-gloss">${item.meaning_th}</div>
          </div>
        </div>
        <div class="entry-badges">
          <span class="mini-badge">付表</span>
        </div>
      `;
    } else if (state.category === 'prefectures') {
      btn.innerHTML = `
        <div class="entry-item-main">
          <div class="entry-char" style="font-size:15px;min-width:48px;">${item.code}</div>
          <div class="entry-meta">
            <div class="entry-title-sub">${item.name_ja} (${item.name_th})</div>
            <div class="entry-gloss">${item.region} • ${item.capital}</div>
          </div>
        </div>
      `;
    } else if (state.category === 'eras') {
      btn.innerHTML = `
        <div class="entry-item-main">
          <div class="entry-meta">
            <div class="entry-title-sub">${item.name_ja} (${item.name_th})</div>
            <div class="entry-gloss">${item.start_year} – ${item.end_year}</div>
          </div>
        </div>
        <div class="entry-badges">
          <span class="mini-badge">#${item.order}</span>
        </div>
      `;
    }

    btn.addEventListener('click', () => selectEntryAtIndex(idx));
    listEl.appendChild(btn);
  });
}

async function selectEntryAtIndex(idx) {
  state.selectedIndex = idx;
  state.isNew = false;
  renderEntryList();

  const summary = state.items[idx];
  if (!summary) return;

  if (state.category === 'kanji') {
    const res = await fetch(`/api/item/kanji?key=${encodeURIComponent(summary.kanji)}`);
    state.currentModel = await res.json();
  } else {
    // Full object is already returned in list for other categories
    state.currentModel = JSON.parse(JSON.stringify(summary));
  }

  renderEditorForm();
}

function createChipInput(values, onChange, placeholder = 'พิมพ์แล้วกด Enter หรือ ,') {
  const wrapper = document.createElement('div');
  wrapper.className = 'chip-box';

  function rebuild() {
    wrapper.innerHTML = '';
    values.forEach((val, idx) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `<span>${val}</span><button type="button" title="ลบ">×</button>`;
      chip.querySelector('button').addEventListener('click', () => {
        values.splice(idx, 1);
        rebuild();
        onChange(values);
      });
      wrapper.appendChild(chip);
    });

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'chip-input';
    input.placeholder = values.length === 0 ? placeholder : '+ เพิ่ม...';

    function commitInput() {
      const raw = input.value.trim();
      if (!raw) return;
      raw.split(',').map((s) => s.trim()).filter(Boolean).forEach((part) => {
        if (!values.includes(part)) values.push(part);
      });
      input.value = '';
      rebuild();
      onChange(values);
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        commitInput();
      } else if (e.key === 'Backspace' && !input.value && values.length > 0) {
        values.pop();
        rebuild();
        onChange(values);
      }
    });
    input.addEventListener('blur', commitInput);
    wrapper.appendChild(input);
  }

  rebuild();
  return wrapper;
}

function renderEditorForm() {
  const m = state.currentModel;
  const body = $('editor-body');
  body.innerHTML = '';

  if (!m) return;

  $('editor-filepath').textContent = m.file_path || '';

  if (state.category === 'kanji') {
    $('editor-heading').textContent = state.isNew
      ? '✨ เพิ่มคันจิใหม่ (New Kanji)'
      : `แก้ไขคันจิ: ${m.kanji} (${(m.meanings_th || [])[0] || ''})`;
    renderKanjiEditor(body, m);
    updateKanjiVgPreview(m.kanji);
  } else {
    $('kanjivg-card').hidden = true;
    if (state.category === 'compounds') {
      $('editor-heading').textContent = state.isNew
        ? '✨ เพิ่มคำประสมใหม่ (New Compound)'
        : `แก้ไขคำประสม: ${m.surface} (${m.reading})`;
      renderCompoundEditor(body, m);
    } else if (state.category === 'vocabulary') {
      $('editor-heading').textContent = state.isNew
        ? '✨ เพิ่มคำศัพท์ใหม่ (New Vocabulary)'
        : `แก้ไขคำศัพท์: ${m.word}`;
      renderVocabularyEditor(body, m);
    } else if (state.category === 'special-readings') {
      $('editor-heading').textContent = state.isNew
        ? '✨ เพิ่มคำอ่านพิเศษ (New Special Reading)'
        : `แก้ไขคำอ่านพิเศษ: ${m.word} (${m.reading})`;
      renderSpecialReadingEditor(body, m);
    } else if (state.category === 'prefectures') {
      $('editor-heading').textContent = `แก้ไขจังหวัด: ${m.name_ja} (${m.name_th})`;
      renderPrefectureEditor(body, m);
    } else if (state.category === 'eras') {
      $('editor-heading').textContent = `แก้ไขยุคสมัย/รัชศก: ${m.name_ja} (${m.name_th})`;
      renderEraEditor(body, m);
    }
  }

  updateLiveMarkdownPreview();
}

async function updateKanjiVgPreview(char) {
  const card = $('kanjivg-card');
  const box = $('kanjivg-preview-box');
  if (!char) {
    card.hidden = true;
    return;
  }
  card.hidden = false;
  $('live-site-link').href = `http://localhost:8000/browse/kanji.html?k=${encodeURIComponent(char)}`;
  const cp = char.codePointAt(0).toString(16).padStart(5, '0');
  try {
    const res = await fetch(`/data/kanjivg/${cp}.svg`);
    if (res.ok) {
      box.innerHTML = await res.text();
    } else {
      box.innerHTML = `<span style="font-size:64px;color:#0f172a;font-family:var(--font-serif-jp)">${char}</span>`;
    }
  } catch {
    box.innerHTML = `<span style="font-size:64px;color:#0f172a;font-family:var(--font-serif-jp)">${char}</span>`;
  }
}

function renderKanjiEditor(container, m) {
  // 1. Core Identity & Classification
  const card1 = document.createElement('div');
  card1.className = 'form-card';
  const kankenLevels = ['10', '9', '8', '7', '6', '5', '4', '3', 'jun2', '2', 'jun1', '1'];
  card1.innerHTML = `
    <div class="form-card-title">1. ข้อมูลพื้นฐานและระดับ (Identity & Classification)</div>
    <div class="form-grid-4">
      <div class="field-group">
        <label class="field-label">ตัวอักษรคันจิ</label>
        <input type="text" class="input" id="f-kanji" value="${m.kanji}" maxlength="2" ${state.isNew ? '' : 'readonly'}>
      </div>
      <div class="field-group">
        <label class="field-label">จำนวนขีด (strokes)</label>
        <input type="number" class="input" id="f-strokes" min="1" max="64" value="${m.strokes}">
      </div>
      <div class="field-group">
        <label class="field-label">ระดับ JLPT</label>
        <select id="f-jlpt">
          <option value="">ไม่มี (—)</option>
          ${[5, 4, 3, 2, 1].map((n) => `<option value="${n}" ${m.jlpt === n ? 'selected' : ''}>N${n}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">ระดับ 漢検 (kanken)</label>
        <select id="f-kanken">
          ${kankenLevels.map((k) => `<option value="${k}" ${m.kanken === k ? 'selected' : ''}>${k}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-grid-3" style="margin-top:12px;">
      <div class="field-group">
        <label class="field-label">หมวดอักษร 214 ตัว (radical)</label>
        <input type="text" class="input" id="f-radical" list="radicals-datalist" value="${m.radical}">
        <datalist id="radicals-datalist">
          ${KANGXI_RADICALS.map((r) => `<option value="${r}"></option>`).join('')}
        </datalist>
      </div>
      <div class="field-group">
        <label class="field-label">ไฟล์ต้นฉบับ (ย้ายไฟล์อัตโนมัติเมื่อเปลี่ยน)</label>
        <select id="f-filepath">
          ${state.kanjiFiles.map((f) => `<option value="${f}" ${m.file_path === f ? 'selected' : ''}>${f}</option>`).join('')}
        </select>
      </div>
      <div class="field-group" style="justify-content:center;padding-top:18px;">
        <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="f-nameuse" ${m.name_use ? 'checked' : ''}>
          <span>ใช้ตั้งชื่อคนได้ (人名用漢字: <code>name_use: yes</code>)</span>
        </label>
      </div>
    </div>
  `;
  container.appendChild(card1);

  card1.querySelector('#f-kanji').addEventListener('input', (e) => {
    m.kanji = e.target.value.trim();
    updateKanjiVgPreview(m.kanji);
    updateLiveMarkdownPreview();
  });
  card1.querySelector('#f-strokes').addEventListener('input', (e) => {
    m.strokes = parseInt(e.target.value, 10) || 1;
    updateLiveMarkdownPreview();
  });
  card1.querySelector('#f-jlpt').addEventListener('change', (e) => {
    m.jlpt = e.target.value ? parseInt(e.target.value, 10) : null;
    updateLiveMarkdownPreview();
  });
  card1.querySelector('#f-kanken').addEventListener('change', (e) => {
    m.kanken = e.target.value;
    updateLiveMarkdownPreview();
  });
  card1.querySelector('#f-radical').addEventListener('input', (e) => {
    m.radical = e.target.value;
    updateLiveMarkdownPreview();
  });
  card1.querySelector('#f-filepath').addEventListener('change', (e) => {
    m.file_path = e.target.value;
    $('editor-filepath').textContent = m.file_path;
    updateLiveMarkdownPreview();
  });
  card1.querySelector('#f-nameuse').addEventListener('change', (e) => {
    m.name_use = e.target.checked;
    updateLiveMarkdownPreview();
  });

  // 2. Readings & Meanings (Chip Inputs)
  const card2 = document.createElement('div');
  card2.className = 'form-card';
  card2.innerHTML = `<div class="form-card-title">2. เสียงอ่านและความหมาย 3 ภาษา (กด Enter หรือ , เพื่อเพิ่มแท็ก)</div>`;
  const chipSpecs = [
    ['onyomi', 'เสียงอ่านอง (音読み — คาตาคานะ)', 'เช่น ニチ, ジツ'],
    ['kunyomi', 'เสียงอ่านคุน (訓読み — ใช้ . คั่นโอคุริงานะ)', 'เช่น ひ, ひと.つ'],
    ['jinmei', 'ชื่อคน (人名読み / 名乗り)', 'เช่น あき, かず'],
    ['meanings_ja', 'ความหมายภาษาญี่ปุ่น (字義 — meanings_ja)', 'เช่น ひとつ, はじめ'],
    ['meanings_th', 'ความหมายภาษาไทย (meanings_th)', 'เช่น วัน, พระอาทิตย์'],
    ['meanings_en', 'ความหมายภาษาอังกฤษ (meanings_en)', 'เช่น day, sun'],
  ];
  chipSpecs.forEach(([key, label, ph]) => {
    const fg = document.createElement('div');
    fg.className = 'field-group';
    fg.innerHTML = `<label class="field-label">${label}</label>`;
    m[key] = m[key] || [];
    fg.appendChild(
      createChipInput(m[key], () => updateLiveMarkdownPreview(), ph)
    );
    card2.appendChild(fg);
  });
  container.appendChild(card2);

  // 3. Origins & Notes
  const card3 = document.createElement('div');
  card3.className = 'form-card';
  card3.innerHTML = `
    <div class="form-card-title">3. ที่มาของอักษร (成り立ち) และหมายเหตุ</div>
    <div class="form-grid-2">
      <div class="field-group">
        <label class="field-label">ประเภทที่มา (origin_type — จับคู่ภาษาไทยให้อัตโนมัติ)</label>
        <select id="f-origin-type">
          <option value="">— ไม่ระบุ —</option>
          ${Object.keys(ORIGIN_TYPE_PAIRS).map((ot) => `<option value="${ot}" ${m.origin_type === ot ? 'selected' : ''}>${ot} (${ORIGIN_TYPE_PAIRS[ot]})</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">ชื่อประเภทภาษาไทย (origin_type_th)</label>
        <input type="text" class="input" id="f-origin-type-th" value="${m.origin_type_th || ''}">
      </div>
    </div>
    <div class="field-group" style="margin-top:10px;">
      <label class="field-label">คำอธิบายที่มา (origin_description)</label>
      <textarea id="f-origin-desc">${m.origin_description || ''}</textarea>
    </div>
    <div class="field-group">
      <label class="field-label">หมายเหตุเพิ่มเติม (notes)</label>
      <textarea id="f-notes">${m.notes || ''}</textarea>
    </div>
    <div class="field-group">
      <div class="field-label">
        <span>องค์ประกอบที่มา (Origin Components)</span>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-add-comp">+ เพิ่มองค์ประกอบ</button>
      </div>
      <div class="repeater-list" id="origin-comps-list"></div>
    </div>
  `;
  container.appendChild(card3);

  const otSel = card3.querySelector('#f-origin-type');
  const ottInp = card3.querySelector('#f-origin-type-th');
  otSel.addEventListener('change', () => {
    m.origin_type = otSel.value || null;
    if (otSel.value && ORIGIN_TYPE_PAIRS[otSel.value]) {
      m.origin_type_th = ORIGIN_TYPE_PAIRS[otSel.value];
      ottInp.value = m.origin_type_th;
    } else if (!otSel.value) {
      m.origin_type_th = null;
      ottInp.value = '';
    }
    updateLiveMarkdownPreview();
  });
  ottInp.addEventListener('input', () => {
    m.origin_type_th = ottInp.value.trim() || null;
    updateLiveMarkdownPreview();
  });
  card3.querySelector('#f-origin-desc').addEventListener('input', (e) => {
    m.origin_description = e.target.value.trim() || null;
    updateLiveMarkdownPreview();
  });
  card3.querySelector('#f-notes').addEventListener('input', (e) => {
    m.notes = e.target.value.trim() || null;
    updateLiveMarkdownPreview();
  });

  function renderOriginComps() {
    const list = card3.querySelector('#origin-comps-list');
    list.innerHTML = '';
    (m.origin_components || []).forEach((comp, idx) => {
      const row = document.createElement('div');
      row.className = 'repeater-item form-grid-3';
      row.innerHTML = `
        <input type="text" class="input" placeholder="ชิ้นส่วน เช่น 子" value="${comp.part}">
        <input type="text" class="input" placeholder="บทบาท เช่น 音符・意符" value="${comp.role}">
        <div style="display:flex;gap:6px;">
          <input type="text" class="input" placeholder="คำอธิบาย" value="${comp.desc}">
          <button type="button" class="btn btn-danger btn-sm">ลบ</button>
        </div>
      `;
      const inputs = row.querySelectorAll('input');
      inputs[0].addEventListener('input', (e) => { comp.part = e.target.value; updateLiveMarkdownPreview(); });
      inputs[1].addEventListener('input', (e) => { comp.role = e.target.value; updateLiveMarkdownPreview(); });
      inputs[2].addEventListener('input', (e) => { comp.desc = e.target.value; updateLiveMarkdownPreview(); });
      row.querySelector('button').addEventListener('click', () => {
        m.origin_components.splice(idx, 1);
        renderOriginComps();
        updateLiveMarkdownPreview();
      });
      list.appendChild(row);
    });
  }
  card3.querySelector('#btn-add-comp').addEventListener('click', () => {
    m.origin_components = m.origin_components || [];
    m.origin_components.push({ part: '', role: '意符', desc: '' });
    renderOriginComps();
    updateLiveMarkdownPreview();
  });
  renderOriginComps();

  // 4. Examples & Live Furigana (<ruby>) Builder
  const card4 = document.createElement('div');
  card4.className = 'form-card';
  card4.innerHTML = `
    <div class="form-card-title">
      <span>4. คำศัพท์และประโยคตัวอย่าง (Examples & Live Furigana Builder)</span>
      <button type="button" class="btn btn-primary btn-sm" id="btn-add-example">+ เพิ่มตัวอย่าง</button>
    </div>
    <div class="repeater-list" id="examples-list"></div>
  `;
  container.appendChild(card4);

  function renderExamples() {
    const list = card4.querySelector('#examples-list');
    list.innerHTML = '';
    (m.examples || []).forEach((ex, idx) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <div class="repeater-item-header">
          <span>ตัวอย่างที่ #${idx + 1}</span>
          <button type="button" class="btn btn-danger btn-sm">ลบตัวอย่างนี้</button>
        </div>
        <div class="form-grid-3">
          <div class="field-group">
            <label class="field-label">คำศัพท์ (word)</label>
            <input type="text" class="input ex-word" value="${ex.word}">
          </div>
          <div class="field-group">
            <label class="field-label">คำอ่าน (reading)</label>
            <input type="text" class="input ex-reading" value="${ex.reading}">
          </div>
          <div class="field-group">
            <label class="field-label">ความหมายไทย (meaning_th)</label>
            <input type="text" class="input ex-mth" value="${ex.meaning_th}">
          </div>
        </div>
        <div class="form-grid-2" style="margin-top:8px;">
          <div class="field-group">
            <label class="field-label">ประโยคภาษาญี่ปุ่น (ja)</label>
            <input type="text" class="input ex-ja" value="${ex.sentence_ja || ''}">
          </div>
          <div class="field-group">
            <label class="field-label">คำแปลประโยคภาษาไทย (th)</label>
            <input type="text" class="input ex-th" value="${ex.sentence_th || ''}">
          </div>
        </div>
        <div class="field-group" style="margin-top:8px;">
          <div class="field-label">
            <span>ฟุริงานะ (ruby — รูปแบบ <code>漢字[かんじ]</code>)</span>
            <div style="display:flex;gap:6px;">
              <button type="button" class="btn btn-secondary btn-sm btn-copy-ja">คัดลอกจากประโยค JA</button>
              <button type="button" class="btn btn-secondary btn-sm btn-wrap-ruby">ใส่ [คำอ่าน] ให้คำที่ลากคลุม</button>
            </div>
          </div>
          <input type="text" class="input ex-ruby" value="${ex.sentence_ruby || ''}">
          <div class="ruby-preview-bar">${furiganaToRubyHtml(ex.sentence_ruby || ex.sentence_ja || 'ตัวอย่างการแสดงผลฟุริงานะ')}</div>
        </div>
      `;

      const rubyInp = item.querySelector('.ex-ruby');
      const rubyPreview = item.querySelector('.ruby-preview-bar');

      item.querySelector('.ex-word').addEventListener('input', (e) => { ex.word = e.target.value; updateLiveMarkdownPreview(); });
      item.querySelector('.ex-reading').addEventListener('input', (e) => { ex.reading = e.target.value; updateLiveMarkdownPreview(); });
      item.querySelector('.ex-mth').addEventListener('input', (e) => { ex.meaning_th = e.target.value; updateLiveMarkdownPreview(); });
      item.querySelector('.ex-ja').addEventListener('input', (e) => { ex.sentence_ja = e.target.value; updateLiveMarkdownPreview(); });
      item.querySelector('.ex-th').addEventListener('input', (e) => { ex.sentence_th = e.target.value; updateLiveMarkdownPreview(); });
      rubyInp.addEventListener('input', (e) => {
        ex.sentence_ruby = e.target.value;
        rubyPreview.innerHTML = furiganaToRubyHtml(ex.sentence_ruby);
        updateLiveMarkdownPreview();
      });

      item.querySelector('.btn-copy-ja').addEventListener('click', () => {
        ex.sentence_ruby = ex.sentence_ja || '';
        rubyInp.value = ex.sentence_ruby;
        rubyPreview.innerHTML = furiganaToRubyHtml(ex.sentence_ruby);
        updateLiveMarkdownPreview();
      });

      item.querySelector('.btn-wrap-ruby').addEventListener('click', () => {
        const start = rubyInp.selectionStart ?? rubyInp.value.length;
        const end = rubyInp.selectionEnd ?? rubyInp.value.length;
        const selected = rubyInp.value.slice(start, end) || ex.word || '漢字';
        const reading = prompt(`ใส่เสียงอ่านฮิรางานะสำหรับ "${selected}":`, ex.reading || '');
        if (reading !== null) {
          const replacement = `${selected}[${reading.trim()}]`;
          rubyInp.value = rubyInp.value.slice(0, start) + replacement + rubyInp.value.slice(end);
          ex.sentence_ruby = rubyInp.value;
          rubyPreview.innerHTML = furiganaToRubyHtml(ex.sentence_ruby);
          updateLiveMarkdownPreview();
        }
      });

      item.querySelector('.repeater-item-header button').addEventListener('click', () => {
        m.examples.splice(idx, 1);
        renderExamples();
        updateLiveMarkdownPreview();
      });

      list.appendChild(item);
    });
  }

  card4.querySelector('#btn-add-example').addEventListener('click', () => {
    m.examples = m.examples || [];
    m.examples.push({
      word: m.kanji || '',
      reading: '',
      meaning_th: '',
      sentence_ja: '',
      sentence_th: '',
      sentence_ruby: '',
    });
    renderExamples();
    updateLiveMarkdownPreview();
  });
  renderExamples();
}

function renderCompoundEditor(container, m) {
  const card = document.createElement('div');
  card.className = 'form-card';
  card.innerHTML = `
    <div class="form-card-title">ข้อมูลคำประสม (Quick Compound & Dictionary Supplement)</div>
    <div class="form-grid-3">
      <div class="field-group">
        <label class="field-label">คำประสม 2–4 คันจิ (surface)</label>
        <input type="text" class="input" id="c-surface" value="${m.surface}" ${state.isNew ? '' : 'readonly'}>
      </div>
      <div class="field-group">
        <label class="field-label">เสียงอ่านฮิรางานะ (reading)</label>
        <input type="text" class="input" id="c-reading" value="${m.reading}" ${state.isNew ? '' : 'readonly'}>
      </div>
      <div class="field-group">
        <label class="field-label">ไฟล์หมวดเสียง (จัดหมวดอัตโนมัติตามเสียงแรก)</label>
        <input type="text" class="input" id="c-filepath" value="${m.file_path}" readonly>
      </div>
    </div>
    <div class="field-group" style="margin-top:12px;">
      <label class="field-label">ความหมายภาษาอังกฤษ (meaning_en — JMdict)</label>
      <input type="text" class="input" id="c-en" value="${m.meaning_en}">
    </div>
    <div class="field-group">
      <label class="field-label">
        <span>ความหมายภาษาไทย (meaning_th)</span>
        <span class="field-hint">กด Alt+Enter เพื่อบันทึกและไปคำถัดไปทันที</span>
      </label>
      <input type="text" class="input" id="c-th" value="${m.meaning_th || ''}" placeholder="พิมพ์คำแปลภาษาไทย...">
    </div>
  `;
  container.appendChild(card);

  card.querySelector('#c-surface').addEventListener('input', (e) => {
    m.surface = e.target.value.trim();
    updateLiveMarkdownPreview();
  });
  card.querySelector('#c-reading').addEventListener('input', (e) => {
    m.reading = e.target.value.trim();
    if (state.isNew) {
      m.file_path = guessCompoundBucket(m.reading);
      card.querySelector('#c-filepath').value = m.file_path;
      $('editor-filepath').textContent = m.file_path;
    }
    updateLiveMarkdownPreview();
  });
  card.querySelector('#c-en').addEventListener('input', (e) => {
    m.meaning_en = e.target.value;
    updateLiveMarkdownPreview();
  });
  const thInput = card.querySelector('#c-th');
  thInput.addEventListener('input', (e) => {
    m.meaning_th = e.target.value.trim() || null;
    updateLiveMarkdownPreview();
  });
  setTimeout(() => thInput.focus(), 30);
}

function renderVocabularyEditor(container, m) {
  const card = document.createElement('div');
  card.className = 'form-card';
  card.innerHTML = `
    <div class="form-card-title">ข้อมูลคำศัพท์หมวดหมู่ (Vocabulary / 四字熟語 / 動物 / アニメ)</div>
    <div class="form-grid-3">
      <div class="field-group">
        <label class="field-label">คำศัพท์ (word)</label>
        <input type="text" class="input" id="v-word" value="${m.word}">
      </div>
      <div class="field-group">
        <label class="field-label">รหัสอ้างอิง (id)</label>
        <input type="text" class="input" id="v-id" value="${m.id}">
      </div>
      <div class="field-group">
        <label class="field-label">ไฟล์ต้นฉบับ</label>
        <select id="v-file">
          ${state.vocabFiles.map((f) => `<option value="${f}" ${m.file_path === f ? 'selected' : ''}>${f}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-grid-3" style="margin-top:10px;">
      <div class="field-group">
        <label class="field-label">เสียงอ่าน (reading)</label>
        <input type="text" class="input" id="v-reading" value="${m.reading}">
      </div>
      <div class="field-group">
        <label class="field-label">ฟุริงานะ (furigana — <code>漢字[かんじ]</code>)</label>
        <input type="text" class="input" id="v-furigana" value="${m.furigana || ''}">
      </div>
      <div class="field-group">
        <label class="field-label">โรมาจิ (romaji)</label>
        <input type="text" class="input" id="v-romaji" value="${m.romaji}">
      </div>
    </div>
    <div class="form-grid-3" style="margin-top:10px;">
      <div class="field-group">
        <label class="field-label">หมวดหมู่ (category)</label>
        <input type="text" class="input" id="v-cat" value="${m.category}">
      </div>
      <div class="field-group">
        <label class="field-label">ชื่อหมวดหมู่ไทย (category_th)</label>
        <input type="text" class="input" id="v-cat-th" value="${m.category_th}">
      </div>
      <div class="field-group">
        <label class="field-label">ซีรีส์ (series — ถ้ามี)</label>
        <input type="text" class="input" id="v-series" value="${m.series || ''}">
      </div>
    </div>
    <div class="form-grid-2" style="margin-top:10px;">
      <div class="field-group">
        <label class="field-label">ความหมายไทย (meaning_th)</label>
        <input type="text" class="input" id="v-mth" value="${m.meaning_th}">
      </div>
      <div class="field-group">
        <label class="field-label">ความหมายอังกฤษ (meaning_en)</label>
        <input type="text" class="input" id="v-men" value="${m.meaning_en}">
      </div>
    </div>
    <div class="field-group" style="margin-top:10px;" id="v-tags-group">
      <label class="field-label">แท็ก (tags)</label>
    </div>
    <div class="field-group">
      <label class="field-label">เกร็ดความรู้ / ที่มา (Lore)</label>
      <textarea id="v-lore">${m.lore || ''}</textarea>
    </div>
  `;
  container.appendChild(card);

  m.tags = m.tags || [];
  card.querySelector('#v-tags-group').appendChild(
    createChipInput(m.tags, () => updateLiveMarkdownPreview(), 'เพิ่มแท็ก...')
  );

  const bind = (sel, key) => {
    card.querySelector(sel).addEventListener('input', (e) => {
      m[key] = e.target.value.trim();
      updateLiveMarkdownPreview();
    });
  };
  bind('#v-word', 'word');
  bind('#v-id', 'id');
  bind('#v-reading', 'reading');
  bind('#v-romaji', 'romaji');
  bind('#v-cat', 'category');
  bind('#v-cat-th', 'category_th');
  bind('#v-mth', 'meaning_th');
  bind('#v-men', 'meaning_en');
  card.querySelector('#v-file').addEventListener('change', (e) => {
    m.file_path = e.target.value;
    $('editor-filepath').textContent = m.file_path;
    updateLiveMarkdownPreview();
  });
  card.querySelector('#v-furigana').addEventListener('input', (e) => {
    m.furigana = e.target.value.trim() || null;
    updateLiveMarkdownPreview();
  });
  card.querySelector('#v-series').addEventListener('input', (e) => {
    m.series = e.target.value.trim() || null;
    updateLiveMarkdownPreview();
  });
  card.querySelector('#v-lore').addEventListener('input', (e) => {
    m.lore = e.target.value.trim() || null;
    updateLiveMarkdownPreview();
  });
}

function renderSpecialReadingEditor(container, m) {
  const card = document.createElement('div');
  card.className = 'form-card';
  card.innerHTML = `
    <div class="form-card-title">ตารางคำอ่านพิเศษ (付表・熟字訓・当て字)</div>
    <div class="form-grid-2">
      <div class="field-group">
        <label class="field-label">คำศัพท์ (word)</label>
        <input type="text" class="input" id="sr-word" value="${m.word}" ${state.isNew ? '' : 'readonly'}>
      </div>
      <div class="field-group">
        <label class="field-label">เสียงอ่านพิเศษ (reading)</label>
        <input type="text" class="input" id="sr-reading" value="${m.reading}">
      </div>
    </div>
    <div class="field-group" style="margin-top:10px;" id="sr-kanji-group">
      <label class="field-label">คันจิที่อยู่ในคำนี้ (kanji)</label>
    </div>
    <div class="field-group">
      <label class="field-label">ความหมายภาษาไทย (meaning_th)</label>
      <input type="text" class="input" id="sr-mth" value="${m.meaning_th}">
    </div>
    <div class="field-group">
      <label class="field-label">ความหมายภาษาอังกฤษ (meaning_en)</label>
      <input type="text" class="input" id="sr-men" value="${m.meaning_en}">
    </div>
  `;
  container.appendChild(card);

  m.kanji = m.kanji || [];
  card.querySelector('#sr-kanji-group').appendChild(
    createChipInput(m.kanji, () => updateLiveMarkdownPreview(), 'เช่น 明, 日')
  );

  card.querySelector('#sr-word').addEventListener('input', (e) => {
    m.word = e.target.value.trim();
    updateLiveMarkdownPreview();
  });
  card.querySelector('#sr-reading').addEventListener('input', (e) => {
    m.reading = e.target.value.trim();
    updateLiveMarkdownPreview();
  });
  card.querySelector('#sr-mth').addEventListener('input', (e) => {
    m.meaning_th = e.target.value;
    updateLiveMarkdownPreview();
  });
  card.querySelector('#sr-men').addEventListener('input', (e) => {
    m.meaning_en = e.target.value;
    updateLiveMarkdownPreview();
  });
}

function renderPrefectureEditor(container, m) {
  const card = document.createElement('div');
  card.className = 'form-card';
  card.innerHTML = `
    <div class="form-card-title">ข้อมูลจังหวัดญี่ปุ่น (都道府県 — ${m.code} ${m.name_ja})</div>
    <div class="form-grid-4">
      <div class="field-group"><label class="field-label">ชื่อญี่ปุ่น (name_ja)</label><input class="input" id="p-nja" value="${m.name_ja}" readonly></div>
      <div class="field-group"><label class="field-label">ฮิรางานะ (name_hira)</label><input class="input" id="p-nhira" value="${m.name_hira}"></div>
      <div class="field-group"><label class="field-label">โรมาจิ (name_romaji)</label><input class="input" id="p-nrom" value="${m.name_romaji}"></div>
      <div class="field-group"><label class="field-label">ชื่อไทย (name_th)</label><input class="input" id="p-nth" value="${m.name_th}"></div>
    </div>
    <div class="form-grid-3" style="margin-top:10px;">
      <div class="field-group"><label class="field-label">ภูมิภาค (region)</label><input class="input" id="p-reg" value="${m.region}"></div>
      <div class="field-group"><label class="field-label">เมืองหลวง (capital)</label><input class="input" id="p-cap" value="${m.capital}"></div>
      <div class="field-group"><label class="field-label">คำอ่านเมืองหลวง</label><input class="input" id="p-capr" value="${m.capital_reading}"></div>
    </div>
    <div class="form-grid-3" style="margin-top:10px;">
      <div class="field-group"><label class="field-label">ประชากร (population)</label><input class="input" id="p-pop" value="${m.population}"></div>
      <div class="field-group"><label class="field-label">ปีสำรวจ (population_year)</label><input class="input" id="p-popy" value="${m.population_year}"></div>
      <div class="field-group"><label class="field-label">พื้นที่ ตร.กม. (area_km2)</label><input class="input" id="p-area" value="${m.area_km2}"></div>
    </div>
    <div class="form-grid-3" style="margin-top:10px;">
      <div class="field-group"><label class="field-label">ดอกไม้ประจำจังหวัด (flower)</label><input class="input" id="p-flw" value="${m.flower}"></div>
      <div class="field-group"><label class="field-label">ต้นไม้ประจำจังหวัด (tree)</label><input class="input" id="p-tree" value="${m.tree}"></div>
      <div class="field-group"><label class="field-label">นกประจำจังหวัด (bird)</label><input class="input" id="p-bird" value="${m.bird}"></div>
    </div>
    <div class="field-group" style="margin-top:10px;">
      <label class="field-label">ที่มาของชื่อจังหวัด (etymology)</label>
      <textarea id="p-etym">${m.etymology}</textarea>
    </div>
  `;
  container.appendChild(card);

  const mapIds = [
    ['#p-nhira', 'name_hira'], ['#p-nrom', 'name_romaji'], ['#p-nth', 'name_th'],
    ['#p-reg', 'region'], ['#p-cap', 'capital'], ['#p-capr', 'capital_reading'],
    ['#p-pop', 'population'], ['#p-popy', 'population_year'], ['#p-area', 'area_km2'],
    ['#p-flw', 'flower'], ['#p-tree', 'tree'], ['#p-bird', 'bird'], ['#p-etym', 'etymology'],
  ];
  mapIds.forEach(([sel, key]) => {
    card.querySelector(sel).addEventListener('input', (e) => {
      m[key] = e.target.value;
      updateLiveMarkdownPreview();
    });
  });
}

function renderEraEditor(container, m) {
  const card = document.createElement('div');
  card.className = 'form-card';
  if (state.erasSubTab === 'periods') {
    card.innerHTML = `
      <div class="form-card-title">ข้อมูลยุคประวัติศาสตร์ญี่ปุ่น (時代 — ${m.name_ja})</div>
      <div class="form-grid-3">
        <div class="field-group"><label class="field-label">ชื่อญี่ปุ่น (name_ja)</label><input class="input" value="${m.name_ja}" readonly></div>
        <div class="field-group"><label class="field-label">ฮิรางานะ (name_hira)</label><input class="input" id="ep-hira" value="${m.name_hira}"></div>
        <div class="field-group"><label class="field-label">ชื่อไทย (name_th)</label><input class="input" id="ep-th" value="${m.name_th}"></div>
      </div>
      <div class="form-grid-3" style="margin-top:10px;">
        <div class="field-group"><label class="field-label">ปีเริ่มต้น (start_year)</label><input class="input" id="ep-start" value="${m.start_year}"></div>
        <div class="field-group"><label class="field-label">ปีสิ้นสุด (end_year)</label><input class="input" id="ep-end" value="${m.end_year}"></div>
        <div class="field-group"><label class="field-label">ป้ายกำกับช่วงปี (year_label)</label><input class="input" id="ep-ylabel" value="${m.year_label}"></div>
      </div>
      <div class="field-group" style="margin-top:10px;"><label class="field-label">ศูนย์กลางการปกครอง (capital)</label><input class="input" id="ep-cap" value="${m.capital}"></div>
      <div class="field-group"><label class="field-label">ที่มาของชื่อและคันจิ (etymology_th)</label><textarea id="ep-etym">${m.etymology_th}</textarea></div>
      <div class="field-group"><label class="field-label">สรุปภาพรวมยุคสมัย (summary_th)</label><textarea id="ep-sum">${m.summary_th}</textarea></div>
      <div class="field-group"><label class="field-label">พัฒนาการของอักษรคันจิในยุคนี้ (kanji_milestone_th)</label><textarea id="ep-km">${m.kanji_milestone_th}</textarea></div>
    `;
    container.appendChild(card);
    [
      ['#ep-hira', 'name_hira'], ['#ep-th', 'name_th'], ['#ep-start', 'start_year'],
      ['#ep-end', 'end_year'], ['#ep-ylabel', 'year_label'], ['#ep-cap', 'capital'],
      ['#ep-etym', 'etymology_th'], ['#ep-sum', 'summary_th'], ['#ep-km', 'kanji_milestone_th'],
    ].forEach(([sel, key]) => {
      card.querySelector(sel).addEventListener('input', (e) => {
        m[key] = e.target.value;
        updateLiveMarkdownPreview();
      });
    });
  } else {
    card.innerHTML = `
      <div class="form-card-title">ข้อมูลรัชศกญี่ปุ่น (元号・年号 — ${m.name_ja})</div>
      <div class="form-grid-3">
        <div class="field-group"><label class="field-label">ชื่อรัชศก (name_ja)</label><input class="input" value="${m.name_ja}" readonly></div>
        <div class="field-group"><label class="field-label">ฮิรางานะ (name_hira)</label><input class="input" id="eg-hira" value="${m.name_hira}"></div>
        <div class="field-group"><label class="field-label">ชื่อไทย (name_th)</label><input class="input" id="eg-th" value="${m.name_th}"></div>
      </div>
      <div class="form-grid-3" style="margin-top:10px;">
        <div class="field-group"><label class="field-label">ปีเริ่มต้น (start_year)</label><input class="input" id="eg-start" value="${m.start_year}"></div>
        <div class="field-group"><label class="field-label">ปีสิ้นสุด (end_year)</label><input class="input" id="eg-end" value="${m.end_year}"></div>
        <div class="field-group"><label class="field-label">ยุคสมัย (period_slug)</label><input class="input" id="eg-pslug" value="${m.period_slug}"></div>
      </div>
      <div class="field-group" style="margin-top:10px;"><label class="field-label">คัมภีร์ที่มา (source_classic)</label><input class="input" id="eg-src" value="${m.source_classic}"></div>
      <div class="field-group"><label class="field-label">ความหมายและความสำคัญ (meaning_th)</label><textarea id="eg-mth">${m.meaning_th}</textarea></div>
    `;
    container.appendChild(card);
    [
      ['#eg-hira', 'name_hira'], ['#eg-th', 'name_th'], ['#eg-start', 'start_year'],
      ['#eg-end', 'end_year'], ['#eg-pslug', 'period_slug'], ['#eg-src', 'source_classic'],
      ['#eg-mth', 'meaning_th'],
    ].forEach(([sel, key]) => {
      card.querySelector(sel).addEventListener('input', (e) => {
        m[key] = e.target.value;
        updateLiveMarkdownPreview();
      });
    });
  }
}

async function updateLiveMarkdownPreview() {
  if (!state.currentModel) return;
  try {
    const res = await fetch(`/api/preview/${state.category}?sub=${state.erasSubTab}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.currentModel),
    });
    const data = await res.json();
    if (data.markdown) {
      $('markdown-preview').textContent = data.markdown;
    }
  } catch {
    // ignore transient preview error
  }
}

async function saveCurrentEntry(advanceNext = false) {
  if (!state.currentModel) return;
  const pill = $('compile-status-pill');
  pill.className = 'status-pill busy';
  pill.textContent = 'กำลังบันทึก...';

  const autoCompile = $('auto-compile-check').checked;
  const url = `/api/save/${state.category}?sub=${state.erasSubTab}&compile=${autoCompile ? '1' : '0'}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.currentModel),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      pill.className = 'status-pill error';
      pill.textContent = 'บันทึกไม่สำเร็จ';
      $('compiler-log').textContent = data.error || 'เกิดข้อผิดพลาด';
      showToast(data.error || 'บันทึกไม่สำเร็จ', true);
      return;
    }

    pill.className = 'status-pill';
    pill.textContent = autoCompile ? '✅ บันทึก & Compile สำเร็จ' : '✅ บันทึก Markdown สำเร็จ';
    if (data.compile_output) {
      $('compiler-log').textContent = data.compile_output;
    }
    showToast(`บันทึก ${getEntryKey(state.currentModel)} เรียบร้อยแล้ว!`);
    await fetchOverview();

    if (advanceNext && state.selectedIndex + 1 < state.items.length) {
      const nextIdx = state.selectedIndex + 1;
      await loadList();
      selectEntryAtIndex(Math.min(nextIdx, state.items.length - 1));
    } else {
      await loadList(getEntryKey(state.currentModel));
    }
  } catch (err) {
    pill.className = 'status-pill error';
    pill.textContent = 'Error';
    showToast(String(err), true);
  }
}

async function runManualCompile() {
  const pill = $('compile-status-pill');
  pill.className = 'status-pill busy';
  pill.textContent = 'กำลังรัน compile_content.py...';
  const res = await fetch('/api/compile', { method: 'POST' });
  const data = await res.json();
  $('compiler-log').textContent = data.output || '';
  if (data.ok) {
    pill.className = 'status-pill';
    pill.textContent = '✅ Data JSON ซิงค์สมบูรณ์';
    showToast('คอมไพล์ content/ -> data/*.json สำเร็จ!');
  } else {
    pill.className = 'status-pill error';
    pill.textContent = '❌ Compile ไม่ผ่าน';
    showToast('พบข้อผิดพลาดในการตรวจสอบข้อมูล', true);
  }
}

function createNewEntry() {
  state.isNew = true;
  state.selectedIndex = -1;
  renderEntryList();

  if (state.category === 'kanji') {
    state.currentModel = {
      kanji: '',
      file_path: state.fileFilter || 'content/kanji/kanken-10.md',
      onyomi: [],
      kunyomi: [],
      jinmei: [],
      meanings_ja: [],
      meanings_th: [],
      meanings_en: [],
      strokes: 1,
      jlpt: 5,
      kanken: '10',
      radical: '1 (一)',
      notes: null,
      origin_type: '象形文字',
      origin_type_th: 'อักษรภาพเลียนรูปทรง',
      origin_description: '',
      name_use: true,
      origin_components: [],
      examples: [],
    };
  } else if (state.category === 'compounds') {
    state.currentModel = {
      surface: '',
      reading: '',
      file_path: 'content/compounds/a.md',
      meaning_en: '',
      meaning_th: '',
    };
  } else if (state.category === 'vocabulary') {
    state.currentModel = {
      word: '',
      id: '',
      file_path: state.vocabFiles[0] || 'content/vocabulary/yojijukugo.md',
      reading: '',
      furigana: null,
      romaji: '',
      category: 'yojijukugo',
      category_th: 'สุภาษิต 4 ตัวอักษร (四字熟語)',
      series: null,
      meaning_th: '',
      meaning_en: '',
      jlpt: 2,
      kanken: '2',
      tags: [],
      breakdown: [],
      lore: null,
    };
  } else if (state.category === 'special-readings') {
    state.currentModel = {
      word: '',
      file_path: 'content/special-readings/ateji.md',
      reading: '',
      kanji: [],
      meaning_th: '',
      meaning_en: '',
    };
  } else {
    showToast('หมวดหมู่นี้มีจำนวนรายการคงที่ สามารถคลิกเลือกรายการทางซ้ายเพื่อแก้ไขได้เลย');
    return;
  }

  renderEditorForm();
}

function initStudio() {
  document.querySelectorAll('.cat-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.category = btn.dataset.cat;
      state.query = '';
      state.fileFilter = '';
      state.missingFilter = '';
      state.page = 1;
      state.selectedIndex = -1;
      $('sidebar-search').value = '';
      renderSidebarFilters();
      loadList();
    });
  });

  let searchTimer = null;
  $('sidebar-search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = e.target.value.trim();
      state.page = 1;
      state.selectedIndex = -1;
      loadList();
    }, 150);
  });

  $('btn-prev-page').addEventListener('click', () => {
    if (state.page > 1) {
      state.page--;
      state.selectedIndex = -1;
      loadList();
    }
  });
  $('btn-next-page').addEventListener('click', () => {
    state.page++;
    state.selectedIndex = -1;
    loadList();
  });

  $('btn-new-entry').addEventListener('click', createNewEntry);
  $('btn-save-entry').addEventListener('click', () => saveCurrentEntry(false));
  $('btn-save-next').addEventListener('click', () => saveCurrentEntry(true));
  $('btn-compile-now').addEventListener('click', runManualCompile);

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveCurrentEntry(false);
    } else if (e.altKey && e.key === 'Enter') {
      e.preventDefault();
      saveCurrentEntry(true);
    }
  });

  fetchOverview().then(() => {
    renderSidebarFilters();
    loadList();
  });
}

initStudio();
