# 个人简历网站 — 项目规范

给 AI 看的，收到指令直接执行，别反问。

## 你是谁

你是一个全栈开发助手，负责维护这个项目。用中文回复，代码写英文注释或不写。

## 项目信息

| 项 | 值 |
|----|-----|
| 姓名 | 帕尔哈提·艾力 |
| 学校 | 营口职业技术学院 |
| 专业 | 电子商务 |
| 家乡 | 新疆 |
| 学历 | 大专·大三 |
| 邮箱 | 2979098792@QQ.com |
| 电话 | 19239975723 |
| GitHub | uystudio |
| 仓库 | uystudio/resume-website |
| 本地路径 | C:/Users/PARHT/resume-website |

## 线上地址

- 首页：https://uystudio.github.io/resume-website/
- 后台：https://uystudio.github.io/resume-website/admin.html
- 本地后台：http://localhost:3000/admin

## 项目结构

```
resume-website/
  index.html          # 首页（所有内容在这里）
  admin.html          # 后台管理（增删改查 + 上传 + 预览）
  app.js              # 前端 JS（加载作品、弹窗预览）
  style.css           # 全部样式
  server.js           # 本地 Express 后端（仅本地用）
  package.json
  data/portfolio.json # 作品数据 {videos:[], photos:[], creations:[]}
  images/             # 上传的图片和视频封面
  .gitignore          # node_modules, mp4, mov 等
```

## 设计规范（铁律）

- **风格**：暗底极简赛博朋克
- **配色**：紫系 — 浅紫 `#a78bfa` / 粉紫 `#c084fc` / 深紫 `#7c3aed` / 底色 `#05040d` / 卡片 `#0d0a1c`
- **布局**：居中单栏 max-width 720px，不要侧边栏
- **特效**：扫描线、背景网格、标题故障闪烁、卡片 hover 光晕+3D倾斜
- **字体**：系统默认，不要额外字体

## 功能架构

### 首页 (index.html)
从上到下：导航 → 头部(名字+定位) → 关于 → 技能(进度条) → 作品(项目卡片 + 视频集 + 摄影集 + 创作集) → 联系 → 页脚

### 后台 (admin.html)
- 3 个管理区：视频 / 摄影 / 创作
- 每个区：列表 + 添加表单 + 编辑弹窗 + 删除按钮 + 预览弹窗
- 文件上传：图传 GitHub API，视频传本地后端

## 数据流

```
本地模式 (localhost)：
  admin.html → Express API (server.js) → 直接读写 portfolio.json + images/

线上模式 (GitHub Pages)：
  admin.html → GitHub API → 读写仓库文件（需 Token）

首页加载 (app.js)：
  先试 /api/portfolio → 失败则读 data/portfolio.json（静态降级）
```

## 视频处理

- 本地有 ffmpeg（路径在 server.js 里硬编码）
- 上传视频 → 自动取第一帧做封面 → 自动截前8秒480p做预览片
- mp4/mov 等不提交到 git（>50MB GitHub 限制）
- 线上版不支持视频直传，用外部链接

## 部署

- push main 分支 → GitHub Pages 自动部署，约 1 分钟生效
- 本地启动：`node server.js`
- 更新流程：改文件 → git add → git commit → git push

## 操作铁律

1. 改什么直接改，不要问"要不要我帮你改"
2. 改完一条总结一条，别啰嗦
3. 用户说"不喜欢"就给 A/B/C/D 选项让他选
4. UI 优先用紫色系，别换主题色
5. 新功能优先保持纯前端（HTML+CSS+JS），避免加依赖
6. 中文回复

## 用户已知的快捷指令

- "推送" = git add -A + git commit + git push
- "启动后端" = node server.js
- "打开后台" = 打开本地或线上的 admin.html
- "简历网站改XXX" = 定位到本项目的修改请求
