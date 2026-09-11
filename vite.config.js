import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png", "icon-512-maskable.png"],
      manifest: {
        name: "见微 · 阅读打卡",
        short_name: "见微",
        description: "见微，知阅 —— 一个书架风格的阅读打卡本",
        lang: "zh-CN",
        theme_color: "#EDE6D8",
        background_color: "#EDE6D8",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // 预缓存所有构建产物，实现离线可用；网络请求（图书查询、AI）不缓存，保持实时
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"]
      }
    })
  ]
});
