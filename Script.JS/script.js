/* ─────────────────────────────────────
   DRIP — No Right Answer In Fashion
   app.js
───────────────────────────────────── */

// ── CONSTANTS ──
const CAT_LABELS = {
  top: '상의',
  bottom: '하의',
  outer: '아우터',
  shoes: '신발',
  accessory: '악세사리',
};
const CAT_ICONS = {
  top: '👕',
  bottom: '👖',
  outer: '🧥',
  shoes: '👟',
  accessory: '💍',
};
const STORAGE_KEY_CLOTHES = 'drip_clothes';
const STORAGE_KEY_OUTFITS = 'drip_outfits';

// ── STATE ──
let clothes = [];
let outfits = [];
let slots   = { top: null, bottom: null, outer: null, shoes: null, accessory: null };

let uploadedImage    = null;
let selectedCategory = null;
let currentSlot      = null;
let activeFilter     = 'all';
let lastAdvice       = '';

// Load from localStorage
try { clothes = JSON.parse(localStorage.getItem(STORAGE_KEY_CLOTHES) || '[]'); } catch (e) {}
try { outfits = JSON.parse(localStorage.getItem(STORAGE_KEY_OUTFITS) || '[]'); } catch (e) {}

// ─────────────────────────────────────
// TAB NAVIGATION
// ─────────────────────────────────────
function showTab(tab) {
  ['closet', 'ai', 'saved'].forEach(t => {
    document.getElementById('tab-' + t).style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.nb').forEach((btn, i) => {
    btn.classList.toggle('on', ['closet', 'ai', 'saved'][i] === tab);
  });
  if (tab === 'saved') renderSaved();
}

