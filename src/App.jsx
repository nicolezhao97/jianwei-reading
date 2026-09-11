import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BookOpen, CalendarDays, PenLine, BarChart3, Plus, X, Flame,
  Star, ChevronLeft, ChevronRight, Trash2, Check, Eraser, ArrowLeft,
  Settings, Search, Share2, ArrowUpDown, Image as ImageIcon, Bell,
  Quote as QuoteIcon, Layers, Download, Copy, Camera, ScanLine,
  Globe, Keyboard, Play, Pause, RotateCcw, Award, Loader2,
  Sparkles, Bot, Moon, Sun, Clock, TrendingUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell
} from "recharts";

/* ---------------------------------------------------------------
   莫兰迪书房配色 Tokens
--------------------------------------------------------------- */
const C = {
  bg: "#EDE6D8",
  panel: "#E1D6C3",
  panelDeep: "#C9B79C",
  card: "#F5EFE4",
  ink: "#453B32",
  inkMuted: "#8C7C68",
  rose: "#B98577",
  roseDim: "#8F675B",
  sage: "#8FA091",
  dustyBlue: "#8B98A6",
  border: "#CBBBA0",
  danger: "#B0685C",
};

const PALETTES = [
  [C.rose, C.sage, C.panelDeep],
  [C.dustyBlue, C.rose, C.panel],
  [C.sage, C.panelDeep, C.card],
  [C.roseDim, C.dustyBlue, C.panel],
  [C.rose, C.dustyBlue, C.panelDeep],
];

// 阅读时长色阶：0 / 1-15 / 16-30 / 31-60 / 60+ 分钟
const DURATION_SCALE = [C.panel, "#EAD9CE", "#D9B7A8", "#C08D79", "#8F5B49"];
function durationBucket(minutes) {
  if (!minutes) return 0;
  if (minutes <= 15) return 1;
  if (minutes <= 30) return 2;
  if (minutes <= 60) return 3;
  return 4;
}
function durationColor(minutes) { return DURATION_SCALE[durationBucket(minutes)]; }

const WEEKDAY_FULL = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
function periodOf(ts) {
  const h = new Date(ts).getHours();
  if (h >= 5 && h < 9) return "清晨";
  if (h >= 9 && h < 12) return "上午";
  if (h >= 12 && h < 17) return "下午";
  if (h >= 17 && h < 19) return "傍晚";
  if (h >= 19 && h < 23) return "晚上";
  return "深夜";
}

