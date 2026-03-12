// ─────────────────────────
// DRIP APP
// ─────────────────────────

// constants
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

// state
let clothes = JSON.parse(localStorage.getItem(STORAGE_KEY_CLOTHES) || '[]');
let outfits = JSON.parse(localStorage.getItem(STORAGE_KEY_OUTFITS) || '[]');

let slots = {
  top: null,
  bottom: null,
  outer: null,
  shoes: null,
  accessory: null,
};

let uploadedImage = null;
let selectedCategory = null;
let currentSlot = null;
let activeFilter = 'all';
let lastAdvice = '';


// ─────────────────────────
// TAB
// ─────────────────────────

function showTab(tab) {

  ['closet','ai','saved'].forEach(t=>{
    document.getElementById('tab-'+t).style.display =
      t === tab ? 'block' : 'none'
  })

  document.querySelectorAll('.nb').forEach(btn=>{
    btn.classList.remove('on')
  })

  event.target.classList.add('on')

  if(tab === 'saved') renderSaved()
}


// ─────────────────────────
// CLOSET
// ─────────────────────────

function renderCloset(){

  document.getElementById('count').textContent = clothes.length

  const list =
    activeFilter === 'all'
    ? clothes
    : clothes.filter(c=>c.category===activeFilter)

  const grid = document.getElementById('closet-grid')

  if(!list.length){

    grid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🧺</div>
      <div class="empty-txt">
      옷장이 비어있어요<br>
      첫 번째 아이템을 추가해보세요
      </div>
    </div>`

    return
  }

  grid.innerHTML = list.map((item,i)=>{

    const img = item.image
      ? `<img src="${item.image}"/>`
      : `<div class="ig-card-ph">
          <div class="ig-icon">${CAT_ICONS[item.category]}</div>
        </div>`

    return `
    <div class="ig-card">

      ${img}

      <div class="ig-badge">
      ${CAT_LABELS[item.category]}
      </div>

      <div class="ig-overlay">
        <div>
          <div class="ig-name">${item.name}</div>
        </div>
      </div>

    </div>`

  }).join('')
}


// ─────────────────────────
// FILTER
// ─────────────────────────

function filterC(cat,btn){

  activeFilter = cat

  document.querySelectorAll('.ftag')
  .forEach(b=>b.classList.remove('on'))

  btn.classList.add('on')

  renderCloset()
}


// ─────────────────────────
// ADD ITEM
// ─────────────────────────

function openAdd(){

  uploadedImage=null
  selectedCategory=null

  document.getElementById('modal-add').style.display='flex'
}

function closeM(id){

  document.getElementById(id).style.display='none'

}


function handleUp(e){

  const file = e.target.files[0]

  if(!file) return

  const reader = new FileReader()

  reader.onload = ev=>{
    uploadedImage = ev.target.result
  }

  reader.readAsDataURL(file)

}


function selCat(btn){

  document.querySelectorAll('#cat-chips .chip')
  .forEach(c=>c.classList.remove('on'))

  btn.classList.add('on')

  selectedCategory = btn.dataset.v

}


function addItem(){

  const name = document.getElementById('i-name').value.trim()

  if(!name){
    showToast('이름 입력')
    return
  }

  if(!selectedCategory){
    showToast('카테고리 선택')
    return
  }

  const item = {
    id: Date.now(),
    name,
    category:selectedCategory,
    image:uploadedImage
  }

  clothes.unshift(item)

  localStorage.setItem(
    STORAGE_KEY_CLOTHES,
    JSON.stringify(clothes)
  )

  closeM('modal-add')

  renderCloset()

}


// ─────────────────────────
// SLOT PICK
// ─────────────────────────

function openPick(type){

  currentSlot = type

  const list = clothes.filter(c=>c.category===type)

  const grid = document.getElementById('pick-grid')

  grid.innerHTML = list.map(item=>`

    <div class="pk" onclick="selSlot(${item.id})">

      <div class="pk-img">

      ${
        item.image
        ? `<img src="${item.image}"/>`
        : CAT_ICONS[item.category]
      }

      </div>

      <div class="pk-nm">${item.name}</div>

    </div>

  `).join('')

  document.getElementById('modal-pick').style.display='flex'

}


function selSlot(id){

  const item = clothes.find(c=>c.id===id)

  slots[currentSlot]=item

  closeM('modal-pick')

}


// ─────────────────────────
// AI (MOCK VERSION)
// ─────────────────────────

function getRec(){

  const hasItems = Object.values(slots).some(v=>v)

  if(!hasItems){

    showToast('아이템 선택 필요')

    return
  }

  const tips = [

    "컬러 밸런스가 좋아요.",
    "상의와 하의 핏 조합이 좋습니다.",
    "신발을 밝은 색으로 바꾸면 더 좋을 수 있어요.",
    "레이어드를 추가하면 더 스타일리시합니다."

  ]

  const advice = tips[Math.floor(Math.random()*tips.length)]

  lastAdvice = advice

  document.getElementById('result-wrap').innerHTML=`

  <div class="result-content">

    <div class="r-badge">AI Analysis</div>

    <div class="r-text">${advice}</div>

  </div>

  `

}


// ─────────────────────────
// SAVED
// ─────────────────────────

function renderSaved(){

  document.getElementById('sv-count').textContent
  = outfits.length

}


// ─────────────────────────
// TOAST
// ─────────────────────────

function showToast(msg){

  const toast=document.getElementById('toast')

  toast.textContent=msg

  toast.style.display='block'

  setTimeout(()=>{
    toast.style.display='none'
  },2000)

}


// ─────────────────────────
// INIT
// ─────────────────────────

document.addEventListener("DOMContentLoaded",()=>{

  renderCloset()

  renderSaved()

})