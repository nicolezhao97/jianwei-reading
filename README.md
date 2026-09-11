# 见微 · 阅读打卡本（独立 PWA 版）

这是从 Claude Artifact 版本搬出来的独立网页项目，部署后可以在手机上"添加到主屏幕"，
获得接近原生 App 的体验：全屏打开、无浏览器地址栏、离线也能打开界面。

## 和 Claude 版本的两个重要差异

1. **数据存储变了**：Claude 版本的数据存在你的 Claude 账号后台；这个独立版本改用浏览器
   `localStorage`，**只存在这一台设备的这个浏览器里**。换手机、换浏览器、清除网站数据都会丢失。
   如果需要多设备同步，需要自己接一个云数据库（比如 Supabase、Firebase）替换 `src/storage.js`。

2. **AI 功能需要你自己配置**：「问问 AI 的想法」「AI 年度总结」这两个功能在 Claude 里是免密钥
   自动调用的，独立部署后需要你自己申请 API Key，并通过项目自带的后端代理（`api/ai.js`）转发请求，
   密钥不会出现在浏览器代码里。具体步骤见下面「配置 AI 功能」一节。
   没配置之前，这两个按钮点击后会提示"AI 暂时无法回应"，不影响其他功能正常使用。

## 配置 AI 功能（可选）

这一步是可选的——不配置的话，除了 AI 相关的两个按钮，其余功能都能正常使用。

**第一步：申请 Anthropic API Key**

打开 [console.anthropic.com](https://console.anthropic.com)，注册/登录后在 API Keys 页面新建一个密钥，
复制保存好（只会显示一次）。注意这是按用量付费的（需要先在账户里充值一点额度），跟 Claude.ai
订阅是两回事。

**第二步：把密钥配置到部署平台，而不是代码里**

项目里已经包含 `api/ai.js`，是一个 Vercel Serverless Function，部署后会自动变成 `/api/ai` 这个
接口，密钥就存在这个函数的服务器端环境变量里，浏览器永远看不到。

在 Vercel 项目后台：`Settings` → `Environment Variables` → 新增一个变量：

- 名称：`ANTHROPIC_API_KEY`
- 值：你刚才申请到的密钥

保存后重新部署一次（触发一次新的 Deployment）就会生效。

**注意**：因为加了这个后端接口，之前"方式一：把 dist 文件夹拖到网页上传"的部署方式就不够用了
（那种方式只会上传静态文件，`api/ai.js` 不会被识别成接口）。配置 AI 功能后请改用下面
「方式二：连接 GitHub 自动部署」，或者用 Vercel 命令行工具（`npm i -g vercel` 后在项目根目录跑
`vercel`）部署，这两种方式才会把 `api/` 目录一起识别成后端接口。

**本地测试**：单独跑 `npm run dev`（纯 Vite）访问不到 `/api/ai`。想在本地测试 AI 功能，
装一下 Vercel 命令行工具后用 `vercel dev` 启动（它会同时起前端和这个接口），
或者先跳过本地测试、部署上线后直接在网上测。

**如果不用 Vercel，想用别的平台**：思路是一样的——申请密钥、用你选的平台的"函数/Edge Function"
功能写一个转发接口、把 `src/App.jsx` 里 `callClaudeAPI` 请求的地址换成你自己的接口地址。
常见的选择还有 Cloudflare Workers、Netlify Functions，告诉我你想用哪个，我可以照着现在这份
`api/ai.js` 的逻辑帮你改写成对应平台的版本。

## 本地运行

需要先安装 [Node.js](https://nodejs.org/)（建议 18 及以上版本）。

```bash
npm install
npm run dev
```

打开终端提示的本地地址（通常是 `http://localhost:5173`），用手机和电脑连同一个 Wi-Fi，
在手机浏览器打开同一网络下的局域网地址，也可以在手机上预览。

## 部署到网上（推荐用 Vercel，免费）

**方式一：网页拖拽上传（最简单，不需要会写代码）**

```bash
npm run build
```

构建完成后会生成一个 `dist` 文件夹。打开 [vercel.com](https://vercel.com) 注册账号，
新建项目时选择"直接上传文件夹"，把 `dist` 文件夹拖进去，几十秒后就会给你一个可以访问的网址。
Netlify（[netlify.com](https://netlify.com)）的拖拽部署页面（Netlify Drop）用法完全一样。

**方式二：连接 GitHub 自动部署（后续改代码会自动更新）**

1. 把这个项目上传到一个 GitHub 仓库
2. 在 Vercel 或 Netlify 里选择"从 GitHub 导入项目"
3. 构建命令填 `npm run build`，输出目录填 `dist`
4. 以后每次你往 GitHub 推送新代码，网站会自动重新部署

## 手机上安装成"App"

网站部署好、拿到网址后：

- **iPhone（Safari 浏览器）**：打开网址 → 点底部分享按钮 → "添加到主屏幕"
- **安卓（Chrome 浏览器）**：打开网址 → 点右上角菜单（三个点）→ "添加到主屏幕" / "安装应用"

添加后主屏幕会出现"见微"图标，点开就是全屏的独立体验，不再有浏览器界面。

## 如果想进一步打包成真正的 .apk / .ipa 安装包

可以在这个项目基础上接入 [Capacitor](https://capacitorjs.com/)：

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npm install @capacitor/android @capacitor/ios
npx cap add android   # 需要安装 Android Studio
npx cap add ios       # 需要 Mac + Xcode
```

安卓端相对简单，装好 Android Studio 就能出安装包；iOS 端需要 Mac 电脑，如果要上架
App Store 还需要 Apple 开发者账号（每年 99 美元）并通过苹果的审核。这一步工作量较大，
建议先把网页版跑起来、确认体验没问题之后再考虑。

## 目录结构

```
jianwei-pwa/
├── index.html              # 页面入口，引入字体和 PWA 相关 meta
├── vite.config.js          # 构建配置，包含 PWA 插件（自动生成 manifest 和离线缓存）
├── tailwind.config.js
├── postcss.config.js
├── api/
│   └── ai.js                # 后端代理：持有 API Key，转发 AI 请求（Vercel Serverless Function）
├── public/
│   ├── icon-192.png        # App 图标
│   ├── icon-512.png
│   └── icon-512-maskable.png
└── src/
    ├── main.jsx             # 入口文件
    ├── App.jsx               # 见微的全部界面和逻辑（从 Claude Artifact 版本搬过来）
    ├── storage.js            # 模拟 Claude window.storage 接口，实际用 localStorage 存储
    └── index.css             # Tailwind 样式入口
```