// ─────────────────────────────────────
// CLOSET
// ─────────────────────────────────────
function renderCloset() {
  document.getElementById('count').textContent = clothes.length;

  const list = activeFilter === 'all'
    ? clothes
    : clothes.filter(c => c.category === activeFilter);

  const grid = document.getElementById('closet-grid');

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🧺</div>
        <div class="empty-txt">옷장이 비어있어요<br>첫 번째 아이템을 추가해보세요</div>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((item, i) => {
    const wide = (i === 0 && list.length > 1) ? ' wide' : '';
    const img  = item.image
      ? `<img src="${item.image}" alt="${item.name}"/>`
      : `<div class="ig-card-ph"><div class="ig-icon">${CAT_ICONS[item.category] || '👔'}</div></div>`;
    const meta = [item.color, item.brand].filter(Boolean).join(' · ');

    return `
      <div class="ig-card${wide}" style="animation-delay:${i * 0.04}s">
        ${img}
        <div class="ig-badge">${CAT_LABELS[item.category] || item.category}</div>
        <div class="ig-overlay">
          <div>
            <div class="ig-name">${item.name}</div>
            ${meta ? `<div class="ig-meta">${meta}</div>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

function filterC(cat, btn) {
  activeFilter = cat;
  document.querySelectorAll('.ftag').forEach(p => p.classList.remove('on'));
  btn.classList.add('on');
  renderCloset();
}

// ─────────────────────────────────────
// ADD ITEM MODAL
// ─────────────────────────────────────
function openAdd() {
  uploadedImage    = null;
  selectedCategory = null;

  ['i-name', 'i-color', 'i-brand'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.querySelectorAll('#cat-chips .chip').forEach(c => c.classList.remove('on'));
  document.getElementById('up-wrap').innerHTML = `
    <div class="up-icon">📷</div>
    <div class="up-txt">Tap to upload photo (optional)</div>`;

  document.getElementById('modal-add').style.display = 'flex';
}

function closeM(id) {
  document.getElementById(id).style.display = 'none';
}

function handleUp(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    uploadedImage = ev.target.result;
    document.getElementById('up-wrap').innerHTML = `
      <img src="${uploadedImage}" class="up-preview"/>
      <div class="up-txt">Tap to change</div>`;
  };
  reader.readAsDataURL(file);
}

function selCat(btn) {
  document.querySelectorAll('#cat-chips .chip').forEach(c => c.classList.remove('on'));
  btn.classList.add('on');
  selectedCategory = btn.dataset.v;
}

function addItem() {
  const name = document.getElementById('i-name').value.trim();
  if (!name)            { showToast('이름을 입력해주세요'); return; }
  if (!selectedCategory){ showToast('카테고리를 선택해주세요'); return; }

  const item = {
    id:       Date.now(),
    name,
    category: selectedCategory,
    color:    document.getElementById('i-color').value.trim(),
    brand:    document.getElementById('i-brand').value.trim(),
    image:    uploadedImage,
  };

  clothes.unshift(item);
  localStorage.setItem(STORAGE_KEY_CLOTHES, JSON.stringify(clothes));
  closeM('modal-add');
  renderCloset();
  showToast(`"${name}" added ✓`);
}

// ─────────────────────────────────────
// SLOT PICKER
// ─────────────────────────────────────
function openPick(type) {
  currentSlot = type;
  const list  = clothes.filter(c => c.category === type);

  document.getElementById('pick-ttl').textContent = `Select ${CAT_LABELS[type]}`;

  const grid = document.getElementById('pick-grid');
  if (!list.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px;
                  font-family:'IBM Plex Mono',monospace;font-size:10px;
                  color:var(--white3);letter-spacing:0.12em;">
        등록된 ${CAT_LABELS[type]}이 없어요
      </div>`;
  } else {
    grid.innerHTML = list.map(item => `
      <div class="pk" onclick="selSlot(${item.id})">
        <div class="pk-img">
          ${item.image
            ? `<img src="${item.image}"/>`
            : `<span>${CAT_ICONS[item.category]}</span>`}
        </div>
        <div class="pk-nm">${item.name}</div>
      </div>`).join('');
  }

  document.getElementById('modal-pick').style.display = 'flex';
}

function selSlot(id) {
  const item = clothes.find(c => c.id === id);
  if (!item) return;

  slots[currentSlot] = item;

  if (currentSlot === 'accessory') {
    document.getElementById('acc-nm').textContent = item.name;
  } else {
    const slotEl = document.getElementById('sl-' + currentSlot);
    slotEl.classList.add('on');
    slotEl.innerHTML = `
      ${item.image
        ? `<img src="${item.image}"/>`
        : `<span style="font-size:28px">${CAT_ICONS[item.category]}</span>`}
      <div class="slot-nm">${item.name}</div>`;
  }

  closeM('modal-pick');
}

// ─────────────────────────────────────
// CHIPS (single-select groups)
// ─────────────────────────────────────
document.querySelectorAll('#ch-season .chip, #ch-style .chip, #ch-mood .chip')
  .forEach(chip => {
    chip.addEventListener('click', function () {
      this.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
      this.classList.add('on');
    });
  });

function chipVal(groupId) {
  const active = document.querySelector(`#${groupId} .chip.on`);
  return active ? active.dataset.v : '';
}

// ─────────────────────────────────────
// AI RECOMMENDATION
// ─────────────────────────────────────
async function getRec() {
  const hasItems = Object.values(slots).some(v => v !== null);
  if (!hasItems) { showToast('아이템을 최소 하나 선택해주세요'); return; }

  const itemsText = Object.entries(slots)
    .filter(([, v]) => v)
    .map(([k, v]) => {
      const extras = [v.color, v.brand].filter(Boolean).join(' / ');
      return `${CAT_LABELS[k]}: ${v.name}${extras ? ` (${extras})` : ''}`;
    })
    .join('\n');

  const prompt = `당신은 스트릿 패션에 정통한 스타일리스트입니다. 아래 코디에 대해 솔직하고 실용적인 조언을 해주세요.

선택한 아이템:
${itemsText}

계절: ${chipVal('ch-season')}
스타일: ${chipVal('ch-style')}
상황: ${chipVal('ch-mood')}

다음 순서로 답변해주세요:
1. 이 코디의 전체적인 인상
2. 잘 어울리는 강점
3. 더 좋아질 수 있는 포인트
4. 핵심 스타일링 팁 1가지

"패션에 정답은 없지만 더 좋은 방향은 있다"는 철학으로 친근하고 구체적으로 한국어로 답변해주세요.`;

  // Show loading
  document.getElementById('result-wrap').innerHTML = `
    <div class="dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>`;
  document.getElementById('rec-btn').disabled = true;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data.content?.map(b => b.text || '').join('\n') || '결과를 가져오지 못했어요.';
    lastAdvice = text;

    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/^(\d\.\s)/gm, '<br><strong style="color:var(--white);font-size:13px;">$1</strong>');

    document.getElementById('result-wrap').innerHTML = `
      <div class="result-content">
        <div class="r-badge">AI Analysis</div>
        <div class="r-text">${formatted}</div>
        <div style="margin-top:24px;">
          <button class="rec-btn"
            style="background:var(--s3);color:var(--white2);border:1px solid var(--border2);"
            onclick="saveOutfit()">
            Save this outfit
          </button>
        </div>
      </div>`;

  } catch (err) {
    console.error('API error:', err);
    document.getElementById('result-wrap').innerHTML = `
      <div class="result-ph">
        <div style="color:var(--red);font-size:12px;">오류가 발생했어요. 다시 시도해주세요.</div>
      </div>`;
  }

  document.getElementById('rec-btn').disabled = false;
}

// ─────────────────────────────────────
// SAVE OUTFIT
// ─────────────────────────────────────
function saveOutfit() {
  const items = Object.values(slots).filter(Boolean);
  if (!items.length) return;

  const outfit = {
    id:     Date.now(),
    items:  items.map(i => ({ ...i })),
    season: chipVal('ch-season'),
    style:  chipVal('ch-style'),
    mood:   chipVal('ch-mood'),
    advice: lastAdvice,
  };

  outfits.unshift(outfit);
  localStorage.setItem(STORAGE_KEY_OUTFITS, JSON.stringify(outfits));
  showToast('Outfit saved ✓');
}

// ─────────────────────────────────────
// SAVED OUTFITS
// ─────────────────────────────────────
function renderSaved() {
  document.getElementById('sv-count').textContent = outfits.length;
  const grid = document.getElementById('saved-grid');

  if (!outfits.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🪞</div>
        <div class="empty-txt">저장된 코디가 없어요<br>AI 추천 후 마음에 드는 코디를 저장해보세요</div>
      </div>`;
    return;
  }

  grid.innerHTML = outfits.map((outfit, i) => {
    const minis = outfit.items.slice(0, 3).map(item => `
      <div class="sv-mini">
        ${item.image
          ? `<img src="${item.image}"/>`
          : `<span>${CAT_ICONS[item.category] || '👔'}</span>`}
      </div>`).join('');

    const placeholders = outfit.items.length < 3
      ? Array(3 - outfit.items.length).fill(`<div class="sv-mini" style="opacity:.1">✦</div>`).join('')
      : '';

    return `
      <div class="sv-card" style="animation-delay:${i * 0.04}s">
        <div class="sv-card-imgs">${minis}${placeholders}</div>
        <div class="sv-hover">
          <div class="sv-tags">
            <span class="sv-tag">${outfit.season}</span>
            <span class="sv-tag">${outfit.style}</span>
            <span class="sv-tag">${outfit.mood}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ─────────────────────────────────────
// TOAST
// ─────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  toast.style.animation = 'toastIn 0.3s cubic-bezier(0.16,1,0.3,1)';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 2800);
}

// ─────────────────────────────────────
// INIT
// ─────────────────────────────────────
renderCloset();
renderSaved();