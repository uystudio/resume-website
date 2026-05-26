// === 音效引擎 ===
var Sound = (function() {
  var ctx = null;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, type, vol, start, dur) {
    var c = getCtx();
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(start);
    osc.stop(start + dur);
  }
  return {
    tick: function() { var t = getCtx().currentTime; tone(800, 'sine', 0.08, t, 0.06); },
    pop: function()  { var t = getCtx().currentTime; tone(600, 'sine', 0.06, t, 0.08); },
    click: function() { var t = getCtx().currentTime; tone(400, 'sine', 0.05, t, 0.05); tone(1200, 'sine', 0.04, t + 0.02, 0.04); },
    open: function()  { var t = getCtx().currentTime; tone(200, 'sine', 0.06, t, 0.15); tone(600, 'sine', 0.04, t + 0.05, 0.1); }
  };
})();

// === 数据加载 ===
var siteData = null;
var RENDER_API_APP = localStorage.getItem('render_api') || '';
var API = RENDER_API_APP ? RENDER_API_APP + '/api/portfolio' : '/api/portfolio';

async function loadData() {
  try {
    var res = await fetch(API);
    if (res.ok) siteData = await res.json();
  } catch(e) {}

  if (!siteData) {
    try {
      var res2 = await fetch('data/portfolio.json');
      if (res2.ok) siteData = await res2.json();
    } catch(e) {}
  }

  if (siteData) {
    renderSite(siteData.site || {});
    renderGallery(siteData);
  } else {
    document.querySelectorAll('.gallery-grid').forEach(function(g) {
      g.innerHTML = '<p class="gallery-empty">暂无作品</p>';
    });
  }

  // Scroll reveal after render
  setTimeout(initReveal, 200);
  // Sound bindings after DOM ready
  bindSound();
}

// === 渲染全站内容 ===
function renderSite(site) {
  if (site.name) {
    document.title = site.name + ' — 个人简历';
    var h1 = document.querySelector('header h1');
    if (h1) h1.textContent = site.name;
  }
  if (site.tagline) {
    var hero = document.querySelector('.hero-line');
    if (hero) hero.textContent = site.tagline;
  }
  if (site.avatar) {
    var av = document.querySelector('.avatar img');
    if (av) av.src = site.avatar;
  }

  // About
  if (site.about && site.about.length) {
    var aboutPs = document.querySelectorAll('.about-text p');
    site.about.forEach(function(text, i) {
      if (aboutPs[i]) aboutPs[i].textContent = text;
    });
  }

  // Info list
  if (site.info && site.info.length) {
    var infoList = document.querySelector('.info-list');
    if (infoList) {
      infoList.innerHTML = '';
      site.info.forEach(function(item) {
        var li = document.createElement('li');
        li.innerHTML = '<span>' + item.label + '</span>' + item.value;
        infoList.appendChild(li);
      });
    }
  }

  // Skills
  if (site.skills && site.skills.length) {
    var skillsList = document.querySelector('.skills-list');
    if (skillsList) {
      skillsList.innerHTML = '';
      site.skills.forEach(function(s) {
        var div = document.createElement('div');
        div.className = 'skill';
        div.innerHTML = '<div class="skill-bar"><span>' + s.name + '</span><span>' + s.level + '</span></div>' +
          '<div class="track"><i style="width:' + (s.width || 0) + '%"></i></div>';
        skillsList.appendChild(div);
      });
    }
  }

  // Project cards
  if (site.projects && site.projects.length) {
    var cards = document.querySelector('.cards');
    if (cards) {
      cards.innerHTML = '';
      site.projects.forEach(function(p, i) {
        var a = document.createElement('a');
        a.className = 'card';
        a.href = '#';
        a.innerHTML = '<span class="card-num">' + ('0' + (i + 1)).slice(-2) + '</span>' +
          '<h4>' + p.title + '</h4><p>' + p.desc + '</p><span class="chip">' + p.chip + '</span>';
        cards.appendChild(a);
      });
    }
  }

  // Contact
  if (site.contact) {
    var c = site.contact;
    var intro = document.querySelector('.contact-intro');
    if (intro && c.intro) intro.textContent = c.intro;
    var links = document.querySelector('.contact-links');
    if (links) {
      links.innerHTML = '';
      if (c.email) {
        var a = document.createElement('a');
        a.href = 'mailto:' + c.email; a.textContent = c.email;
        links.appendChild(a);
      }
      if (c.phone) {
        var span = document.createElement('span');
        span.textContent = c.phone;
        links.appendChild(span);
      }
    }
  }

  // Footer
  if (site.footer) {
    var f = site.footer;
    var footerSpans = document.querySelectorAll('footer span');
    if (f.name && footerSpans[0]) footerSpans[0].textContent = f.name;
    if (f.school && footerSpans[1]) footerSpans[1].textContent = f.school;
    if (f.year && footerSpans[2]) footerSpans[2].textContent = f.year;
  }
}