const FONTS = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap');
    .font-serif-app { font-family: 'Noto Serif SC', serif; }
    .font-sans-app { font-family: 'Noto Sans SC', sans-serif; }
    * { -webkit-tap-highlight-color: transparent; }
    ::-webkit-scrollbar { width: 0px; height: 0px; }
  `}</style>
);

const todayISO = () => new Date().toISOString().slice(0, 10);
const nowHHMM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const uid = () => Math.random().toString(36).slice(2, 10);
function chunk(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }

/* ---------------------------------------------------------------
   生成式封面插画（无官方封面时使用）
--------------------------------------------------------------- */
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function BookCoverArt({ seed, size = 64 }) {
  const h = hashStr(seed || "book");
  const pal = PALETTES[h % PALETTES.length];
  const shapeType = h % 4;
  const rot = (h % 20) - 10;
  const cx = 40 + ((h >> 3) % 20);
  const cy = 30 + ((h >> 5) % 15);
  const r = 12 + ((h >> 7) % 14);
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 80 112" style={{ borderRadius: 3, flexShrink: 0 }}>
      <rect x="0" y="0" width="80" height="112" fill={pal[2]} />
      {shapeType === 0 && <circle cx={cx} cy={cy} r={r} fill={pal[0]} opacity="0.88" />}
      {shapeType === 1 && <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={pal[0]} opacity="0.88" transform={`rotate(${rot} ${cx} ${cy})`} />}
      {shapeType === 2 && <polygon points={`${cx},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}`} fill={pal[0]} opacity="0.88" />}
      {shapeType === 3 && <path d={`M ${cx - r} ${cy} Q ${cx} ${cy - r * 1.6} ${cx + r} ${cy} Q ${cx} ${cy + r * 1.6} ${cx - r} ${cy} Z`} fill={pal[0]} opacity="0.88" />}
      <path d={`M 8 ${70 + (h % 20)} Q 40 ${55 + (h % 15)} 72 ${75 + (h % 10)}`} stroke={pal[1]} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      <line x1="0" y1="0" x2="0" y2="112" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
      <rect x="0" y="0" width="80" height="112" fill="none" stroke="rgba(0,0,0,0.12)" />
    </svg>
  );
}

function BookCover({ book, size = 64 }) {
  if (book?.coverImage) {
    return (
      <img src={book.coverImage} alt="" onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
        style={{ width: size, height: size * 1.4, objectFit: "cover", borderRadius: 3, flexShrink: 0, border: `1px solid ${C.border}`, boxShadow: "1px 0 2px rgba(0,0,0,0.15)" }} />
    );
  }
  return <BookCoverArt seed={book?.title} size={size} />;
}

/* ---------------------------------------------------------------
   木质书架元素
--------------------------------------------------------------- */
function ShelfLedge() {
  return (
    <div style={{
      height: 12, marginTop: -2, borderRadius: "0 0 5px 5px",
      background: `linear-gradient(180deg, ${C.panelDeep} 0%, ${C.panel} 55%, ${C.panelDeep} 100%)`,
      boxShadow: "inset 0 2px 3px rgba(0,0,0,0.18), 0 2px 3px rgba(0,0,0,0.1)",
    }} />
  );
}

function EmptyLamp({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
        <path d="M44 12 L60 34 H28 Z" stroke={C.rose} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
        <line x1="44" y1="34" x2="44" y2="58" stroke={C.inkMuted} strokeWidth="2.5" />
        <path d="M28 58 Q44 70 60 58" stroke={C.inkMuted} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <line x1="20" y1="76" x2="68" y2="76" stroke={C.border} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="44" cy="20" r="3" fill={C.rose} opacity="0.6" />
      </svg>
      <p className="font-sans-app text-sm" style={{ color: C.inkMuted }}>{label}</p>
    </div>
  );
}
function EmptyBooks({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <svg width="96" height="72" viewBox="0 0 96 72" fill="none">
        <rect x="8" y="16" width="14" height="48" rx="1.5" fill={C.sage} opacity="0.85" transform="rotate(-6 15 40)" />
        <rect x="26" y="10" width="16" height="54" rx="1.5" fill={C.rose} opacity="0.9" />
        <rect x="46" y="18" width="14" height="46" rx="1.5" fill={C.card} stroke={C.border} />
        <rect x="64" y="8" width="16" height="56" rx="1.5" fill={C.roseDim} transform="rotate(5 72 36)" />
      </svg>
      <p className="font-sans-app text-sm" style={{ color: C.inkMuted }}>{label}</p>
    </div>
  );
}
function EmptyQuotes({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <QuoteIcon size={40} color={C.inkMuted} strokeWidth={1.5} />
      <p className="font-sans-app text-sm" style={{ color: C.inkMuted }}>{label}</p>
    </div>
  );
}

/* ---------------------------------------------------------------
   涂鸦画板
--------------------------------------------------------------- */
function DoodlePad({ value, onChange }) {
  const svgRef = useRef(null);
  const [paths, setPaths] = useState(value || []);
  const [current, setCurrent] = useState(null);
  const drawing = useRef(false);
  useEffect(() => { setPaths(value || []); }, [value]);
  const getPoint = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return [Math.round(((cx - rect.left) / rect.width) * 200), Math.round(((cy - rect.top) / rect.height) * 120)];
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; setCurrent([getPoint(e)]); };
  const move = (e) => { if (!drawing.current) return; e.preventDefault(); setCurrent((c) => (c ? [...c, getPoint(e)] : [getPoint(e)])); };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setCurrent((c) => { if (c && c.length > 1) { const next = [...paths, c]; setPaths(next); onChange && onChange(next); } return null; });
  };
  const toD = (pts) => (pts.length ? "M " + pts.map((p) => p.join(",")).join(" L ") : "");
  const clear = () => { setPaths([]); onChange && onChange([]); };
  return (
    <div>
      <svg ref={svgRef} viewBox="0 0 200 120" className="w-full touch-none select-none"
        style={{ background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, height: 140 }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}>
        {paths.map((p, i) => <path key={i} d={toD(p)} stroke={C.rose} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
        {current && <path d={toD(current)} stroke={C.rose} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {paths.length === 0 && !current && <text x="100" y="64" textAnchor="middle" fill={C.inkMuted} fontSize="10" fontFamily="Noto Sans SC">画一笔今天的心情（可选）</text>}
      </svg>
      {paths.length > 0 && <button onClick={clear} className="mt-2 flex items-center gap-1 text-xs font-sans-app" style={{ color: C.inkMuted }}><Eraser size={13} /> 清除涂鸦</button>}
    </div>
  );
}
function MiniDoodle({ paths, size = 40 }) {
  if (!paths || paths.length === 0) return null;
  const toD = (pts) => (pts.length ? "M " + pts.map((p) => p.join(",")).join(" L ") : "");
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 200 120" style={{ background: C.card, borderRadius: 6, flexShrink: 0 }}>
      {paths.map((p, i) => <path key={i} d={toD(p)} stroke={C.rose} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
  );
}

/* ---------------------------------------------------------------
   本地存储
--------------------------------------------------------------- */
const STORAGE_KEY = "reading-data-v4-zh";
const DEFAULT_DATA = {
  books: [],
  checkins: [],
  shelves: [],
  goals: { yearlyBooks: 20, dailyPages: 20, dailyMinutes: 20, reminderEnabled: false, reminderTime: "20:00" },
  badges: [],
  aiYearSummary: null,
};
async function loadData() {
  try {
    const res = await window.storage.get(STORAGE_KEY, false);
    if (res && res.value) {
      const p = JSON.parse(res.value);
      return { ...DEFAULT_DATA, ...p, goals: { ...DEFAULT_DATA.goals, ...(p.goals || {}) }, badges: p.badges || [], aiYearSummary: p.aiYearSummary || null };
    }
  } catch (e) {}
  return DEFAULT_DATA;
}
async function saveData(data) { try { await window.storage.set(STORAGE_KEY, JSON.stringify(data), false); } catch (e) {} }
function fileToDataURL(file) {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
}

/* ---------------------------------------------------------------
   网络查书（谷歌图书 API 为主，Open Library 为备用，均公开可用无需密钥）
--------------------------------------------------------------- */
async function searchGoogleBooks(query) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.items || []).map((it) => {
    const v = it.volumeInfo || {};
    const cover = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || null;
    return {
      title: v.title || "未知书名",
      author: (v.authors || []).join("、"),
      genre: (v.categories || [])[0] || "",
      totalPages: v.pageCount || 0,
      coverImage: cover ? cover.replace("http://", "https://") : null,
      isbn: (v.industryIdentifiers || []).find((x) => x.type.includes("ISBN"))?.identifier || "",
      source: "谷歌图书",
    };
  });
}
async function searchOpenLibraryQuery(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.docs || []).map((d) => ({
    title: d.title || "未知书名",
    author: (d.author_name || []).join("、"),
    genre: (d.subject || [])[0] || "",
    totalPages: d.number_of_pages_median || 0,
    coverImage: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
    isbn: (d.isbn || [])[0] || "",
    source: "Open Library",
  }));
}
async function searchOpenLibraryByISBN(isbn) {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const d = json[`ISBN:${isbn}`];
  if (!d) return null;
  return {
    title: d.title || "未知书名",
    author: (d.authors || []).map((a) => a.name).join("、"),
    genre: (d.subjects || [])[0]?.name || "",
    totalPages: d.number_of_pages || 0,
    coverImage: d.cover?.medium || d.cover?.large || null,
    isbn,
    source: "Open Library",
  };
}
async function searchBooksOnline(query) {
  let results = [];
  try { results = await searchGoogleBooks(query); } catch (e) {}
  if (!results.length) { try { results = await searchOpenLibraryQuery(query); } catch (e) {} }
  return results;
}
async function searchByISBN(isbn) {
  try { const g = await searchGoogleBooks(`isbn:${isbn}`); if (g[0]) return g[0]; } catch (e) {}
  try { const o = await searchOpenLibraryByISBN(isbn); if (o) return o; } catch (e) {}
  return null;
}

/* ---------------------------------------------------------------
   条形码识别（若浏览器支持 BarcodeDetector）
--------------------------------------------------------------- */
async function detectBarcodeFromFile(file) {
  if (!("BarcodeDetector" in window)) return null;
  try {
    const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
    const bitmap = await createImageBitmap(file);
    const results = await detector.detect(bitmap);
    return results[0]?.rawValue || null;
  } catch (e) { return null; }
}

/* ---------------------------------------------------------------
   拍照识别文字（动态加载 Tesseract.js，失败则回退手动输入）
--------------------------------------------------------------- */
function loadTesseract() {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) return resolve(window.Tesseract);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.4/tesseract.min.js";
    s.onload = () => resolve(window.Tesseract);
    s.onerror = () => reject(new Error("加载识别引擎失败"));
    document.head.appendChild(s);
  });
}
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("超时")), ms))]);
}
async function recognizeText(dataUrl, onStatus) {
  const Tesseract = await withTimeout(loadTesseract(), 15000);
  onStatus && onStatus("正在识别文字…");
  const result = await withTimeout(
    Tesseract.recognize(dataUrl, "chi_sim+eng", { logger: () => {} }),
    45000
  );
  return (result.data.text || "").trim();
}

/* ---------------------------------------------------------------
   AI 助手（调用 Anthropic API）
--------------------------------------------------------------- */
// 通过自己的后端代理（见 /api/ai.js）调用 AI，密钥不会出现在浏览器代码里。
// 本地用 `npm run dev`（纯 Vite）时这个接口不存在，请改用 `vercel dev` 本地调试，
// 或部署到 Vercel 后在线上测试。请求失败时界面会走已有的 aiError 提示，不会白屏。
async function callClaudeAPI(prompt) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error("AI 请求失败");
  const data = await res.json();
  return (data.text || "").trim();
}

/* ---------------------------------------------------------------
   通用组件
--------------------------------------------------------------- */
function TopBar({ title, right, onBack }) {
  return (
    <div className="flex items-center justify-between px-5 pt-6 pb-4">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && <button onClick={onBack} className="mr-1 flex-shrink-0" style={{ color: C.inkMuted }}><ArrowLeft size={20} /></button>}
        <h1 className="font-serif-app text-2xl truncate" style={{ color: C.ink }}>{title}</h1>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">{right}</div>
    </div>
  );
}
function Divider() {
  return (
    <svg width="100%" height="6" viewBox="0 0 300 6" preserveAspectRatio="none" style={{ display: "block" }}>
      <path d="M0 3 Q75 0 150 3 T300 3" stroke={C.border} strokeWidth="1" fill="none" />
    </svg>
  );
}
function Pill({ children, active, onClick, color }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-sans-app font-medium whitespace-nowrap"
      style={{ background: active ? (color || C.rose) : "transparent", color: active ? C.card : C.inkMuted, border: `1px solid ${active ? (color || C.rose) : C.border}` }}>
      {children}
    </button>
  );
}
function IconBtn({ onClick, children }) {
  return <button onClick={onClick} className="p-2 rounded-full" style={{ background: C.panel, border: `1px solid ${C.border}` }}>{children}</button>;
}
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2"><Icon size={14} color={C.inkMuted} /><span className="font-sans-app text-xs" style={{ color: C.inkMuted }}>{label}</span></div>
      <span className="font-sans-app text-xs font-semibold text-right" style={{ color: C.ink, maxWidth: "55%" }}>{value}</span>
    </div>
  );
}

/* ---------------------------------------------------------------
   心情选项（可爱风格）
--------------------------------------------------------------- */
const MOODS = [
  { k: "great", e: "🌟", zh: "超棒", tint: "#F3E4C6" },
  { k: "good", e: "😊", zh: "不错", tint: "#E7DFCB" },
  { k: "calm", e: "😌", zh: "平静", tint: "#DCE3D6" },
  { k: "slow", e: "🐢", zh: "较慢", tint: "#D7DFDB" },
  { k: "sleepy", e: "😪", zh: "犯困", tint: "#DED7CC" },
  { k: "stuck", e: "😩", zh: "卡住", tint: "#E9D3CC" },
];
function MoodPicker({ mood, setMood }) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-2 mb-4">
      {MOODS.map((m) => (
        <button key={m.k} onClick={() => setMood(m.k)} className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl"
          style={{ background: m.tint, border: `2px solid ${mood === m.k ? C.rose : "transparent"}`, transform: mood === m.k ? "scale(1.04)" : "scale(1)", transition: "transform 0.15s" }}>
          <span className="text-2xl">{m.e}</span>
          <span className="font-sans-app text-[10px]" style={{ color: C.ink }}>{m.zh}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------
   连续打卡 & 成就徽章
--------------------------------------------------------------- */
function computeStreak(checkins) {
  const dates = new Set(checkins.map((c) => c.date));
  let streak = 0, d = new Date();
  while (true) { const iso = d.toISOString().slice(0, 10); if (dates.has(iso)) { streak++; d.setDate(d.getDate() - 1); } else break; }
  return streak;
}
function longestStreakOf(checkins) {
  const dates = [...new Set(checkins.map((c) => c.date))].sort();
  let best = 0, cur = 0, prev = null;
  for (const d of dates) {
    if (prev) { const diff = (new Date(d) - new Date(prev)) / 86400000; cur = diff === 1 ? cur + 1 : 1; } else cur = 1;
    best = Math.max(best, cur); prev = d;
  }
  return best;
}
const MILESTONES = [
  { days: 3, label: "连续 3 天" },
  { days: 7, label: "连续一周" },
  { days: 14, label: "连续 14 天" },
  { days: 30, label: "连续一月" },
  { days: 100, label: "连续百天" },
  { days: 365, label: "连续一年" },
];

function BadgeRow({ badges }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {MILESTONES.map((m) => {
        const earned = badges.includes(m.days);
        return (
          <div key={m.days} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ opacity: earned ? 1 : 0.35, width: 58 }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: earned ? C.rose : C.panel, border: `1px solid ${earned ? C.rose : C.border}` }}>
              <Award size={17} color={earned ? C.card : C.inkMuted} />
            </div>
            <span className="font-sans-app text-[9px] text-center leading-tight" style={{ color: C.inkMuted }}>{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function CelebrationModal({ milestone, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-8" style={{ background: "rgba(69,59,50,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-xs rounded-3xl p-7 text-center" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: C.rose }}>
          <Award size={30} color={C.card} />
        </div>
        <h2 className="font-serif-app text-xl mb-1" style={{ color: C.ink }}>{milestone.label}达成！</h2>
        <p className="font-sans-app text-sm mb-5" style={{ color: C.inkMuted }}>坚持是最好的阅读习惯，继续保持吧。</p>
        <button onClick={onClose} className="w-full py-3 rounded-xl font-sans-app font-semibold text-sm" style={{ background: C.rose, color: C.card }}>太棒了</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   设置：目标与提醒
--------------------------------------------------------------- */
function SettingsSheet({ goals, onClose, onSave }) {
  const [yearlyBooks, setYearlyBooks] = useState(goals.yearlyBooks);
  const [dailyPages, setDailyPages] = useState(goals.dailyPages);
  const [dailyMinutes, setDailyMinutes] = useState(goals.dailyMinutes);
  const [reminderEnabled, setReminderEnabled] = useState(goals.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(goals.reminderTime);
  const [notice, setNotice] = useState("");

  const toggleReminder = async () => {
    const next = !reminderEnabled;
    setReminderEnabled(next);
    if (next && typeof Notification !== "undefined") {
      try {
        const perm = await Notification.requestPermission();
        setNotice(perm === "granted" ? "浏览器通知已开启。" : "仅支持应用内提醒——浏览器未授权推送通知。");
      } catch (e) { setNotice("当前环境仅支持应用内提醒。"); }
    } else setNotice("");
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: "rgba(69,59,50,0.5)" }}>
      <div className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-8" style={{ background: C.card, maxHeight: "85%", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif-app text-xl" style={{ color: C.ink }}>目标与提醒</h2>
          <button onClick={onClose}><X size={20} color={C.inkMuted} /></button>
        </div>
        <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>本年阅读目标（本）</label>
        <input type="number" value={yearlyBooks} onChange={(e) => setYearlyBooks(Number(e.target.value) || 0)}
          className="w-full mt-1.5 mb-4 px-4 py-2.5 rounded-xl font-sans-app text-sm outline-none" style={{ background: C.panel, color: C.ink, border: `1px solid ${C.border}` }} />
        <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>每日阅读页数目标</label>
        <input type="number" value={dailyPages} onChange={(e) => setDailyPages(Number(e.target.value) || 0)}
          className="w-full mt-1.5 mb-4 px-4 py-2.5 rounded-xl font-sans-app text-sm outline-none" style={{ background: C.panel, color: C.ink, border: `1px solid ${C.border}` }} />
        <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>每日阅读时长目标（分钟）</label>
        <input type="number" value={dailyMinutes} onChange={(e) => setDailyMinutes(Number(e.target.value) || 0)}
          className="w-full mt-1.5 mb-5 px-4 py-2.5 rounded-xl font-sans-app text-sm outline-none" style={{ background: C.panel, color: C.ink, border: `1px solid ${C.border}` }} />
        <Divider />
        <div className="flex items-center justify-between mt-5 mb-2">
          <div className="flex items-center gap-2"><Bell size={16} color={C.inkMuted} /><span className="font-sans-app text-sm" style={{ color: C.ink }}>每日阅读提醒</span></div>
          <button onClick={toggleReminder} className="w-11 h-6 rounded-full relative transition-colors" style={{ background: reminderEnabled ? C.rose : C.border }}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: reminderEnabled ? 22 : 2 }} />
          </button>
        </div>
        {reminderEnabled && (
          <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)}
            className="w-full mt-2 mb-2 px-4 py-2.5 rounded-xl font-sans-app text-sm outline-none" style={{ background: C.panel, color: C.ink, border: `1px solid ${C.border}` }} />
        )}
        {notice && <p className="font-sans-app text-xs mb-2" style={{ color: C.inkMuted }}>{notice}</p>}
        <p className="font-sans-app text-xs mb-5" style={{ color: C.inkMuted }}>提醒仅在应用开启时显示。后台推送通知需要安装原生应用，当前网页预览暂不支持。</p>
        <button onClick={() => onSave({ yearlyBooks, dailyPages, dailyMinutes, reminderEnabled, reminderTime })}
          className="w-full py-3.5 rounded-xl font-sans-app font-semibold text-sm" style={{ background: C.rose, color: C.card }}>保存</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   阅读计时器
--------------------------------------------------------------- */
function ReadingTimer({ onLogMinutes }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const finish = () => {
    const minutes = Math.round(seconds / 60);
    if (minutes > 0) onLogMinutes(minutes);
    setSeconds(0); setRunning(false);
  };
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl mb-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.panel }}>
          <span style={{ color: C.rose }}>⏱</span>
        </div>
        <div>
          <p className="font-serif-app text-lg leading-none" style={{ color: C.ink }}>{mm}:{ss}</p>
          <p className="font-sans-app text-[10px] mt-1" style={{ color: C.inkMuted }}>阅读计时</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setRunning((r) => !r)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.rose }}>
          {running ? <Pause size={15} color={C.card} /> : <Play size={15} color={C.card} />}
        </button>
        {seconds > 0 && (
          <button onClick={finish} className="px-3 py-2 rounded-lg font-sans-app text-xs font-semibold" style={{ background: C.sage, color: C.card }}>记录</button>
        )}
        {seconds > 0 && !running && (
          <button onClick={() => setSeconds(0)}><RotateCcw size={15} color={C.inkMuted} /></button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   今日打卡
--------------------------------------------------------------- */
function TodayScreen({ data, setData }) {
  const activeBooks = data.books.filter((b) => b.status === "reading");
  const [bookId, setBookId] = useState(activeBooks[0]?.id || "");
  const [pages, setPages] = useState("");
  const [note, setNote] = useState("");
  const [mood, setMood] = useState("good");
  const [doodle, setDoodle] = useState([]);
  const [saved, setSaved] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [celebrate, setCelebrate] = useState(null);
  const [ocrStatus, setOcrStatus] = useState("idle"); // idle | loading | error
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => { if (!bookId && activeBooks.length) setBookId(activeBooks[0].id); }, [data.books]);

  const alreadyToday = data.checkins.find((c) => c.date === todayISO());
  const streak = computeStreak(data.checkins);
  const goals = data.goals;
  const currentBook = data.books.find((b) => b.id === bookId);
  const todaysPages = data.checkins.filter((c) => c.date === todayISO()).reduce((s, c) => s + (c.pages || 0), 0);
  const todaysMinutes = data.checkins.filter((c) => c.date === todayISO()).reduce((s, c) => s + (c.minutes || 0), 0);
  const pagesGoalPct = goals.dailyPages ? Math.min(100, Math.round((todaysPages / goals.dailyPages) * 100)) : 0;
  const minutesGoalPct = goals.dailyMinutes ? Math.min(100, Math.round((todaysMinutes / goals.dailyMinutes) * 100)) : 0;
  const showReminder = goals.reminderEnabled && !alreadyToday && nowHHMM() >= goals.reminderTime;

  const handlePhotoOCR = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrStatus("loading");
    try {
      const dataUrl = await fileToDataURL(file);
      const text = await recognizeText(dataUrl);
      setNote((n) => (n ? n + "\n" + text : text));
      setOcrStatus("idle");
    } catch (err) {
      setOcrStatus("error");
      setTimeout(() => setOcrStatus("idle"), 3000);
    }
  };

  const askAI = async () => {
    if (!note.trim()) return;
    setAiLoading(true); setAiError(false); setAiReply("");
    const moodZh = MOODS.find((m) => m.k === mood)?.zh || "";
    const prompt = `你是一位温暖、有文学洞察力的读书伙伴。用户正在读《${currentBook?.title || "一本书"}》，今天记下："${note.trim()}"，当时的心情是"${moodZh}"。请用简体中文写2-3句简短回应，帮助用户理解这种感受，或从阅读角度给一点启发。语气亲切自然、不说教，不要用列表或标题，只写一段连贯的话。`;
    try { const reply = await callClaudeAPI(prompt); setAiReply(reply); }
    catch (e) { setAiError(true); }
    finally { setAiLoading(false); }
  };

  // 计时器"记录"按钮：立即写入今天的打卡记录，不等最终保存
  const logTimerMinutes = (mins) => {
    if (!bookId) return;
    const today = todayISO();
    const existing = data.checkins.find((c) => c.date === today && c.bookId === bookId);
    let nextCheckins;
    if (existing) {
      nextCheckins = data.checkins.map((c) => (c === existing ? { ...c, minutes: (c.minutes || 0) + mins } : c));
    } else {
      nextCheckins = [{ id: uid(), date: today, createdAt: Date.now(), bookId, pages: 0, minutes: mins, note: "", mood: "good", doodle: [] }, ...data.checkins];
    }
    const next = { ...data, checkins: nextCheckins };
    setData(next); saveData(next);
  };

  const handleSave = () => {
    if (!bookId) return;
    const prevStreak = computeStreak(data.checkins);
    const today = todayISO();
    const existing = data.checkins.find((c) => c.date === today && c.bookId === bookId);
    const entry = {
      id: existing?.id || uid(),
      date: today,
      createdAt: existing?.createdAt || Date.now(),
      bookId,
      pages: Number(pages) || 0,
      minutes: existing?.minutes || 0,
      note,
      mood,
      doodle,
      aiReflection: aiReply || existing?.aiReflection,
    };
    const nextCheckins = [entry, ...data.checkins.filter((c) => !(c.date === today && c.bookId === bookId))];
    const nextBooks = data.books.map((b) => b.id === bookId ? { ...b, currentPage: Math.min(b.totalPages || 99999, (b.currentPage || 0) + (Number(pages) || 0)) } : b);
    const newStreak = computeStreak(nextCheckins);
    let nextBadges = data.badges;
    const hit = MILESTONES.filter((m) => prevStreak < m.days && newStreak >= m.days && !data.badges.includes(m.days)).sort((a, b) => b.days - a.days)[0];
    if (hit) { nextBadges = [...data.badges, hit.days]; setCelebrate(hit); }
    const next = { ...data, checkins: nextCheckins, books: nextBooks, badges: nextBadges };
    setData(next); saveData(next);
    setSaved(true); setTimeout(() => setSaved(false), 1600);
    setPages(""); setNote(""); setAiReply(""); setAiError(false);
  };
  const saveGoals = (g) => { const next = { ...data, goals: g }; setData(next); saveData(next); setShowSettings(false); };

  return (
    <div>
      <TopBar title="今日打卡" right={
        <>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: C.panel }}>
            <Flame size={15} color={C.rose} /><span className="font-sans-app text-sm font-semibold" style={{ color: C.ink }}>{streak}</span>
          </div>
          <IconBtn onClick={() => setShowSettings(true)}><Settings size={16} color={C.inkMuted} /></IconBtn>
        </>
      } />
      <div className="px-5">
        <p className="font-sans-app text-xs mb-3" style={{ color: C.inkMuted }}>
          {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
        </p>

        {showReminder && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4" style={{ background: C.panel, border: `1px solid ${C.roseDim}` }}>
            <Bell size={15} color={C.rose} /><p className="font-sans-app text-xs" style={{ color: C.ink }}>今天还没打卡哦，读几页保持连续记录吧。</p>
          </div>
        )}

        {(goals.dailyPages > 0 || goals.dailyMinutes > 0) && (
          <div className="mb-5 flex gap-3">
            {goals.dailyPages > 0 && (
              <div className="flex-1">
                <div className="flex justify-between mb-1.5"><span className="font-sans-app text-[11px]" style={{ color: C.inkMuted }}>页数目标</span><span className="font-sans-app text-[11px] font-semibold" style={{ color: C.rose }}>{todaysPages}/{goals.dailyPages}</span></div>
                <div className="w-full h-2 rounded-full" style={{ background: C.panel }}><div className="h-2 rounded-full" style={{ width: `${pagesGoalPct}%`, background: C.rose }} /></div>
              </div>
            )}
            {goals.dailyMinutes > 0 && (
              <div className="flex-1">
                <div className="flex justify-between mb-1.5"><span className="font-sans-app text-[11px]" style={{ color: C.inkMuted }}>时长目标</span><span className="font-sans-app text-[11px] font-semibold" style={{ color: C.sage }}>{todaysMinutes}/{goals.dailyMinutes}分</span></div>
                <div className="w-full h-2 rounded-full" style={{ background: C.panel }}><div className="h-2 rounded-full" style={{ width: `${minutesGoalPct}%`, background: C.sage }} /></div>
              </div>
            )}
          </div>
        )}

        {activeBooks.length === 0 ? (
          <EmptyLamp label="先在「书架」中添加一本在读的书吧" />
        ) : (
          <>
            <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>在读书籍</label>
            <div className="flex gap-2 overflow-x-auto pb-1 mt-2 mb-5">
              {activeBooks.map((b) => (
                <button key={b.id} onClick={() => setBookId(b.id)} className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ opacity: bookId === b.id ? 1 : 0.4 }}>
                  <div style={{ boxShadow: bookId === b.id ? `0 0 0 2px ${C.rose}` : "none", borderRadius: 3 }}><BookCover book={b} size={48} /></div>
                  <span className="font-sans-app text-[10px] w-14 truncate text-center" style={{ color: C.ink }}>{b.title}</span>
                </button>
              ))}
            </div>

            <ReadingTimer onLogMinutes={logTimerMinutes} />

            <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>今天读了多少页</label>
            <input type="number" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="0"
              className="w-full mt-2 mb-4 px-4 py-3 rounded-xl font-sans-app text-lg outline-none" style={{ background: C.card, color: C.ink, border: `1px solid ${C.border}` }} />

            <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>今天感觉如何</label>
            <MoodPicker mood={mood} setMood={setMood} />

            <div className="flex items-center justify-between mb-2">
              <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>值得记下的一段话</label>
              <button onClick={() => photoInputRef.current?.click()} className="flex items-center gap-1 font-sans-app text-[11px]" style={{ color: C.rose }}>
                {ocrStatus === "loading" ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                {ocrStatus === "loading" ? "识别中…" : "拍照识别文字"}
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoOCR} />
            </div>
            {ocrStatus === "error" && <p className="font-sans-app text-[11px] mb-1.5" style={{ color: C.danger }}>识别失败，可直接手动输入文字。</p>}
            <textarea value={note} onChange={(e) => { setNote(e.target.value); setAiReply(""); }} placeholder="一句话、一个金句、一点感想…" rows={3}
              className="w-full mb-2 px-4 py-3 rounded-xl font-sans-app text-sm outline-none resize-none" style={{ background: C.card, color: C.ink, border: `1px solid ${C.border}` }} />

            <button onClick={askAI} disabled={!note.trim() || aiLoading} className="flex items-center gap-1.5 font-sans-app text-[11px] mb-3" style={{ color: note.trim() ? C.rose : C.inkMuted }}>
              {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {aiLoading ? "AI 思考中…" : "问问 AI 的想法"}
            </button>
            {aiError && <p className="font-sans-app text-[11px] mb-3" style={{ color: C.danger }}>AI 暂时无法回应，请稍后再试。</p>}
            {aiReply && (
              <div className="flex gap-2 p-3 rounded-xl mb-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <Bot size={14} color={C.rose} style={{ flexShrink: 0, marginTop: 2 }} />
                <p className="font-sans-app text-xs leading-relaxed" style={{ color: C.ink }}>{aiReply}</p>
              </div>
            )}

            <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>涂鸦</label>
            <div className="mt-2 mb-5"><DoodlePad value={doodle} onChange={setDoodle} /></div>

            <button onClick={handleSave} className="w-full py-3.5 rounded-xl font-sans-app font-semibold text-sm flex items-center justify-center gap-2" style={{ background: C.rose, color: C.card }}>
              {saved ? <><Check size={16} /> 已保存</> : alreadyToday ? "更新今日打卡" : "保存打卡"}
            </button>
          </>
        )}
      </div>
      {showSettings && <SettingsSheet goals={goals} onClose={() => setShowSettings(false)} onSave={saveGoals} />}
      {celebrate && <CelebrationModal milestone={celebrate} onClose={() => setCelebrate(null)} />}
    </div>
  );
}

/* ---------------------------------------------------------------
   书架（图书管理）
--------------------------------------------------------------- */
const STATUSES = [
  { k: "reading", label: "在读" },
  { k: "toread", label: "想读" },
  { k: "finished", label: "读完" },
  { k: "paused", label: "暂停" },
  { k: "dropped", label: "弃读", color: C.danger },
];
const SORTS = [
  { k: "added", label: "最近添加" },
  { k: "title", label: "书名 A-Z" },
  { k: "author", label: "作者 A-Z" },
  { k: "rating", label: "评分" },
];
const GENRES = [
  "文学小说", "心理与自我", "历史与文明", "社会与人文", "哲学与思想",
  "商业与经济", "科学与自然", "艺术与设计", "生活与兴趣", "人物与传记",
  "学习与教育", "其他/综合",
];

function CoverPicker({ value, onChange }) {
  const inputRef = useRef(null);
  return (
    <div className="flex items-center gap-3 mb-3">
      <div style={{ width: 56, height: 78 }} className="rounded overflow-hidden flex items-center justify-center">
        {value ? <img src={value} alt="" style={{ width: 56, height: 78, objectFit: "cover" }} /> : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: C.panel, border: `1px dashed ${C.border}`, borderRadius: 4 }}><ImageIcon size={18} color={C.inkMuted} /></div>
        )}
      </div>
      <div>
        <button onClick={() => inputRef.current?.click()} className="font-sans-app text-xs px-3 py-2 rounded-lg" style={{ background: C.panel, color: C.ink, border: `1px solid ${C.border}` }}>
          {value ? "更换封面" : "上传封面照片"}
        </button>
        {value && <button onClick={() => onChange(null)} className="font-sans-app text-xs ml-2" style={{ color: C.inkMuted }}>移除</button>}
        <p className="font-sans-app text-[10px] mt-1" style={{ color: C.inkMuted }}>未设置时将使用生成插画封面</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) onChange(await fileToDataURL(f)); }} />
    </div>
  );
}

function BookForm({ shelves, initial, onSave, onCreateShelf }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [author, setAuthor] = useState(initial?.author || "");
  const [genre, setGenre] = useState(initial?.genre || "");
  const [totalPages, setTotalPages] = useState(initial?.totalPages || "");
  const [status, setStatus] = useState(initial?.status || "toread");
  const [coverImage, setCoverImage] = useState(initial?.coverImage || null);
  const [shelfIds, setShelfIds] = useState(initial?.shelfIds || []);
  const [newShelf, setNewShelf] = useState("");
  const toggleShelf = (id) => setShelfIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const genreOptions = genre && !GENRES.includes(genre) ? [genre, ...GENRES] : GENRES;

  return (
    <div>
      <CoverPicker value={coverImage} onChange={setCoverImage} />
      {[["书名", title, setTitle, "text"], ["作者", author, setAuthor, "text"], ["总页数", totalPages, setTotalPages, "number"]].map(([label, val, set, type]) => (
        <div key={label} className="mb-3">
          <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>{label}</label>
          <input type={type} value={val} onChange={(e) => set(e.target.value)} className="w-full mt-1.5 px-4 py-2.5 rounded-xl font-sans-app text-sm outline-none" style={{ background: C.panel, color: C.ink, border: `1px solid ${C.border}` }} />
        </div>
      ))}
      <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>分类/类型</label>
      <div className="flex gap-2 mt-1.5 mb-4 flex-wrap">
        {genreOptions.map((g) => <Pill key={g} color={C.dustyBlue} active={genre === g} onClick={() => setGenre(genre === g ? "" : g)}>{g}</Pill>)}
      </div>
      <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>状态</label>
      <div className="flex gap-2 mt-1.5 mb-4 flex-wrap">{STATUSES.map((s) => <Pill key={s.k} color={s.color} active={status === s.k} onClick={() => setStatus(s.k)}>{s.label}</Pill>)}</div>
      <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>书单</label>
      <div className="flex gap-2 mt-1.5 mb-2 flex-wrap items-center">{shelves.map((s) => <Pill key={s.id} color={C.sage} active={shelfIds.includes(s.id)} onClick={() => toggleShelf(s.id)}>{s.name}</Pill>)}</div>
      <div className="flex gap-2 mb-5">
        <input value={newShelf} onChange={(e) => setNewShelf(e.target.value)} placeholder="新建书单名称" className="flex-1 px-3 py-2 rounded-lg font-sans-app text-xs outline-none" style={{ background: C.panel, color: C.ink, border: `1px solid ${C.border}` }} />
        <button onClick={() => { if (newShelf.trim()) { onCreateShelf(newShelf.trim()); setNewShelf(""); } }} className="px-3 py-2 rounded-lg font-sans-app text-xs font-medium" style={{ background: C.panel, color: C.sage, border: `1px solid ${C.border}` }}>添加</button>
      </div>
      <button disabled={!title.trim()}
        onClick={() => title.trim() && onSave({ title, author, genre, totalPages: Number(totalPages) || 0, status, coverImage, shelfIds })}
        className="w-full py-3.5 rounded-xl font-sans-app font-semibold text-sm" style={{ background: title.trim() ? C.rose : C.border, color: title.trim() ? C.card : C.inkMuted }}>
        保存书籍
      </button>
    </div>
  );
}

function AddBookSheet({ shelves, onClose, onSave, onCreateShelf }) {
  const [mode, setMode] = useState("choose"); // choose | scan | search | form
  const [prefill, setPrefill] = useState(null);
  const [scanStatus, setScanStatus] = useState("idle"); // idle | loading | notfound
  const [manualIsbn, setManualIsbn] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState("idle");
  const scanInputRef = useRef(null);
  const barcodeSupported = typeof window !== "undefined" && "BarcodeDetector" in window;

  const runSearch = async (q) => {
    if (!q.trim()) return;
    setSearchStatus("loading");
    try { const r = await searchBooksOnline(q); setResults(r); setSearchStatus(r.length ? "done" : "empty"); }
    catch (e) { setSearchStatus("error"); }
  };
  const runIsbnLookup = async (isbn) => {
    setScanStatus("loading");
    try { const b = await searchByISBN(isbn); if (b) { setPrefill(b); setMode("form"); } else setScanStatus("notfound"); }
    catch (e) { setScanStatus("notfound"); }
  };
  const handleScanFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanStatus("loading");
    const isbn = await detectBarcodeFromFile(file);
    if (isbn) runIsbnLookup(isbn); else setScanStatus("notfound");
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: "rgba(69,59,50,0.5)" }}>
      <div className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-8" style={{ background: C.card, maxHeight: "90%", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif-app text-xl" style={{ color: C.ink }}>添加书籍</h2>
          <button onClick={onClose}><X size={20} color={C.inkMuted} /></button>
        </div>

        {mode === "choose" && (
          <div className="flex flex-col gap-3">
            <button onClick={() => setMode("scan")} className="flex items-center gap-3 p-4 rounded-xl text-left" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <ScanLine size={20} color={C.rose} /><div><p className="font-sans-app text-sm font-semibold" style={{ color: C.ink }}>扫描条形码</p><p className="font-sans-app text-[11px]" style={{ color: C.inkMuted }}>拍摄书籍背面条形码自动识别</p></div>
            </button>
            <button onClick={() => setMode("search")} className="flex items-center gap-3 p-4 rounded-xl text-left" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <Globe size={20} color={C.sage} /><div><p className="font-sans-app text-sm font-semibold" style={{ color: C.ink }}>联网搜索</p><p className="font-sans-app text-[11px]" style={{ color: C.inkMuted }}>输入书名或 ISBN 获取官方封面信息</p></div>
            </button>
            <button onClick={() => { setPrefill(null); setMode("form"); }} className="flex items-center gap-3 p-4 rounded-xl text-left" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <Keyboard size={20} color={C.dustyBlue} /><div><p className="font-sans-app text-sm font-semibold" style={{ color: C.ink }}>手动输入</p><p className="font-sans-app text-[11px]" style={{ color: C.inkMuted }}>自行填写书籍信息</p></div>
            </button>
          </div>
        )}

        {mode === "scan" && (
          <div>
            <button onClick={() => setMode("choose")} className="font-sans-app text-xs mb-4 flex items-center gap-1" style={{ color: C.inkMuted }}><ArrowLeft size={13} /> 返回</button>
            {!barcodeSupported && <p className="font-sans-app text-xs mb-3" style={{ color: C.danger }}>当前浏览器不支持自动识别条形码，拍照后请手动输入条码数字查询。</p>}
            <button onClick={() => scanInputRef.current?.click()} className="w-full py-8 rounded-xl flex flex-col items-center gap-2 mb-4" style={{ background: C.panel, border: `1px dashed ${C.border}` }}>
              <Camera size={26} color={C.rose} />
              <span className="font-sans-app text-xs" style={{ color: C.ink }}>{scanStatus === "loading" ? "识别中…" : "拍摄条形码"}</span>
            </button>
            <input ref={scanInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanFile} />
            {scanStatus === "notfound" && (
              <div className="mb-4 p-3 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <p className="font-sans-app text-xs mb-2" style={{ color: C.danger }}>没能自动识别到这本书——可能是没扫清条码，也可能是数据库里没有收录。</p>
                <p className="font-sans-app text-[11px] mb-3" style={{ color: C.inkMuted }}>可以再试一次，或者换个更可靠的方式：</p>
                <div className="flex gap-2">
                  <button onClick={() => setMode("search")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-sans-app text-xs font-semibold" style={{ background: C.sage, color: C.card }}><Globe size={13} /> 去联网搜索</button>
                  <button onClick={() => { setPrefill(null); setMode("form"); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-sans-app text-xs font-semibold" style={{ background: C.dustyBlue, color: C.card }}><Keyboard size={13} /> 手动输入</button>
                </div>
              </div>
            )}
            <p className="font-sans-app text-xs mb-2" style={{ color: C.inkMuted }}>也可以直接输入条码上的数字查询：</p>
            <div className="flex gap-2">
              <input value={manualIsbn} onChange={(e) => setManualIsbn(e.target.value)} placeholder="输入 ISBN 数字" className="flex-1 px-4 py-2.5 rounded-xl font-sans-app text-sm outline-none" style={{ background: C.panel, color: C.ink, border: `1px solid ${C.border}` }} />
              <button onClick={() => manualIsbn.trim() && runIsbnLookup(manualIsbn.trim())} className="px-4 py-2.5 rounded-xl font-sans-app text-sm font-semibold" style={{ background: C.rose, color: C.card }}>查询</button>
            </div>
          </div>
        )}

        {mode === "search" && (
          <div>
            <button onClick={() => setMode("choose")} className="font-sans-app text-xs mb-4 flex items-center gap-1" style={{ color: C.inkMuted }}><ArrowLeft size={13} /> 返回</button>
            <div className="flex gap-2 mb-4">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="书名、作者或 ISBN" className="flex-1 px-4 py-2.5 rounded-xl font-sans-app text-sm outline-none" style={{ background: C.panel, color: C.ink, border: `1px solid ${C.border}` }} />
              <button onClick={() => runSearch(query)} className="px-4 py-2.5 rounded-xl font-sans-app text-sm font-semibold" style={{ background: C.rose, color: C.card }}>搜索</button>
            </div>
            {searchStatus === "loading" && <p className="font-sans-app text-xs mb-3" style={{ color: C.inkMuted }}>搜索中…（已同时查询两个图书数据库）</p>}
            {(searchStatus === "empty" || searchStatus === "error") && (
              <div className="mb-4 p-3 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <p className="font-sans-app text-xs mb-3" style={{ color: searchStatus === "error" ? C.danger : C.inkMuted }}>
                  {searchStatus === "error" ? "网络查询失败，请检查网络后重试。" : "两个数据库都没查到相关书籍，可能是书名写法不同或收录较少。"}
                </p>
                <button onClick={() => { setPrefill({ title: query }); setMode("form"); }} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-sans-app text-xs font-semibold" style={{ background: C.dustyBlue, color: C.card }}><Keyboard size={13} /> 直接手动输入这本书</button>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {results.map((r, i) => (
                <button key={i} onClick={() => { setPrefill(r); setMode("form"); }} className="flex gap-3 items-center p-2.5 rounded-xl text-left" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                  {r.coverImage ? <img src={r.coverImage} alt="" style={{ width: 36, height: 50, objectFit: "cover", borderRadius: 3 }} /> : <div style={{ width: 36, height: 50, background: C.card, borderRadius: 3 }} />}
                  <div className="min-w-0"><p className="font-sans-app text-xs font-semibold truncate" style={{ color: C.ink }}>{r.title}</p><p className="font-sans-app text-[11px] truncate" style={{ color: C.inkMuted }}>{r.author || "作者未知"}{r.source ? ` · ${r.source}` : ""}</p></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "form" && (
          <div>
            <button onClick={() => setMode("choose")} className="font-sans-app text-xs mb-4 flex items-center gap-1" style={{ color: C.inkMuted }}><ArrowLeft size={13} /> 重新选择方式</button>
            <BookForm shelves={shelves} initial={prefill} onSave={onSave} onCreateShelf={onCreateShelf} />
          </div>
        )}
      </div>
    </div>
  );
}

function BookDetail({ book, checkins, shelves, onBack, onUpdate, onDelete }) {
  const bookCheckins = checkins.filter((c) => c.bookId === book.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const pct = book.totalPages ? Math.min(100, Math.round(((book.currentPage || 0) / book.totalPages) * 100)) : null;
  const toggleShelf = (id) => { const ids = book.shelfIds || []; onUpdate({ ...book, shelfIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] }); };
  return (
    <div>
      <TopBar title="" onBack={onBack} right={<button onClick={() => onDelete(book.id)}><Trash2 size={18} color={C.danger} /></button>} />
      <div className="px-5 -mt-2">
        <div className="flex gap-4 mb-4">
          <BookCover book={book} size={80} />
          <div className="flex-1 min-w-0">
            <h2 className="font-serif-app text-xl leading-tight" style={{ color: C.ink }}>{book.title}</h2>
            {book.author && <p className="font-sans-app text-sm mt-1" style={{ color: C.inkMuted }}>{book.author}</p>}
            {book.genre && <p className="font-sans-app text-xs mt-1" style={{ color: C.sage }}>{book.genre}</p>}
            {book.startDate && <p className="font-sans-app text-[11px] mt-1" style={{ color: C.inkMuted }}>开始于 {book.startDate}{book.finishDate ? ` · 读完于 ${book.finishDate}` : ""}</p>}
          </div>
        </div>
        <CoverPicker value={book.coverImage} onChange={(img) => onUpdate({ ...book, coverImage: img })} />
        <div className="flex gap-2 mb-4 flex-wrap">{STATUSES.map((s) => <Pill key={s.k} color={s.color} active={book.status === s.k} onClick={() => onUpdate({ ...book, status: s.k })}>{s.label}</Pill>)}</div>
        {shelves.length > 0 && <div className="flex gap-2 mb-5 flex-wrap">{shelves.map((s) => <Pill key={s.id} color={C.sage} active={(book.shelfIds || []).includes(s.id)} onClick={() => toggleShelf(s.id)}>{s.name}</Pill>)}</div>}
        {book.totalPages > 0 && (
          <div className="mb-6">
            <div className="flex justify-between mb-1.5"><span className="font-sans-app text-xs" style={{ color: C.inkMuted }}>{book.currentPage || 0} / {book.totalPages} 页</span><span className="font-sans-app text-xs font-semibold" style={{ color: C.rose }}>{pct}%</span></div>
            <div className="w-full h-2 rounded-full" style={{ background: C.panel }}><div className="h-2 rounded-full" style={{ width: `${pct}%`, background: C.rose }} /></div>
          </div>
        )}
        {book.status === "finished" && (
          <div className="mb-6">
            <label className="font-sans-app text-xs font-medium" style={{ color: C.inkMuted }}>我的评分</label>
            <div className="flex gap-1 mt-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => onUpdate({ ...book, rating: n })}><Star size={22} fill={(book.rating || 0) >= n ? C.rose : "none"} color={C.rose} /></button>)}</div>
          </div>
        )}
        <Divider />
        <h3 className="font-serif-app text-base mt-4 mb-3" style={{ color: C.ink }}>打卡记录</h3>
        {bookCheckins.length === 0 ? <p className="font-sans-app text-sm pb-6" style={{ color: C.inkMuted }}>这本书还没有打卡记录。</p> : (
          <div className="flex flex-col gap-3 pb-6">
            {bookCheckins.map((c) => (
              <div key={c.id} className="flex gap-3 items-start p-3 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <MiniDoodle paths={c.doodle} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between"><span className="font-sans-app text-xs font-medium" style={{ color: C.ink }}>{c.date}</span><span className="font-sans-app text-xs" style={{ color: C.sage }}>+{c.pages}页{c.minutes ? ` · ${c.minutes}分钟` : ""}</span></div>
                  {c.note && <p className="font-sans-app text-xs mt-1" style={{ color: C.inkMuted }}>{c.note}</p>}
                  {c.aiReflection && (
                    <div className="mt-2 p-2 rounded-lg flex gap-1.5" style={{ background: C.card }}>
                      <Bot size={12} color={C.rose} style={{ flexShrink: 0, marginTop: 1 }} />
                      <p className="font-sans-app text-[11px]" style={{ color: C.inkMuted }}>{c.aiReflection}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryScreen({ data, setData }) {
  const [filter, setFilter] = useState("all");
  const [shelfFilter, setShelfFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("added");
  const [showSearch, setShowSearch] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [openId, setOpenId] = useState(null);

  const genreOf = (b) => (b.genre && b.genre.trim()) || "未分类";
  const allGenres = useMemo(() => {
    const set = new Set(data.books.map(genreOf));
    return [...set].sort((a, b) => (a === "未分类" ? 1 : b === "未分类" ? -1 : a.localeCompare(b, "zh")));
  }, [data.books]);

  let books = filter === "all" ? data.books : data.books.filter((b) => b.status === filter);
  if (shelfFilter !== "all") books = books.filter((b) => (b.shelfIds || []).includes(shelfFilter));
  if (genreFilter !== "all") books = books.filter((b) => genreOf(b) === genreFilter);
  if (query.trim()) { const q = query.trim().toLowerCase(); books = books.filter((b) => b.title.toLowerCase().includes(q) || (b.author || "").toLowerCase().includes(q)); }
  books = [...books].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "author") return (a.author || "").localeCompare(b.author || "");
    if (sort === "rating") return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  // 按分类分组陈列，如同真实书架按类别划分
  const groups = useMemo(() => {
    const map = {};
    books.forEach((b) => { const g = genreOf(b); (map[g] = map[g] || []).push(b); });
    return Object.entries(map).sort(([a], [b]) => (a === "未分类" ? 1 : b === "未分类" ? -1 : a.localeCompare(b, "zh")));
  }, [books]);

  const openBook = data.books.find((b) => b.id === openId);
  const addBook = (b) => {
    const nb = { id: uid(), currentPage: 0, ...b };
    if (nb.status === "reading" && !nb.startDate) nb.startDate = todayISO();
    if (nb.status === "finished") { nb.startDate = nb.startDate || todayISO(); nb.finishDate = todayISO(); }
    const next = { ...data, books: [nb, ...data.books] }; setData(next); saveData(next); setShowAdd(false);
  };
  const updateBook = (b) => {
    const nb = { ...b };
    if (nb.status === "reading" && !nb.startDate) nb.startDate = todayISO();
    if (nb.status === "finished" && !nb.finishDate) nb.finishDate = todayISO();
    const next = { ...data, books: data.books.map((x) => (x.id === nb.id ? nb : x)) }; setData(next); saveData(next);
  };
  const deleteBook = (id) => { const next = { ...data, books: data.books.filter((b) => b.id !== id), checkins: data.checkins.filter((c) => c.bookId !== id) }; setData(next); saveData(next); setOpenId(null); };
  const createShelf = (name) => { const next = { ...data, shelves: [...data.shelves, { id: uid(), name }] }; setData(next); saveData(next); };

  if (openBook) return <BookDetail book={openBook} checkins={data.checkins} shelves={data.shelves} onBack={() => setOpenId(null)} onUpdate={updateBook} onDelete={deleteBook} />;

  return (
    <div>
      <TopBar title="书架" right={
        <>
          <IconBtn onClick={() => setShowSearch((s) => !s)}><Search size={16} color={C.inkMuted} /></IconBtn>
          <IconBtn onClick={() => setShowSort((s) => !s)}><ArrowUpDown size={16} color={C.inkMuted} /></IconBtn>
          <button onClick={() => setShowAdd(true)} className="p-2 rounded-full" style={{ background: C.rose }}><Plus size={18} color={C.card} /></button>
        </>
      } />
      <div className="px-5">
        {showSearch && <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索书名或作者" className="w-full mb-3 px-4 py-2.5 rounded-xl font-sans-app text-sm outline-none" style={{ background: C.card, color: C.ink, border: `1px solid ${C.border}` }} />}
        {showSort && <div className="flex gap-2 mb-3 flex-wrap">{SORTS.map((s) => <Pill key={s.k} color={C.sage} active={sort === s.k} onClick={() => setSort(s.k)}>{s.label}</Pill>)}</div>}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-1">
          <Pill active={filter === "all"} onClick={() => setFilter("all")}>全部</Pill>
          {STATUSES.map((s) => <Pill key={s.k} color={s.color} active={filter === s.k} onClick={() => setFilter(s.k)}>{s.label}</Pill>)}
        </div>
        {data.shelves.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-1">
            <Pill color={C.sage} active={shelfFilter === "all"} onClick={() => setShelfFilter("all")}><span className="flex items-center gap-1"><Layers size={11} /> 全部书单</span></Pill>
            {data.shelves.map((s) => <Pill key={s.id} color={C.sage} active={shelfFilter === s.id} onClick={() => setShelfFilter(s.id)}>{s.name}</Pill>)}
          </div>
        )}
        {allGenres.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-1">
            <Pill color={C.dustyBlue} active={genreFilter === "all"} onClick={() => setGenreFilter("all")}>全部分类</Pill>
            {allGenres.map((g) => <Pill key={g} color={C.dustyBlue} active={genreFilter === g} onClick={() => setGenreFilter(g)}>{g}</Pill>)}
          </div>
        )}
      </div>

      <div className="px-5 pb-4">
        {books.length === 0 ? (
          <EmptyBooks label={data.books.length === 0 ? "书架还是空的，添加第一本书吧" : "没有符合条件的书籍"} />
        ) : (
          <div className="flex flex-col gap-6 mt-2">
            {groups.map(([genre, genreBooks]) => (
              <div key={genre}>
                <div className="flex items-baseline gap-2 mb-2.5 px-1">
                  <h3 className="font-serif-app text-base" style={{ color: C.ink }}>{genre}</h3>
                  <span className="font-sans-app text-[11px]" style={{ color: C.inkMuted }}>{genreBooks.length} 本</span>
                </div>
                <div className="flex flex-col gap-4">
                  {chunk(genreBooks, 4).map((row, ri) => (
                    <div key={ri}>
                      <div className="flex gap-4 items-end px-1">
                        {row.map((b) => (
                          <button key={b.id} onClick={() => setOpenId(b.id)} className="flex flex-col items-center gap-1 flex-1 min-w-0" style={{ opacity: b.status === "dropped" ? 0.5 : 1 }}>
                            <BookCover book={b} size={56} />
                            {b.rating > 0 && <div className="flex items-center gap-0.5 mt-0.5"><Star size={9} fill={C.rose} color={C.rose} /><span className="font-sans-app text-[9px]" style={{ color: C.inkMuted }}>{b.rating}</span></div>}
                          </button>
                        ))}
                        {row.length < 4 && Array.from({ length: 4 - row.length }).map((_, i) => <div key={i} className="flex-1" />)}
                      </div>
                      <ShelfLedge />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showAdd && <AddBookSheet shelves={data.shelves} onClose={() => setShowAdd(false)} onSave={addBook} onCreateShelf={createShelf} />}
    </div>
  );
}

/* ---------------------------------------------------------------
   摘录
--------------------------------------------------------------- */
function QuotesScreen({ data }) {
  const [query, setQuery] = useState("");
  const withNotes = data.checkins.filter((c) => c.note && c.note.trim());
  const filtered = withNotes.filter((c) => {
    if (!query.trim()) return true;
    const book = data.books.find((b) => b.id === c.bookId);
    const q = query.toLowerCase();
    return c.note.toLowerCase().includes(q) || (book?.title || "").toLowerCase().includes(q);
  }).sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      <TopBar title="摘录" />
      <div className="px-5">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索摘录内容或书名" className="w-full mb-4 px-4 py-2.5 rounded-xl font-sans-app text-sm outline-none" style={{ background: C.card, color: C.ink, border: `1px solid ${C.border}` }} />
        {filtered.length === 0 ? (
          <EmptyQuotes label={withNotes.length === 0 ? "打卡时记下一段话，就会出现在这里" : "没有匹配的内容"} />
        ) : (
          <div className="flex flex-col gap-3 pb-6">
            {filtered.map((c) => {
              const book = data.books.find((b) => b.id === c.bookId);
              return (
                <div key={c.id} className="p-4 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                  <div className="flex gap-3">
                    {book && <BookCover book={book} size={32} />}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif-app text-sm leading-snug" style={{ color: C.ink }}>「{c.note}」</p>
                      <div className="flex justify-between mt-2"><span className="font-sans-app text-[11px]" style={{ color: C.sage }}>{book?.title || "未知书籍"}</span><span className="font-sans-app text-[11px]" style={{ color: C.inkMuted }}>{c.date}</span></div>
                      {c.aiReflection && (
                        <div className="mt-2 p-2 rounded-lg flex gap-1.5" style={{ background: C.card }}>
                          <Bot size={12} color={C.rose} style={{ flexShrink: 0, marginTop: 1 }} />
                          <p className="font-sans-app text-[11px]" style={{ color: C.inkMuted }}>{c.aiReflection}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   日程 —— 带阅读时长色阶的日历，可点击查看当日详情
--------------------------------------------------------------- */
function DayDetailSheet({ date, checkins, books, onClose }) {
  const list = checkins.filter((c) => c.date === date).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const totalMinutes = list.reduce((s, c) => s + (c.minutes || 0), 0);
  const totalPages = list.reduce((s, c) => s + (c.pages || 0), 0);
  const label = new Date(date + "T00:00:00").toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" });
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: "rgba(69,59,50,0.5)" }}>
      <div className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-8" style={{ background: C.card, maxHeight: "85%", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-serif-app text-xl" style={{ color: C.ink }}>{label}</h2>
          <button onClick={onClose}><X size={20} color={C.inkMuted} /></button>
        </div>
        {list.length > 0 && <p className="font-sans-app text-xs mb-4" style={{ color: C.inkMuted }}>共读 {totalPages} 页 · {totalMinutes} 分钟</p>}
        {list.length === 0 ? (
          <div className="py-6"><EmptyLamp label="这一天还没有阅读记录" /></div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((c) => {
              const book = books.find((b) => b.id === c.bookId);
              const m = MOODS.find((mm) => mm.k === c.mood);
              return (
                <div key={c.id} className="p-3 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                  <div className="flex gap-3">
                    {book && <BookCover book={book} size={40} />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-sans-app text-xs font-semibold truncate" style={{ color: C.ink }}>{book?.title || "未知书籍"}</p>
                        {m && <span className="text-base flex-shrink-0">{m.e}</span>}
                      </div>
                      <p className="font-sans-app text-[11px] mt-0.5" style={{ color: C.sage }}>
                        +{c.pages}页{c.minutes ? ` · ${c.minutes}分钟` : ""}{c.createdAt ? ` · ${periodOf(c.createdAt)}` : ""}
                      </p>
                      {c.note && <p className="font-sans-app text-xs mt-1.5" style={{ color: C.ink }}>{c.note}</p>}
                      {c.aiReflection && (
                        <div className="mt-2 p-2 rounded-lg flex gap-1.5" style={{ background: C.card }}>
                          <Bot size={12} color={C.rose} style={{ flexShrink: 0, marginTop: 1 }} />
                          <p className="font-sans-app text-[11px]" style={{ color: C.inkMuted }}>{c.aiReflection}</p>
                        </div>
                      )}
                      {c.doodle?.length > 0 && <div className="mt-2"><MiniDoodle paths={c.doodle} size={56} /></div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleScreen({ data }) {
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState(null);
  const checkinsByDate = useMemo(() => {
    const map = {};
    data.checkins.forEach((c) => { (map[c.date] = map[c.date] || []).push(c); });
    return map;
  }, [data.checkins]);
  const year = month.getFullYear(), mo = month.getMonth();
  const firstDay = new Date(year, mo, 1).getDay();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const shift = (n) => setMonth(new Date(year, mo + n, 1));
  const iso = (d) => `${year}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const upcoming = data.books.filter((b) => b.status === "reading" || b.status === "toread").slice(0, 5);

  return (
    <div>
      <TopBar title="阅读日历" />
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shift(-1)}><ChevronLeft size={20} color={C.inkMuted} /></button>
          <span className="font-serif-app text-base" style={{ color: C.ink }}>{month.toLocaleDateString("zh-CN", { year: "numeric", month: "long" })}</span>
          <button onClick={() => shift(1)}><ChevronRight size={20} color={C.inkMuted} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-2">{["日", "一", "二", "三", "四", "五", "六"].map((d, i) => <div key={i} className="text-center font-sans-app text-[10px]" style={{ color: C.inkMuted }}>{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const dateStr = iso(d);
            const dayCheckins = checkinsByDate[dateStr] || [];
            const bookIds = [...new Set(dayCheckins.map((c) => c.bookId))];
            const firstBook = data.books.find((b) => b.id === bookIds[0]);
            const dayMinutes = dayCheckins.reduce((s, c) => s + (c.minutes || 0), 0);
            const bg = durationColor(dayMinutes);
            const bucket = durationBucket(dayMinutes);
            const lightText = bucket >= 3;
            return (
              <button key={i} onClick={() => setSelectedDate(dateStr)} className="aspect-square rounded-lg relative flex items-center justify-center" style={{ background: bg, border: `1px solid ${C.border}` }}>
                <span className="font-sans-app text-[10px] font-medium" style={{ color: lightText ? C.card : C.inkMuted }}>{d}</span>
                {firstBook && (
                  <div className="absolute bottom-0.5 right-0.5 rounded-full overflow-hidden" style={{ width: 14, height: 14, border: `1px solid ${lightText ? C.card : C.border}`, boxShadow: "0 1px 2px rgba(0,0,0,0.25)" }}>
                    {firstBook.coverImage
                      ? <img src={firstBook.coverImage} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full" style={{ background: PALETTES[hashStr(firstBook.title) % PALETTES.length][0] }} />}
                  </div>
                )}
                {bookIds.length > 1 && <span className="absolute top-0.5 right-0.5 font-sans-app text-[7px] px-1 rounded-full" style={{ background: C.rose, color: C.card }}>+{bookIds.length - 1}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 mb-6">
          <span className="font-sans-app text-[10px]" style={{ color: C.inkMuted }}>时长</span>
          {DURATION_SCALE.map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c, border: `1px solid ${C.border}` }} />)}
          <span className="font-sans-app text-[10px]" style={{ color: C.inkMuted }}>0 · 1-15 · 16-30 · 31-60 · 60+ 分钟</span>
        </div>
        <Divider />
        <h3 className="font-serif-app text-base mt-4 mb-3" style={{ color: C.ink }}>书单待读</h3>
        {upcoming.length === 0 ? <p className="font-sans-app text-sm pb-6" style={{ color: C.inkMuted }}>暂时没有排队中的书。</p> : (
          <div className="flex flex-col gap-2 pb-6">
            {upcoming.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <BookCover book={b} size={32} />
                <div className="flex-1 min-w-0"><p className="font-sans-app text-sm truncate" style={{ color: C.ink }}>{b.title}</p></div>
                <span className="font-sans-app text-[10px] px-2 py-1 rounded-full" style={{ color: C.inkMuted, border: `1px solid ${C.border}` }}>{b.status === "reading" ? "在读中" : "待读"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedDate && <DayDetailSheet date={selectedDate} checkins={data.checkins} books={data.books} onClose={() => setSelectedDate(null)} />}
    </div>
  );
}

/* ---------------------------------------------------------------
   分享导出
--------------------------------------------------------------- */
function wrapCanvasText(ctx, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = ch; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function ShareSheet({ stats, onClose }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current; const ctx = canvas.getContext("2d");
    const W = 360;
    ctx.font = "400 13px sans-serif";
    const summaryLines = stats.aiSummary ? wrapCanvasText(ctx, stats.aiSummary, W - 56) : [];
    const H = 500 + (summaryLines.length ? 70 + summaryLines.length * 20 : 0);
    canvas.width = W; canvas.height = H;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const h = hashStr(String(stats.year)); const pal = PALETTES[h % PALETTES.length];
    ctx.globalAlpha = 0.8; ctx.fillStyle = pal[0]; ctx.beginPath(); ctx.arc(300, 90, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pal[1]; ctx.beginPath(); ctx.arc(50, 60, 34, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = C.ink; ctx.font = "600 30px serif"; ctx.fillText(`${stats.year} 年`, 28, 150);
    ctx.font = "400 18px serif"; ctx.fillStyle = C.inkMuted; ctx.fillText("阅读回顾", 28, 175);

    if (stats.persona) {
      ctx.font = "400 13px sans-serif"; ctx.fillStyle = C.roseDim;
      const p = [stats.persona.timeLabel, stats.persona.paceLabel].filter(Boolean).join(" · ");
      if (p) ctx.fillText(`阅读画像　${p}`, 28, 200);
    }

    const rows = [["读完书籍", stats.finished], ["累计页数", stats.pages], ["当前连续打卡", `${stats.streak} 天`], ["最长连续打卡", `${stats.longest} 天`], ["最爱类型", stats.topGenre || "—"]];
    let y = 245;
    rows.forEach(([label, val]) => {
      ctx.fillStyle = C.inkMuted; ctx.font = "400 13px sans-serif"; ctx.fillText(label, 28, y);
      ctx.fillStyle = C.rose; ctx.font = "600 26px serif"; ctx.fillText(String(val), 28, y + 32);
      y += 63;
    });

    if (summaryLines.length) {
      y += 8;
      ctx.strokeStyle = C.border; ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(W - 28, y); ctx.stroke();
      y += 28;
      ctx.fillStyle = C.ink; ctx.font = "600 14px serif"; ctx.fillText("AI 年度总结", 28, y);
      y += 24;
      ctx.font = "400 12.5px serif"; ctx.fillStyle = C.inkMuted;
      summaryLines.forEach((line) => { ctx.fillText(line, 28, y); y += 20; });
    }

    ctx.fillStyle = C.inkMuted; ctx.font = "400 11px sans-serif"; ctx.fillText("见微 · 我的阅读打卡本", 28, H - 20);
  }, [stats]);
  const download = () => { const canvas = canvasRef.current; const a = document.createElement("a"); a.download = `阅读回顾-${stats.year}.png`; a.href = canvas.toDataURL("image/png"); a.click(); };
  const personaText = stats.persona ? `\n阅读画像：${[stats.persona.timeLabel, stats.persona.paceLabel].filter(Boolean).join(" · ")}` : "";
  const aiText = stats.aiSummary ? `\n\nAI 年度总结：\n${stats.aiSummary}` : "";
  const summaryText = `${stats.year} 年阅读回顾\n读完书籍：${stats.finished} 本\n累计页数：${stats.pages} 页\n当前连续打卡：${stats.streak} 天\n最长连续打卡：${stats.longest} 天\n最爱类型：${stats.topGenre || "—"}${personaText}${aiText}`;
  const copyText = async () => { try { await navigator.clipboard.writeText(summaryText); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) {} };
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ background: "rgba(69,59,50,0.5)" }}>
      <div className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-8" style={{ background: C.card, maxHeight: "90%", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-4"><h2 className="font-serif-app text-xl" style={{ color: C.ink }}>分享我的年度阅读</h2><button onClick={onClose}><X size={20} color={C.inkMuted} /></button></div>
        <div className="flex justify-center mb-5"><canvas ref={canvasRef} style={{ width: "100%", maxWidth: 280, borderRadius: 12, border: `1px solid ${C.border}` }} /></div>
        <div className="flex gap-3">
          <button onClick={download} className="flex-1 py-3 rounded-xl font-sans-app text-sm font-semibold flex items-center justify-center gap-2" style={{ background: C.rose, color: C.card }}><Download size={15} /> 下载图片</button>
          <button onClick={copyText} className="flex-1 py-3 rounded-xl font-sans-app text-sm font-semibold flex items-center justify-center gap-2" style={{ background: C.panel, color: C.ink, border: `1px solid ${C.border}` }}><Copy size={15} /> {copied ? "已复制" : "复制文字"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   阅读画像
--------------------------------------------------------------- */
function computePersona(checkinsYear, avgDaysPerBook) {
  if (checkinsYear.length < 5) return null;
  const periodCounts = {};
  checkinsYear.forEach((c) => { const p = periodOf(c.createdAt || Date.parse(c.date)); periodCounts[p] = (periodCounts[p] || 0) + 1; });
  const total = checkinsYear.length;
  const nightPct = Math.round((((periodCounts["晚上"] || 0) + (periodCounts["深夜"] || 0)) / total) * 100);
  const morningPct = Math.round((((periodCounts["清晨"] || 0) + (periodCounts["上午"] || 0)) / total) * 100);
  const afternoonPct = Math.round((((periodCounts["下午"] || 0) + (periodCounts["傍晚"] || 0)) / total) * 100);
  let timeLabel, timeDesc;
  if (nightPct >= morningPct && nightPct >= afternoonPct && nightPct >= 35) { timeLabel = "夜读型"; timeDesc = `${nightPct}% 的阅读发生在晚间`; }
  else if (morningPct >= afternoonPct && morningPct >= 35) { timeLabel = "晨读型"; timeDesc = `${morningPct}% 的阅读发生在清晨与上午`; }
  else if (afternoonPct >= 35) { timeLabel = "午间型"; timeDesc = `${afternoonPct}% 的阅读发生在下午与傍晚`; }
  else { timeLabel = "均衡型"; timeDesc = "你的阅读时间分布得很均匀"; }
  let paceLabel = null, paceDesc = null;
  if (avgDaysPerBook != null) {
    const d = avgDaysPerBook;
    paceLabel = d < 5 ? "疾风型" : d <= 10 ? "稳步型" : d <= 20 ? "细读型" : "慢煮型";
    paceDesc = `平均一本书 ${d.toFixed(1)} 天`;
  }
  return { timeLabel, timeDesc, paceLabel, paceDesc };
}

function PersonaCard({ persona }) {
  if (!persona) {
    return (
      <div className="p-4 rounded-xl mb-5 text-center" style={{ background: C.panel, border: `1px dashed ${C.border}` }}>
        <p className="font-sans-app text-xs" style={{ color: C.inkMuted }}>继续打卡积累数据后，这里会展示你的专属阅读画像。</p>
      </div>
    );
  }
  const TimeIcon = persona.timeLabel === "夜读型" ? Moon : persona.timeLabel === "晨读型" ? Sun : Clock;
  return (
    <div className="flex gap-3 mb-5">
      <div className="flex-1 p-4 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <TimeIcon size={18} color={C.rose} />
        <p className="font-serif-app text-base mt-2" style={{ color: C.ink }}>{persona.timeLabel}</p>
        <p className="font-sans-app text-[11px] mt-1" style={{ color: C.inkMuted }}>{persona.timeDesc}</p>
      </div>
      <div className="flex-1 p-4 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <TrendingUp size={18} color={C.sage} />
        <p className="font-serif-app text-base mt-2" style={{ color: C.ink }}>{persona.paceLabel || "暂无数据"}</p>
        <p className="font-sans-app text-[11px] mt-1" style={{ color: C.inkMuted }}>{persona.paceDesc || "读完几本书后即可查看"}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   年度阅读热力图
--------------------------------------------------------------- */
function ReadingHeatmap({ checkins, year }) {
  const dayMinutes = useMemo(() => {
    const map = {};
    checkins.forEach((c) => { if (c.date.startsWith(String(year))) map[c.date] = (map[c.date] || 0) + (c.minutes || 0); });
    return map;
  }, [checkins, year]);
  const weeks = useMemo(() => {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    const startSunday = new Date(start); startSunday.setDate(start.getDate() - start.getDay());
    const out = [];
    let cur = new Date(startSunday);
    while (cur <= end) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const inRange = cur >= start && cur <= end;
        week.push(inRange ? cur.toISOString().slice(0, 10) : null);
        cur.setDate(cur.getDate() + 1);
      }
      out.push(week);
    }
    return out;
  }, [year]);
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-[3px]" style={{ width: "max-content" }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((dateStr, di) => (
              <div key={di} style={{ width: 9, height: 9, borderRadius: 2, background: dateStr ? durationColor(dayMinutes[dateStr]) : "transparent" }} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="font-sans-app text-[10px]" style={{ color: C.inkMuted }}>少</span>
        {DURATION_SCALE.map((c, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: c, border: `1px solid ${C.border}` }} />)}
        <span className="font-sans-app text-[10px]" style={{ color: C.inkMuted }}>多</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   统计
--------------------------------------------------------------- */
function genreSharePct(list) {
  const map = {};
  list.forEach((b) => { const g = (b.genre && b.genre.trim()) || "其他"; map[g] = (map[g] || 0) + 1; });
  const t = list.length || 1;
  const out = {};
  Object.entries(map).forEach(([g, n]) => { out[g] = Math.round((n / t) * 100); });
  return out;
}

function StatsScreen({ data, setData }) {
  const [showShare, setShowShare] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState(false);
  const year = new Date().getFullYear();
  const yearCheckins = data.checkins.filter((c) => c.date.startsWith(String(year)));
  const finishedThisYear = data.books.filter((b) => b.status === "finished" && (!b.finishDate || b.finishDate.slice(0, 4) === String(year)));
  const totalPages = yearCheckins.reduce((s, c) => s + (c.pages || 0), 0);
  const totalMinutesYear = yearCheckins.reduce((s, c) => s + (c.minutes || 0), 0);
  const daysReadYear = new Set(yearCheckins.map((c) => c.date)).size;
  const avgMinutesPerActiveDay = daysReadYear ? Math.round(totalMinutesYear / daysReadYear) : 0;
  const streak = computeStreak(data.checkins);
  const longest = longestStreakOf(data.checkins);
  const goalPct = data.goals.yearlyBooks ? Math.min(100, Math.round((finishedThisYear.length / data.goals.yearlyBooks) * 100)) : 0;

  const monthly = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({ m: i, count: 0 }));
    yearCheckins.forEach((c) => { arr[new Date(c.date).getMonth()].count++; });
    return arr.map((a) => ({ name: `${a.m + 1}月`, count: a.count }));
  }, [yearCheckins]);
  const genreCounts = useMemo(() => {
    const map = {}; finishedThisYear.forEach((b) => { const g = (b.genre && b.genre.trim()) || "其他"; map[g] = (map[g] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [finishedThisYear]);

  const avgDaysPerBook = useMemo(() => {
    const valid = finishedThisYear.filter((b) => b.startDate && b.finishDate);
    if (!valid.length) return null;
    const total = valid.reduce((s, b) => s + Math.max(0, (new Date(b.finishDate) - new Date(b.startDate)) / 86400000), 0);
    return total / valid.length;
  }, [finishedThisYear]);

  const persona = useMemo(() => computePersona(yearCheckins, avgDaysPerBook), [yearCheckins, avgDaysPerBook]);

  const topMonth = useMemo(() => {
    let maxI = -1, maxV = -1;
    monthly.forEach((m, i) => { if (m.count > maxV) { maxV = m.count; maxI = i; } });
    return maxV > 0 ? monthly[maxI].name : "暂无数据";
  }, [monthly]);

  const topDateLabel = useMemo(() => {
    const map = {};
    yearCheckins.forEach((c) => { map[c.date] = (map[c.date] || 0) + (c.minutes || 0) + (c.pages || 0) * 0.1; });
    let best = null, bestV = -1;
    Object.entries(map).forEach(([d, v]) => { if (v > bestV) { bestV = v; best = d; } });
    return best ? new Date(best + "T00:00:00").toLocaleDateString("zh-CN", { month: "long", day: "numeric" }) : "暂无数据";
  }, [yearCheckins]);

  const topWeekday = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    yearCheckins.forEach((c) => { counts[new Date(c.date + "T00:00:00").getDay()]++; });
    let maxI = -1, maxV = -1; counts.forEach((v, i) => { if (v > maxV) { maxV = v; maxI = i; } });
    return maxV > 0 ? WEEKDAY_FULL[maxI] : "暂无数据";
  }, [yearCheckins]);

  const periodStats = useMemo(() => {
    const map = {};
    yearCheckins.forEach((c) => { const p = periodOf(c.createdAt || Date.parse(c.date)); map[p] = (map[p] || 0) + (c.minutes || 0) + 1; });
    const order = ["清晨", "上午", "下午", "傍晚", "晚上", "深夜"];
    return order.filter((p) => map[p] > 0).map((p) => [p, map[p]]).sort((a, b) => b[1] - a[1]);
  }, [yearCheckins]);
  const periodMax = periodStats.length ? periodStats[0][1] : 1;

  const topAuthor = useMemo(() => {
    const map = {};
    finishedThisYear.forEach((b) => { if (b.author && b.author.trim()) map[b.author.trim()] = (map[b.author.trim()] || 0) + 1; });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return entries[0] ? `${entries[0][0]}（${entries[0][1]}本）` : "暂无数据";
  }, [finishedThisYear]);

  const halfYearText = useMemo(() => {
    const withDates = finishedThisYear.filter((b) => b.finishDate);
    const h1 = withDates.filter((b) => new Date(b.finishDate).getMonth() < 6);
    const h2 = withDates.filter((b) => new Date(b.finishDate).getMonth() >= 6);
    if (h1.length < 2 || h2.length < 2) return "今年数据还不够丰富，暂时无法比较上下半年的变化。";
    const p1 = genreSharePct(h1), p2 = genreSharePct(h2);
    const genres = new Set([...Object.keys(p1), ...Object.keys(p2)]);
    let maxDelta = -Infinity, maxG = null, minDelta = Infinity, minG = null;
    genres.forEach((g) => { const d = (p2[g] || 0) - (p1[g] || 0); if (d > maxDelta) { maxDelta = d; maxG = g; } if (d < minDelta) { minDelta = d; minG = g; } });
    if (maxDelta <= 0) return "上下半年的阅读类型分布变化不大。";
    return `上半年到下半年,「${maxG}」类占比上升了约${maxDelta}个百分点${minDelta < 0 ? `,「${minG}」类下降了约${Math.abs(minDelta)}个百分点` : ""}。`;
  }, [finishedThisYear]);

  const generateSummary = async () => {
    setAiSummaryLoading(true); setAiSummaryError(false);
    const genreText = genreCounts.slice(0, 3).map(([g, n]) => `${g} ${Math.round((n / (finishedThisYear.length || 1)) * 100)}%`).join("、") || "暂无足够数据";
    const prompt = `你是一位有文学素养、语言温暖的读书助手。以下是用户${year}年的真实阅读数据，请只依据这些数据来写：阅读完成${finishedThisYear.length}本书，总页数约${totalPages}页，总阅读时长约${(totalMinutesYear / 60).toFixed(1)}小时，阅读天数${daysReadYear}天，最长连续打卡${longest}天。类型分布（按占比从高到低）：${genreText}。阅读节奏：${persona?.paceDesc || "数据不足"}。阅读时段偏好：${persona?.timeDesc || "数据不足"}。半年对比：${halfYearText}。

请用简体中文写一段150-220字的年度阅读总结，直接称呼"你"，语言温暖、有画面感、略带文学性但不浮夸，可以引用上面的具体数字。最后请你自己创造一个比喻，想象"如果${year}年的阅读是一间书房，它会是什么样子"，用一两句话描绘这个书房，不要照搬任何示例说法。不要使用列表、标题或加粗，只写一段连贯的文字。`;
    try {
      const text = await callClaudeAPI(prompt);
      const next = { ...data, aiYearSummary: { year, text, generatedAt: Date.now() } };
      setData(next); saveData(next);
    } catch (e) { setAiSummaryError(true); }
    finally { setAiSummaryLoading(false); }
  };

  const stat = (label, value, color) => (
    <div className="flex-1 p-4 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
      <p className="font-serif-app text-2xl" style={{ color: color || C.ink }}>{value}</p>
      <p className="font-sans-app text-[11px] mt-1" style={{ color: C.inkMuted }}>{label}</p>
    </div>
  );

  const cachedSummary = data.aiYearSummary && data.aiYearSummary.year === year ? data.aiYearSummary.text : null;

  return (
    <div>
      <TopBar title={`${year} 年度阅读`} right={<IconBtn onClick={() => setShowShare(true)}><Share2 size={16} color={C.inkMuted} /></IconBtn>} />
      <div className="px-5">
        <h3 className="font-serif-app text-sm mb-2" style={{ color: C.ink }}>我的阅读画像</h3>
        <PersonaCard persona={persona} />

        <h3 className="font-serif-app text-sm mb-2" style={{ color: C.ink }}>连续打卡成就</h3>
        <div className="mb-5"><BadgeRow badges={data.badges} /></div>

        {data.goals.yearlyBooks > 0 && (
          <div className="mb-4">
            <div className="flex justify-between mb-1.5"><span className="font-sans-app text-xs" style={{ color: C.inkMuted }}>年度目标</span><span className="font-sans-app text-xs font-semibold" style={{ color: C.rose }}>{finishedThisYear.length}/{data.goals.yearlyBooks} 本</span></div>
            <div className="w-full h-2 rounded-full" style={{ background: C.panel }}><div className="h-2 rounded-full" style={{ width: `${goalPct}%`, background: C.rose }} /></div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {stat("读完书籍", finishedThisYear.length, C.rose)}
          {stat("累计页数", totalPages, C.sage)}
          {stat("累计时长", `${(totalMinutesYear / 60).toFixed(1)}h`, C.dustyBlue)}
          {stat("阅读天数", daysReadYear)}
          {stat("当前连续", `${streak}天`)}
          {stat("最长连续", `${longest}天`)}
        </div>

        <div className="rounded-xl px-4 mb-6" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <InfoRow icon={Clock} label="平均每天阅读" value={`${avgMinutesPerActiveDay} 分钟`} />
          <InfoRow icon={TrendingUp} label="平均每本用时" value={avgDaysPerBook != null ? `${avgDaysPerBook.toFixed(1)} 天` : "数据不足"} />
          <InfoRow icon={CalendarDays} label="哪个月读最多" value={topMonth} />
          <InfoRow icon={CalendarDays} label="哪一天读最多" value={topDateLabel} />
          <InfoRow icon={CalendarDays} label="最常阅读的星期" value={topWeekday} />
          <InfoRow icon={Clock} label="最常阅读的时段" value={periodStats[0]?.[0] || "暂无数据"} />
          <div className="py-2.5"><div className="flex items-center gap-2"><BookOpen size={14} color={C.inkMuted} /><span className="font-sans-app text-xs" style={{ color: C.inkMuted }}>阅读最多的作者</span></div><p className="font-sans-app text-xs font-semibold mt-1" style={{ color: C.ink }}>{topAuthor}</p></div>
        </div>

        {periodStats.length > 0 && (
          <>
            <h3 className="font-serif-app text-base mb-3" style={{ color: C.ink }}>阅读时段分布</h3>
            <div className="flex flex-col gap-2.5 mb-6">
              {periodStats.map(([p, v]) => (
                <div key={p} className="flex items-center gap-3">
                  <span className="font-sans-app text-xs w-10" style={{ color: C.ink }}>{p}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: C.panel }}><div className="h-2 rounded-full" style={{ width: `${(v / periodMax) * 100}%`, background: C.dustyBlue }} /></div>
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className="font-serif-app text-base mb-3" style={{ color: C.ink }}>每月打卡次数</h3>
        <div style={{ height: 140 }} className="mb-6 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <XAxis dataKey="name" tick={{ fill: C.inkMuted, fontSize: 10, fontFamily: "Noto Sans SC" }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill: C.panel }} contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: "Noto Sans SC" }} labelStyle={{ color: C.ink }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>{monthly.map((_, i) => <Cell key={i} fill={i === new Date().getMonth() ? C.rose : C.sage} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <h3 className="font-serif-app text-base mb-3" style={{ color: C.ink }}>年度阅读热力图</h3>
        <div className="mb-6"><ReadingHeatmap checkins={data.checkins} year={year} /></div>

        <Divider />
        <h3 className="font-serif-app text-base mt-4 mb-3" style={{ color: C.ink }}>阅读类型分布</h3>
        {genreCounts.length === 0 ? <p className="font-sans-app text-sm pb-8" style={{ color: C.inkMuted }}>读完一本书后即可看到类型统计。</p> : (
          <div className="flex flex-col gap-2.5 pb-6">
            {genreCounts.map(([g, n]) => (
              <div key={g} className="flex items-center gap-3">
                <span className="font-sans-app text-xs w-20 truncate" style={{ color: C.ink }}>{g}</span>
                <div className="flex-1 h-2 rounded-full" style={{ background: C.panel }}><div className="h-2 rounded-full" style={{ width: `${(n / finishedThisYear.length) * 100}%`, background: C.rose }} /></div>
                <span className="font-sans-app text-xs" style={{ color: C.inkMuted }}>{n}</span>
              </div>
            ))}
          </div>
        )}

        <Divider />
        <div className="flex items-center justify-between mt-4 mb-3">
          <h3 className="font-serif-app text-base" style={{ color: C.ink }}>AI 年度总结</h3>
          <button onClick={generateSummary} disabled={aiSummaryLoading || finishedThisYear.length === 0} className="flex items-center gap-1 font-sans-app text-[11px]" style={{ color: finishedThisYear.length === 0 ? C.inkMuted : C.rose }}>
            {aiSummaryLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {aiSummaryLoading ? "生成中…" : cachedSummary ? "重新生成" : "生成总结"}
          </button>
        </div>
        {finishedThisYear.length === 0 && <p className="font-sans-app text-xs pb-8" style={{ color: C.inkMuted }}>先读完至少一本书，才能生成年度总结。</p>}
        {aiSummaryError && <p className="font-sans-app text-xs mb-3" style={{ color: C.danger }}>生成失败，请检查网络后重试。</p>}
        {cachedSummary && (
          <div className="p-4 rounded-xl mb-8" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <p className="font-serif-app text-sm leading-relaxed" style={{ color: C.ink }}>{cachedSummary}</p>
          </div>
        )}
        {!cachedSummary && finishedThisYear.length > 0 && !aiSummaryLoading && <p className="font-sans-app text-xs pb-8" style={{ color: C.inkMuted }}>基于你的真实阅读数据，生成一段独属于你的年度总结。</p>}
      </div>
      {showShare && <ShareSheet stats={{ year, finished: finishedThisYear.length, pages: totalPages, streak, longest, topGenre: genreCounts[0]?.[0], persona, aiSummary: cachedSummary }} onClose={() => setShowShare(false)} />}
    </div>
  );
}

/* ---------------------------------------------------------------
   应用外壳
--------------------------------------------------------------- */
const TABS = [
  { k: "today", label: "今日", icon: PenLine },
  { k: "library", label: "书架", icon: BookOpen },
  { k: "quotes", label: "摘录", icon: QuoteIcon },
  { k: "schedule", label: "日程", icon: CalendarDays },
  { k: "stats", label: "统计", icon: BarChart3 },
];

export default function App() {
  const [tab, setTab] = useState("today");
  const [data, setData] = useState(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { loadData().then((d) => { setData(d); setLoaded(true); }); }, []);
  const screens = {
    today: <TodayScreen data={data} setData={setData} />,
    library: <LibraryScreen data={data} setData={setData} />,
    quotes: <QuotesScreen data={data} />,
    schedule: <ScheduleScreen data={data} />,
    stats: <StatsScreen data={data} setData={setData} />,
  };
  return (
    <div className="w-full h-full flex items-center justify-center font-sans-app" style={{ background: "#3A322B", minHeight: 640 }}>
      {FONTS}
      <div className="relative w-full flex flex-col" style={{ maxWidth: 400, height: 720, background: C.bg, borderRadius: 28, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }}>
        <div className="flex-1 overflow-y-auto pb-4">
          {loaded ? screens[tab] : (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <p className="font-serif-app text-3xl" style={{ color: C.ink }}>见微</p>
              <p className="font-sans-app text-xs" style={{ color: C.inkMuted }}>见微，知阅</p>
            </div>
          )}
        </div>
        <div className="flex justify-around items-center pt-2 pb-5" style={{ background: C.panel, borderTop: `1px solid ${C.border}` }}>
          {TABS.map((t) => {
            const Icon = t.icon; const active = tab === t.k;
            return (
              <button key={t.k} onClick={() => setTab(t.k)} className="flex flex-col items-center gap-1 px-2">
                <Icon size={19} color={active ? C.rose : C.inkMuted} strokeWidth={active ? 2.4 : 1.8} />
                <span className="font-sans-app text-[9px]" style={{ color: active ? C.rose : C.inkMuted }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
