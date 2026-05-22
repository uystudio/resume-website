const API = '/api/portfolio';

function buildCard(item, type) {
  const card = document.createElement('a');
  card.className = 'gallery-card';
  card.href = '#';
  card.onclick = function(e) { e.preventDefault(); preview(item); };

  card.innerHTML = `
    <div class="gallery-media">
      <img src="${item.thumbnail}" alt="${item.title}" loading="lazy" />
      ${type === 'video' ? '<span class="gallery-badge">&#9654;</span>' : ''}
    </div>
    <div class="gallery-body">
      <h3>${item.title}</h3>
      <p>${item.desc}</p>
    </div>`;
  return card;
}

function preview(item) {
  let overlay = document.getElementById('lightbox');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'lightbox';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;cursor:pointer;';
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
  }
  const isVideo = /\.(mp4|mov|avi|mkv|webm|flv)/i.test(item.thumbnail);
  overlay.innerHTML = `
    <span style="position:absolute;top:20px;right:28px;font-size:2rem;color:#fff;opacity:.5;cursor:pointer;z-index:1;" onclick="this.parentElement.remove()">&times;</span>
    ${isVideo
      ? `<video src="${item.thumbnail}" controls autoplay style="max-width:90vw;max-height:80vh;border-radius:8px;"></video>`
      : `<img src="${item.thumbnail}" alt="${item.title}" style="max-width:90vw;max-height:80vh;border-radius:8px;">`
    }
    <p style="color:#aaa;margin-top:12px;font-size:.85rem;">${item.title}</p>`;
}

function fillGrid(id, items, type) {
  const grid = document.getElementById(id);
  if (!grid || !items || !items.length) return;
  grid.innerHTML = '';
  items.forEach(item => grid.appendChild(buildCard(item, type)));
}

async function loadGallery() {
  let data = null;

  // 先尝试 API（本地后端模式）
  try {
    const res = await fetch(API);
    if (res.ok) data = await res.json();
  } catch {}

  // API 失败就加载静态 JSON（GitHub Pages 模式）
  if (!data) {
    try {
      const res = await fetch('data/portfolio.json');
      if (res.ok) data = await res.json();
    } catch {}
  }

  if (data) {
    fillGrid('gallery-videos', data.videos, 'video');
    fillGrid('gallery-photos', data.photos, 'photo');
    fillGrid('gallery-creations', data.creations, 'photo');
  } else {
    document.querySelectorAll('.gallery-grid').forEach(g => {
      g.innerHTML = '<p class="gallery-empty">暂无作品</p>';
    });
  }
}

loadGallery();
