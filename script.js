const STORAGE_KEY = 'one_wish_wishes';

const screens = {
  HOME: 'onewishhomepage',
  MAKE_A_WISH: 'makeawish',
  BOX_OPEN: 'boxopen1',
  WISH: 'wish',
  SEND_WISH: 'send_the_wish',
  HISTORY_EMPTY: 'history_no_data',
  HISTORY: 'history_data',
  CRACK: 'crack',
};

const FADE_MS = 300;
const AUTO_SEQUENCE_MS = 900;

const EMOJIS = ['😺', '🧌', '👔', '⭐', '🌟', '💫', '🎋', '🍀', '✨', '🦋'];

const crackImages = [
  'assets/images/Tab0.svg',
  'assets/images/Tab1.svg',
  'assets/images/Tab2.svg',
  'assets/images/Tab3.svg',
];

let currentScreen = screens.HOME;
let currentWishText = '';
let crackCount = 0;

function getWishes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveWish(text) {
  const wishes = getWishes();
  wishes.unshift({
    id: crypto.randomUUID(),
    text: text.trim(),
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = days[date.getDay()];
  const d = date.getDate();
  const m = months[date.getMonth()];
  const y = String(date.getFullYear()).slice(-2);
  return `${day} ${d} ${m} ${y}`;
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach((el) => {
    const isActive = el.dataset.screen === name;
    el.classList.toggle('active', isActive);
    if (isActive) {
      el.style.opacity = '1';
    } else {
      el.style.opacity = '0';
    }
  });
  currentScreen = name;
}

function fadeTo(next) {
  return new Promise((resolve) => {
    const current = document.querySelector('.screen.active');
    if (current) {
      current.style.transition = 'opacity 300ms ease';
      current.style.opacity = '0';
    }

    setTimeout(() => {
      showScreen(next);
      const nextEl = document.querySelector(`[data-screen="${next}"]`);
      if (nextEl) {
        nextEl.style.opacity = '0';
        requestAnimationFrame(() => {
          nextEl.style.transition = 'opacity 300ms ease';
          nextEl.style.opacity = '1';
          setTimeout(() => {
            resolve();
          }, 300);
        });
      } else {
        resolve();
      }
    }, current ? 300 : 0);
  });
}

function playSound(id) {
  const audio = document.getElementById(id);
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function resetWishForm() {
  const input = document.getElementById('wishInput');
  const btn = document.getElementById('makeWishBtn');
  const placeholder = document.getElementById('wishPlaceholder');
  const text = document.getElementById('wishText');
  const cursor = document.getElementById('wishCursor');

  if (input) input.value = '';
  if (btn) {
    btn.disabled = true;
    btn.classList.remove('enabled');
  }
  if (placeholder) placeholder.classList.remove('hidden');
  if (text) text.textContent = '';
  if (cursor) cursor.classList.remove('hidden');
}

function updateWishDisplay() {
  const input = document.getElementById('wishInput');
  const btn = document.getElementById('makeWishBtn');
  const placeholder = document.getElementById('wishPlaceholder');
  const text = document.getElementById('wishText');
  const cursor = document.getElementById('wishCursor');
  if (!input) return;
  const value = input.value;

  if (value.length > 0) {
    if (placeholder) placeholder.classList.add('hidden');
    if (cursor) cursor.classList.add('hidden');
    if (text) text.textContent = value;
    if (btn) {
      btn.disabled = false;
      btn.classList.add('enabled');
    }
  } else {
    if (placeholder) placeholder.classList.remove('hidden');
    if (text) text.textContent = '';
    if (btn) {
      btn.disabled = true;
      btn.classList.remove('enabled');
    }
    if (document.activeElement === input && cursor) {
      cursor.classList.remove('hidden');
    }
  }
}

async function startMakeWishFlow() {
  resetWishForm();
  crackCount = 0;
  
  await fadeTo(screens.MAKE_A_WISH);
  await new Promise((r) => setTimeout(r, AUTO_SEQUENCE_MS));
  await fadeTo(screens.BOX_OPEN);

  const openLottie = document.getElementById('openLottie');
  try { openLottie?.play(); } catch (e) {}
  playSound('sfxOpenBox');

  await new Promise((resolve) => {
    let done = false;
    const fallback = setTimeout(() => {
      if (!done) { done = true; resolve(); }
    }, 3200);

    if (openLottie && typeof openLottie.addEventListener === 'function') {
      const onComplete = () => {
        if (!done) {
          done = true;
          clearTimeout(fallback);
          try { openLottie.removeEventListener('complete', onComplete); } catch (e) {}
          resolve();
        }
      };
      openLottie.addEventListener('complete', onComplete);
    }
  });

  await fadeTo(screens.WISH);

  const input = document.getElementById('wishInput');
  if (input) {
    input.focus();
    updateWishDisplay();
  }
}

async function sendWish() {
  const input = document.getElementById('wishInput');
  const btn = document.getElementById('makeWishBtn');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  currentWishText = text;
  if (btn) {
    btn.disabled = true;
    btn.classList.remove('enabled');
  }

  await fadeTo(screens.CRACK);
  startCrackFlow(text);
}

function updateCrackImage(index, wrap) {
  const crackWrap = wrap || document.querySelector(`[data-screen="${screens.CRACK}"] .crack-img-wrap`);
  if (!crackWrap) return;

  const idx = Math.min(Math.max(index, 0), crackImages.length - 1);
  const src = crackImages[idx];

  Array.from(crackWrap.querySelectorAll('img')).forEach(img => img.remove());

  const img = document.createElement('img');
  img.src = src;
  img.style.opacity = '1';
  crackWrap.appendChild(img);

  const counter = document.getElementById('crackCounter');
  if (counter) counter.textContent = `${idx}/3`;
}

async function handleCrack() {
  if (crackCount >= 3) return;

  const btn = document.getElementById('crackBtn');
  if (btn) btn.disabled = true;

  playSound('sfxCrack');
  crackCount += 1;

  const crackWrap = document.querySelector(`[data-screen="${screens.CRACK}"] .crack-img-wrap`);
  updateCrackImage(crackCount, crackWrap);

  setTimeout(() => {
    if (btn && crackCount < 3) btn.disabled = false;
  }, 500);

  if (crackCount >= 3) {
    saveWish(currentWishText);
    renderWishList();
    await new Promise((r) => setTimeout(r, 800));
    await fadeTo(screens.HISTORY);
  }
}

// โครงสร้างที่ดึงเวลาออกมาไว้ด้านนอกกล่องสีขาว (history-time-outside)
function renderWishList() {
  const list = document.getElementById('wishList');
  if (!list) return;
  const wishes = getWishes();

  if (wishes.length === 0) {
    list.innerHTML = '';
    return;
  }

  const grouped = {};
  wishes.forEach((wish) => {
    const dateKey = formatDate(wish.createdAt);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(wish);
  });

  let html = '';
  Object.entries(grouped).forEach(([date, items]) => {
    html += `<div class="history-date-badge">${escapeHtml(date)}</div>`;
    items.forEach((wish) => {
      html += `
        <div class="history-item">
          <div class="history-item-row">
            <span class="history-emoji">${wish.emoji}</span>
            <div class="history-content-wrapper">
              <div class="history-bubble">${escapeHtml(wish.text)}</div>
              <div class="history-time-outside">${formatTime(wish.createdAt)}</div>
            </div>
          </div>
        </div>
      `;
    });
  });

  list.innerHTML = html;
}

function viewAllWishes() {
  const wishes = getWishes();
  if (wishes.length === 0) {
    fadeTo(screens.HISTORY_EMPTY);
  } else {
    renderWishList();
    fadeTo(screens.HISTORY);
  }
}

function resetAppState() {
  resetWishForm();
  crackCount = 0;
  const counter = document.getElementById('crackCounter');
  if (counter) counter.textContent = '0/3';

  const crackWrap = document.querySelector(`[data-screen="${screens.CRACK}"] .crack-img-wrap`);
  if (crackWrap) {
    crackWrap.innerHTML = '';
    const img = document.createElement('img');
    img.src = crackImages[0] || 'assets/images/Tab0.svg';
    img.style.opacity = '1';
    crackWrap.appendChild(img);
  }

  const stickImage = document.getElementById('stickImage');
  if (stickImage) {
    stickImage.src = 'assets/images/wood-wish.png';
  }
  currentWishText = '';

  const crackBtn = document.getElementById('crackBtn');
  if (crackBtn) crackBtn.disabled = false;
}

async function closeHistory() {
  resetAppState();
  await fadeTo(screens.HOME);
}

function startCrackFlow(text) {
  currentWishText = text || currentWishText;
  crackCount = 0;
  
  const crackWrap = document.querySelector(`[data-screen="${screens.CRACK}"] .crack-img-wrap`);
  if (crackWrap) {
    crackWrap.innerHTML = '';
  }
  
  updateCrackImage(0);
  
  const counter = document.getElementById('crackCounter');
  if (counter) counter.textContent = '0/3';
  
  const btn = document.getElementById('crackBtn');
  if (btn) {
    btn.disabled = false;
  }
}

// ── Fit-to-screen: ย่อ/ขยายทั้งแอป (ดีไซน์ fixed 430x932) ให้พอดีกับหน้าจอจริงเสมอ ──
function fitAppToScreen() {
  const app = document.getElementById('app');
  if (!app) return;

  const DESIGN_WIDTH = 430;
  const DESIGN_HEIGHT = 932;

  // ใช้ visualViewport ถ้ามี เพราะแม่นกว่า window.innerHeight บนมือถือ
  // (window.innerHeight มักไม่หัก address bar / แถบด้านล่างของเบราว์เซอร์ออกให้)
  const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  const scale = Math.min(viewportWidth / DESIGN_WIDTH, viewportHeight / DESIGN_HEIGHT);

  const scaledWidth = DESIGN_WIDTH * scale;
  const scaledHeight = DESIGN_HEIGHT * scale;

  const offsetX = Math.max(0, (viewportWidth - scaledWidth) / 2);
  const offsetY = Math.max(0, (viewportHeight - scaledHeight) / 2);

  app.style.transform = `scale(${scale})`;
  app.style.left = `${offsetX}px`;
  app.style.top = `${offsetY}px`;
}

document.addEventListener('DOMContentLoaded', () => {
  fitAppToScreen();
  window.addEventListener('resize', fitAppToScreen);
  window.addEventListener('orientationchange', fitAppToScreen);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fitAppToScreen);
  }

  document.querySelectorAll('[data-action="make-wish"]').forEach((btn) => {
    btn.addEventListener('click', startMakeWishFlow);
  });

  document.querySelector('[data-action="view-all"]')?.addEventListener('click', viewAllWishes);

  document.querySelectorAll('[data-action="go-home"]').forEach((btn) => {
    btn.addEventListener('click', closeHistory);
  });

  const input = document.getElementById('wishInput');
  if (input) {
    input.addEventListener('input', updateWishDisplay);
    input.addEventListener('focus', () => {
      document.getElementById('wishCursor')?.classList.remove('hidden');
    });
    input.addEventListener('blur', () => {
      if (input.value.length === 0) {
        document.getElementById('wishCursor')?.classList.add('hidden');
      }
    });
  }

  document.getElementById('makeWishBtn')?.addEventListener('click', sendWish);
  document.getElementById('crackBtn')?.addEventListener('click', handleCrack);
});