// === 画廊渲染 ===
function buildCard(item, type) {
  var card = document.createElement('a');
  card.className = 'gallery-card';
  card.href = '#';
  card.onclick = function(e) { e.preventDefault(); preview(item); };

  var starHtml = item.featured ? '<span style="position:absolute;top:8px;right:8px;z-index:2;font-size:.8rem">⭐</span>' : '';
  card.innerHTML =
    '<div class="gallery-media">' + starHtml +
      '<img src="' + item.thumbnail + '" alt="' + item.title + '" loading="lazy" />' +
      (type === 'video' ? '<span class="gallery-badge">&#9654;</span>' : '') +
    '</div>' +
    '<div class="gallery-body"><h3>' + item.title + '</h3><p>' + (item.desc || '') + '</p></div>';
  return card;
}

function preview(item) {
  var overlay = document.getElementById('lightbox');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'lightbox';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  }
  var isVideo = /\.(mp4|mov|avi|mkv|webm|flv)/i.test(item.thumbnail);
  overlay.innerHTML =
    '<span class="close-btn" onclick="this.parentElement.remove()">&times;</span>' +
    (isVideo
      ? '<video src="' + item.thumbnail + '" controls autoplay></video>'
      : '<img src="' + item.thumbnail + '" alt="' + item.title + '">') +
    '<p class="lightbox-caption">' + item.title + '</p>';
}

function fillGrid(id, items, type) {
  var grid = document.getElementById(id);
  if (!grid || !items || !items.length) return;
  grid.innerHTML = '';
  var sorted = items.slice().sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
  sorted.forEach(function(item) { grid.appendChild(buildCard(item, type)); });
}

function renderGallery(data) {
  fillGrid('gallery-videos', data.videos, 'video');
  fillGrid('gallery-photos', data.photos, 'photo');
  fillGrid('gallery-creations', data.creations, 'photo');
}

// === 音效绑定 ===
function bindSound() {
  document.querySelectorAll('.nav-links a, .nav-brand').forEach(function(el) {
    el.addEventListener('click', function() { Sound.tick(); });
  });

  document.addEventListener('mouseover', function(e) {
    var card = e.target.closest('.card, .gallery-card');
    if (card && !card.dataset.sounded) {
      card.dataset.sounded = '1';
      Sound.pop();
      setTimeout(function() { delete card.dataset.sounded; }, 300);
    }
  });

  document.addEventListener('click', function(e) {
    var card = e.target.closest('.card');
    if (card) Sound.click();
  });

  var origPreview = preview;
  window.preview = preview = function(item) {
    Sound.open();
    origPreview(item);
  };
}

// === 滚动动画 ===
function initReveal() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('section, .card, .gallery-card').forEach(function(el) {
    if (!el.classList.contains('reveal')) {
      el.classList.add('reveal');
      observer.observe(el);
    }
  });

  // delayed re-scan for async gallery cards
  setTimeout(function() {
    document.querySelectorAll('.gallery-card').forEach(function(el) {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
        observer.observe(el);
      }
    });
  }, 600);
}

// === 启动 ===
loadData();
