const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'portfolio.json');
const UPLOAD_DIR = path.join(__dirname, 'images');

// ffmpeg（本地如有则自动截取视频第一帧）
let FFMPEG = null;
try { require('child_process').execSync('ffmpeg -version', { stdio: 'ignore' }); FFMPEG = 'ffmpeg'; } catch {}

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /\.(jpg|jpeg|png|gif|webp|svg|bmp|mp4|mov|avi|mkv|webm|flv)$/i.test(file.originalname));
  }
});

app.use(express.json());
app.use(express.static(__dirname));

function load() { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2), 'utf-8'); }

// CORS — 允许 GitHub Pages 跨域访问
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 上传文件
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: '请选择文件' });
  const ext = path.extname(req.file.originalname).toLowerCase();
  const isVideo = /\.(mp4|mov|avi|mkv|webm|flv)/.test(ext);
  let thumbPath = 'images/' + req.file.filename;

  if (isVideo && FFMPEG) {
    const thumbName = path.basename(req.file.filename, ext) + '.jpg';
    const outputFile = path.join(UPLOAD_DIR, thumbName);
    try {
      require('child_process').execSync(`ffmpeg -y -i "${req.file.path}" -vframes 1 -q:v 4 "${outputFile}"`, { stdio: 'ignore' });
      thumbPath = 'images/' + thumbName;
    } catch {}
  }

  res.json({ ok: true, path: thumbPath, type: isVideo ? 'video' : 'image' });
});

app.get('/api/portfolio', (_req, res) => res.json(load()));

['videos', 'photos', 'creations'].forEach(cat => {
  app.post('/api/portfolio/' + cat, (req, res) => {
    const data = load();
    (data[cat] || (data[cat] = [])).push(req.body);
    save(data); res.json({ ok: true });
  });
  app.put('/api/portfolio/' + cat + '/:index', (req, res) => {
    const data = load();
    const i = parseInt(req.params.index);
    if (!data[cat] || !data[cat][i]) return res.status(404).json({ ok: false });
    data[cat][i] = req.body;
    save(data); res.json({ ok: true });
  });
  app.delete('/api/portfolio/' + cat + '/:index', (req, res) => {
    const data = load();
    const i = parseInt(req.params.index);
    if (!data[cat] || !data[cat][i]) return res.status(404).json({ ok: false });
    data[cat].splice(i, 1);
    save(data); res.json({ ok: true });
  });
});

app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
