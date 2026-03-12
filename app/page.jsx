"use client";
import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
const CONFIG = {
  SUPPORT_EMAIL: "support@dealdesk.com",
  BUSINESS_NAME: "DealDesk",
  STRIPE_PORTAL_URL: "https://billing.stripe.com/p/login/YOUR_PORTAL_ID",
};


// ─── PLAN LIMITS & FEATURE GATING ──────────────────────────────────────────
const PLAN_LIMITS = {
  free:     { deals: 5, brands: 10, aiCallsPerMonth: 10,  features: ["dashboard","pipeline","brands","analytics","mediakit","invoices","autopilot","assistant","negotiate"], pdfExport: false, dealIntelligence: false, dataExport: false },
  pro:      { deals: -1, brands: -1, aiCallsPerMonth: 200, features: ["dashboard","pipeline","brands","analytics","mediakit","invoices","autopilot","assistant","negotiate"], pdfExport: true, dealIntelligence: true, dataExport: false },
  business: { deals: -1, brands: -1, aiCallsPerMonth: -1,  features: ["dashboard","pipeline","brands","analytics","mediakit","invoices","autopilot","assistant","negotiate"], pdfExport: true, dealIntelligence: true, dataExport: true },
  lifetime: { deals: -1, brands: -1, aiCallsPerMonth: 200, features: ["dashboard","pipeline","brands","analytics","mediakit","invoices","autopilot","assistant","negotiate"], pdfExport: true, dealIntelligence: true, dataExport: false },
};

function canAccess(plan, feature) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return limits.features.includes(feature);
}

function atLimit(plan, count, type) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const max = limits[type];
  return max !== -1 && count >= max;
}

// ─── THEME ──────────────────────────────────────────────────────────────────
const T = {
  bg: "#08090E", bg2: "#0E0F17", card: "#111218", card2: "#161720",
  border: "#1C1D2A", borderHover: "#2A2B3D",
  gold: "#E8A020", goldLight: "#F5B84C", goldDim: "#8B5E10",
  blue: "#4F8EF7", blueDim: "#1E3A6E",
  green: "#22C55E", greenDim: "#14532D",
  red: "#EF4444", redDim: "#7F1D1D",
  purple: "#A855F7", purpleDim: "#3B0764",
  text: "#F0F2FF", textSub: "#9CA3AF", textMuted: "#4B5563",
  white: "#FFFFFF",
};

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: ${T.bg}; color: ${T.text}; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
    html { scroll-behavior: smooth; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: ${T.bg}; }
    ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
    button, a, [role="button"] { transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s, transform 0.1s; -webkit-tap-highlight-color: transparent; }
    button:active { transform: scale(0.97); }
    input, textarea, select { font-family: 'DM Sans', sans-serif; outline: none; font-size: 16px; }
    button { font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; outline: none; }
    a { text-decoration: none; color: inherit; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideIn { from { transform: translateX(-10px); opacity: 0; } to { transform: none; opacity: 1; } }
    .fade-in { animation: fadeIn 0.35s ease forwards; }
    .slide-in { animation: slideIn 0.3s ease forwards; }
    .pulse { animation: pulse 2s infinite; }
    .spin { animation: spin 1s linear infinite; }

    /* Mobile bottom nav */
    .dd-mobile-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: ${T.bg2}; border-top: 1px solid ${T.border}; z-index: 200; padding: 6px 0 env(safe-area-inset-bottom, 6px); }
    .dd-mobile-nav button { background: none; border: none; color: ${T.textMuted}; font-size: 10px; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 4px; min-width: 0; flex: 1; }
    .dd-mobile-nav button.active { color: ${T.gold}; }
    .dd-mobile-nav button span.icon { font-size: 20px; }

    @media (max-width: 768px) {
      .dd-sidebar { display: none !important; }
      .dd-main { margin-left: 0 !important; padding: 16px 16px 80px !important; max-width: 100vw !important; }
      .dd-mobile-nav { display: flex; }
      .dd-landing-nav { padding: 16px 20px !important; }
      .dd-landing-nav .dd-nav-links { display: none !important; }
      .dd-landing-hero { padding: 60px 20px 40px !important; }
      .dd-landing-hero h1 { font-size: 32px !important; }
      .dd-landing-section { padding: 40px 20px !important; }
      .dd-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
      .dd-grid-3 { grid-template-columns: 1fr !important; }
      .dd-grid-2 { grid-template-columns: 1fr !important; }
      .dd-kanban { flex-direction: column !important; }
      .dd-kanban > div { min-width: auto !important; }
      .dd-pricing { grid-template-columns: 1fr !important; }
      .dd-pricing > div { transform: none !important; }
      .dd-chart-grid { grid-template-columns: 1fr !important; }
      .dd-brands-table { display: none !important; }
      .dd-brands-cards { display: block !important; }
      .dd-invoice-grid { grid-template-columns: 1fr !important; }
      .dd-assistant-height { height: calc(100vh - 180px) !important; }
    }
    @media (max-width: 480px) {
      .dd-grid-4 { grid-template-columns: 1fr !important; }
      .dd-hero-stats { gap: 16px !important; }
    }
  `}</style>
);


const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div style={{ position: "fixed", inset: 0, background: "#000A", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
    <Card style={{ width: 380, textAlign: "center", padding: 28 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{message}</div>
      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 24 }}>This action cannot be undone.</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="danger" onClick={onConfirm}>Delete</Btn>
      </div>
    </Card>
  </div>
);


const UpgradeModal = ({ feature, plan, onClose, onUpgrade }) => (
  <div style={{ position: "fixed", inset: 0, background: "#000B", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
    <Card style={{ width: 440, textAlign: "center", padding: 32 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Upgrade to unlock {feature}</div>
      <div style={{ fontSize: 14, color: T.textSub, marginBottom: 24, lineHeight: 1.6 }}>
        {plan === "free" ? "You're on the Free plan. Upgrade to Pro to unlock AI-powered features, unlimited deals, and more." : "Upgrade to Business for unlimited AI calls, priority support, and team features."}
      </div>
      <div style={{ background: T.gold + "11", border: `1px solid ${T.gold}33`, borderRadius: 10, padding: 16, marginBottom: 24 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: T.gold }}>$49<span style={{ fontSize: 14, fontWeight: 400, color: T.textSub }}>/mo</span></div>
        <div style={{ fontSize: 12, color: T.textSub, marginTop: 4 }}>Unlimited deals · All AI features · 200 AI calls/month</div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Btn variant="ghost" onClick={onClose}>Maybe later</Btn>
        <Btn onClick={onUpgrade}>Upgrade Now →</Btn>
      </div>
    </Card>
  </div>
);

function OnboardingChecklist({ deals, brands, onNavigate, onDismiss }) {
  const steps = [
    { id: "deal", label: "Add your first brand deal", done: deals.length > 0, action: () => onNavigate("pipeline"), icon: "📋" },
    { id: "brand", label: "Add a brand contact", done: brands.length > 0, action: () => onNavigate("brands"), icon: "🤝" },
    { id: "mediakit", label: "Generate an AI media kit", done: false, action: () => onNavigate("mediakit"), icon: "🖼️" },
    { id: "assistant", label: "Ask the AI assistant a question", done: false, action: () => onNavigate("assistant"), icon: "💬" },
  ];
  const completed = steps.filter(s => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  if (completed >= steps.length) return null;

  return (
    <Card style={{ marginBottom: 20, border: `1px solid ${T.gold}44`, background: T.gold + "08" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>🚀 Get started with DealDesk</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{completed}/{steps.length}</span>
          <span onClick={onDismiss} style={{ fontSize: 12, color: T.textMuted, cursor: "pointer" }}>Dismiss</span>
        </div>
      </div>
      <div style={{ background: T.border, borderRadius: 4, height: 4, marginBottom: 16 }}>
        <div style={{ background: T.gold, borderRadius: 4, height: 4, width: `${pct}%`, transition: "width 0.5s" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {steps.map(s => (
          <div key={s.id} onClick={s.done ? undefined : s.action} style={{
            display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 8,
            background: s.done ? T.green + "11" : T.bg2, cursor: s.done ? "default" : "pointer",
            border: `1px solid ${s.done ? T.green + "33" : T.border}`,
          }}>
            <span style={{ fontSize: 18 }}>{s.done ? "✅" : s.icon}</span>
            <span style={{ fontSize: 13, color: s.done ? T.green : T.text, textDecoration: s.done ? "line-through" : "none" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DealIntelligence({ deals }) {
  if (deals.length < 3) return null;
  const paid = deals.filter(d => d.stage === "paid");
  const totalValue = deals.reduce((s, d) => s + d.value, 0);
  const avgDeal = deals.length ? Math.round(totalValue / deals.length) : 0;
  const closeRate = deals.length ? Math.round((paid.length / deals.length) * 100) : 0;

  // Best category
  const byCat = {};
  deals.forEach(d => { const c = d.category || "Other"; byCat[c] = (byCat[c] || 0) + d.value; });
  const bestCat = Object.entries(byCat).sort((a,b) => b[1] - a[1])[0];

  // Highest value deal
  const topDeal = [...deals].sort((a,b) => b.value - a.value)[0];

  // Pipeline health
  const pitched = deals.filter(d => d.stage === "pitched").length;
  const negotiating = deals.filter(d => d.stage === "negotiating").length;
  const active = deals.filter(d => d.stage !== "paid").length;

  const insights = [
    { icon: "💰", text: `Your average deal is worth ${fmt$(avgDeal)}. ${avgDeal > 5000 ? "You're commanding premium rates." : "Consider raising your rates — you're underpricing."}`, color: T.gold },
    { icon: "📈", text: `Close rate: ${closeRate}%. ${closeRate > 50 ? "Excellent — you convert well." : closeRate > 25 ? "Average for creators. Follow up faster on stalled deals." : "Below average. Focus on qualifying brands earlier."}`, color: T.green },
    bestCat ? { icon: "🏆", text: `${bestCat[0]} is your highest-earning category at ${fmt$(bestCat[1])}. Double down on this niche.`, color: T.blue } : null,
    topDeal ? { icon: "⭐", text: `Your biggest deal is ${topDeal.brand} at ${fmt$(topDeal.value)}. Use this as social proof for new pitches.`, color: T.purple } : null,
    pitched > 3 ? { icon: "🔔", text: `You have ${pitched} deals stuck in Pitched. Follow up on any that are over 5 days old.`, color: T.red } : null,
    active > 0 ? { icon: "📊", text: `${active} active deals worth ${fmt$(deals.filter(d=>d.stage!=="paid").reduce((s,d)=>s+d.value,0))} in your pipeline right now.`, color: T.textSub } : null,
  ].filter(Boolean);

  return (
    <Card style={{ marginBottom: 20, border: `1px solid ${T.purple}33` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>🧠 Deal Intelligence</div>
        <Badge color={T.purple}>AI Insights</Badge>
      </div>
      {insights.slice(0, 4).map((insight, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{insight.icon}</span>
          <span style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5 }}>{insight.text}</span>
        </div>
      ))}
    </Card>
  );
}



// ─── LANDING PAGE MOCKUP DATA (only used in the marketing preview, not real data) ──
const MOCKUP_DEALS = [
  { id: 1, brand: "Nike", value: 8500, stage: "pitched" },
  { id: 2, brand: "Spotify", value: 12000, stage: "negotiating" },
  { id: 3, brand: "Notion", value: 4200, stage: "contracted" },
  { id: 4, brand: "GymShark", value: 6800, stage: "delivered" },
  { id: 5, brand: "Shopify", value: 9200, stage: "paid" },
];

// ─── INDUSTRY STATS (shown when user has no data yet) ───────────────────────
// Source: Influencer Marketing Hub, Goldman Sachs, SignalFire 2024-2025 reports
const INDUSTRY_STATS = {
  revenue: [
    { month: "Nano\n(1-10K)", revenue: 1200, label: "Avg annual" },
    { month: "Micro\n(10-50K)", revenue: 5800, label: "Avg annual" },
    { month: "Mid\n(50-200K)", revenue: 18500, label: "Avg annual" },
    { month: "Macro\n(200K-1M)", revenue: 52000, label: "Avg annual" },
    { month: "Mega\n(1M+)", revenue: 150000, label: "Avg annual" },
  ],
  avgDealByPlatform: [
    { name: "Instagram", value: 1800 },
    { name: "YouTube", value: 4200 },
    { name: "TikTok", value: 1200 },
    { name: "Podcast", value: 3500 },
    { name: "Twitter/X", value: 800 },
  ],
  marketGrowth: [
    { month: "2020", revenue: 9700 },
    { month: "2021", revenue: 13800 },
    { month: "2022", revenue: 16400 },
    { month: "2023", revenue: 21100 },
    { month: "2024", revenue: 24000 },
    { month: "2025", revenue: 32000 },
  ],
};

const AUTOPILOT_TEMPLATES = [
  { id: "tweets", name: "Tweet Drafts", icon: "🐦", description: "Generate 3 engagement tweets about creator economy trends" },
  { id: "outreach", name: "Outreach Email Draft", icon: "📧", description: "Draft a personalized cold outreach email to a brand partnership manager" },
  { id: "followup", name: "Follow-Up Email Draft", icon: "🔔", description: "Draft a follow-up email for a deal that went quiet" },
  { id: "seo", name: "SEO Blog Intro", icon: "📝", description: "Write an SEO-optimized blog intro targeting creator-related keywords" },
  { id: "analytics", name: "Revenue Report Draft", icon: "📊", description: "Generate a weekly business summary report template" },
  { id: "social", name: "LinkedIn Post Draft", icon: "💼", description: "Draft a thought-leadership LinkedIn post about brand deals" },
];

// ─── UTILITY HELPERS ─────────────────────────────────────────────────────────
const fmt$ = (n) => `$${n.toLocaleString()}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
const STAGES = ["pitched", "negotiating", "contracted", "delivered", "paid"];
const STAGE_LABELS = { pitched: "Pitched", negotiating: "Negotiating", contracted: "Contracted", delivered: "Delivered", paid: "Paid" };
const STAGE_COLORS = { pitched: T.blue, negotiating: T.gold, contracted: T.purple, delivered: T.textSub, paid: T.green };

// ─── AI CALL (SECURE — goes through /api/ai, key stays on server) ──────────
async function callClaude(prompt, systemPrompt = "", retries = 1) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return "Please sign in to use AI features.";

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ prompt, systemPrompt }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (retries > 0 && res.status >= 500) return callClaude(prompt, systemPrompt, retries - 1);
      return err.error || "AI request failed. Please try again.";
    }
    const data = await res.json();
    return data.text || "Unable to generate response.";
  } catch (e) {
    if (retries > 0) return callClaude(prompt, systemPrompt, retries - 1);
    return "Connection error. Check your internet and try again.";
  }
}

// ─── UI PRIMITIVES ───────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, style: s = {} }) => {
  const sizes = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "10px 20px", fontSize: 14 }, lg: { padding: "14px 28px", fontSize: 16 } };
  const variants = {
    primary: { background: T.gold, color: "#000", fontWeight: 600 },
    secondary: { background: T.card2, color: T.text, border: `1px solid ${T.border}` },
    ghost: { background: "transparent", color: T.textSub, border: `1px solid ${T.border}` },
    danger: { background: T.red, color: T.white },
    success: { background: T.green, color: "#000", fontWeight: 600 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...sizes[size], ...variants[variant], borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", ...s,
      border: variants[variant].border || "none",
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
    >{children}</button>
  );
};

const Card = ({ children, style: s = {}, onClick, className }) => (
  <div onClick={onClick} className={className} style={{
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, ...s,
    cursor: onClick ? "pointer" : undefined,
  }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.background = T.card2; } }}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card; } }}
  >{children}</div>
);

const Badge = ({ children, color = T.blue }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
  }}>{children}</span>
);

const Stat = ({ label, value, sub, color = T.gold, icon }) => (
  <Card style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Syne', sans-serif", color }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSub }}>{sub}</div>}
  </Card>
);

const Input = ({ value, onChange, placeholder, type = "text", style: s = {} }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
    background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px",
    color: T.text, fontSize: 14, width: "100%", ...s,
  }}
    onFocus={e => e.target.style.borderColor = T.gold}
    onBlur={e => e.target.style.borderColor = T.border}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 4, style: s = {} }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{
    background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px",
    color: T.text, fontSize: 14, width: "100%", resize: "vertical", ...s,
  }}
    onFocus={e => e.target.style.borderColor = T.gold}
    onBlur={e => e.target.style.borderColor = T.border}
  />
);

const Spinner = () => (
  <div style={{ width: 18, height: 18, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: "50%" }} className="spin" />
);

const Divider = ({ style: s = {} }) => (
  <div style={{ height: 1, background: T.border, ...s }} />
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: T.text }}>{children}</h2>
    {sub && <p style={{ fontSize: 13, color: T.textSub, marginTop: 4 }}>{sub}</p>}
  </div>
);

const LiveDot = ({ color = T.green }) => (
  <div style={{
    width: 8, height: 8, borderRadius: "50%", background: color,
    boxShadow: `0 0 6px ${color}`, animation: "pulse 2s infinite",
  }} />
);


// ─── RATE CALCULATOR (free, no login, viral growth engine) ───────────────
const RATE_DATA = {
  Instagram: { post: { base: 10, eng: 250 }, reel: { base: 15, eng: 300 }, story: { base: 5, eng: 100 } },
  YouTube: { video: { base: 20, eng: 500 }, short: { base: 8, eng: 200 } },
  TikTok: { video: { base: 8, eng: 200 }, series: { base: 25, eng: 400 } },
  Twitter: { thread: { base: 5, eng: 150 }, post: { base: 3, eng: 80 } },
  Podcast: { mention: { base: 15, eng: 300 }, episode: { base: 40, eng: 800 } },
};

function RateCalculator() {
  const [followers, setFollowers] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [engagement, setEngagement] = useState("3.5");
  const [niche, setNiche] = useState("lifestyle");
  const [result, setResult] = useState(null);

  const NICHE_MULT = { lifestyle: 1.0, fitness: 1.1, beauty: 1.15, tech: 1.2, finance: 1.3, food: 0.95, travel: 1.05, gaming: 0.9, education: 1.1, fashion: 1.15 };

  const calculate = () => {
    const f = parseInt(followers.replace(/,/g, "")) || 0;
    if (f < 100) return;
    const eng = parseFloat(engagement) || 3;
    const mult = NICHE_MULT[niche] || 1;
    const platRates = RATE_DATA[platform] || RATE_DATA.Instagram;

    const rates = {};
    Object.entries(platRates).forEach(([type, { base, eng: engMult }]) => {
      const raw = (f / 1000) * base * (eng / 3) * mult;
      const low = Math.round(raw * 0.8 / 50) * 50;
      const high = Math.round(raw * 1.3 / 50) * 50;
      rates[type] = { low: Math.max(low, 50), high: Math.max(high, 100) };
    });

    const tier = f < 10000 ? "Nano" : f < 50000 ? "Micro" : f < 200000 ? "Mid-tier" : f < 1000000 ? "Macro" : "Mega";
    setResult({ rates, tier, followers: f, platform });
  };

  return (
    <div id="rate-calculator" style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Total Followers</div>
          <input value={followers} onChange={e => setFollowers(e.target.value)} placeholder="e.g. 50000"
            style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", color: T.text, fontSize: 16, width: "100%", fontFamily: "'DM Sans', sans-serif", outline: "none" }}
            onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Engagement Rate %</div>
          <input value={engagement} onChange={e => setEngagement(e.target.value)} placeholder="3.5"
            style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", color: T.text, fontSize: 16, width: "100%", fontFamily: "'DM Sans', sans-serif", outline: "none" }}
            onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Platform</div>
          <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", color: T.text, fontSize: 14, width: "100%", fontFamily: "'DM Sans', sans-serif" }}>
            {Object.keys(RATE_DATA).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Niche</div>
          <select value={niche} onChange={e => setNiche(e.target.value)} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", color: T.text, fontSize: 14, width: "100%", fontFamily: "'DM Sans', sans-serif" }}>
            {Object.keys(NICHE_MULT).map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <button onClick={calculate} style={{ width: "100%", background: T.gold, color: "#000", fontWeight: 700, fontSize: 16, padding: "14px 28px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
        Calculate My Rates →
      </button>

      {result && (
        <div className="fade-in" style={{ marginTop: 20, background: T.card, border: `1px solid ${T.gold}44`, borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: T.gold }}>{result.tier} Creator</div>
              <div style={{ fontSize: 12, color: T.textSub }}>{result.followers.toLocaleString()} followers on {result.platform}</div>
            </div>
            <span style={{ background: T.gold + "22", color: T.gold, border: `1px solid ${T.gold}44`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>Your Rates</span>
          </div>
          {Object.entries(result.rates).map(([type, { low, high }]) => (
            <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 14, color: T.textSub, textTransform: "capitalize" }}>{type}</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: T.gold }}>${low.toLocaleString()} – ${high.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: 14, background: T.gold + "11", borderRadius: 8, fontSize: 13, color: T.gold, textAlign: "center" }}>
            💡 Want AI-powered negotiation scripts and invoice generation? <strong>Sign up free</strong>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── PRICING SECTION (annual toggle + lifetime deal) ─────────────────────
function PricingSection({ onCheckout, onEnter }) {
  const [annual, setAnnual] = useState(false);
  const [lifetimeLeft, setLifetimeLeft] = useState(null);

  useEffect(() => {
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "lifetime")
      .then(({ count }) => setLifetimeLeft(Math.max(0, 50 - (count || 0))));
  }, []);

  const plans = [
    { name: "Free", price: 0, annualPrice: 0, color: T.textSub, plan: "free", target: "Try it out",
      features: ["5 active deals", "10 brand contacts", "All features unlocked", "10 AI calls/month", "Rate Calculator"] },
    { name: "Pro", price: 49, annualPrice: 39, color: T.gold, plan: "pro", target: "Serious creators", popular: true,
      features: ["Unlimited deals & brands", "200 AI calls/month", "AI Negotiation Coach", "AI Media Kit builder", "AI Invoice generator (18 currencies)", "AI Content Generator", "AI Business Assistant", "Deal Intelligence insights", "PDF invoice export"] },
    { name: "Business", price: 99, annualPrice: 79, color: T.purple, plan: "business", target: "Full-time creators",
      features: ["Everything in Pro", "Unlimited AI calls", "Priority email support", "Data export (CSV)", "Early access to new features"] },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, marginBottom: 12 }}>Simple pricing</h2>
        <p style={{ color: T.textSub, marginBottom: 24 }}>No setup fees. No hidden costs. Cancel anytime.</p>

        {/* Annual toggle */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: T.card, borderRadius: 10, padding: "6px 8px", border: `1px solid ${T.border}` }}>
          <span onClick={() => setAnnual(false)} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 600, background: !annual ? T.gold : "transparent", color: !annual ? "#000" : T.textSub }}>Monthly</span>
          <span onClick={() => setAnnual(true)} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 600, background: annual ? T.gold : "transparent", color: annual ? "#000" : T.textSub }}>Annual <span style={{ fontSize: 11, color: annual ? "#000" : T.green, fontWeight: 700 }}>Save 20%</span></span>
        </div>
      </div>

      <div className="dd-pricing" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        {plans.map(p => {
          const price = annual ? p.annualPrice : p.price;
          return (
            <div key={p.name} style={{
              background: p.popular ? `linear-gradient(135deg, ${T.goldDim}44, ${T.gold}11)` : T.card,
              border: `2px solid ${p.popular ? T.gold : T.border}`, borderRadius: 16, padding: 28,
              position: "relative", transform: p.popular ? "scale(1.05)" : "none",
            }}>
              {p.popular && <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: T.gold, color: "#000", padding: "4px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>MOST POPULAR</div>}
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: p.color, marginBottom: 8 }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800 }}>${price}</span>
                <span style={{ color: T.textSub }}>/mo</span>
              </div>
              {annual && p.price > 0 && <div style={{ fontSize: 12, color: T.green, marginBottom: 8 }}>Billed ${price * 12}/year — Save ${(p.price - p.annualPrice) * 12}/year</div>}
              {!annual && p.price > 0 && <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>{p.target}</div>}
              {p.price === 0 && <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>{p.target}</div>}
              <div style={{ height: 1, background: T.border, margin: "12px 0 16px" }} />
              {p.features.map(f => (
                <div key={f} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, fontSize: 14, color: T.textSub }}>
                  <span style={{ color: T.green }}>\u2713</span> {f}
                </div>
              ))}
              <button onClick={() => p.price === 0 ? onEnter() : onCheckout(annual ? p.plan + "_annual" : p.plan)} style={{
                width: "100%", marginTop: 16, padding: "12px 20px", borderRadius: 8, border: p.popular ? "none" : `1px solid ${T.border}`,
                background: p.popular ? T.gold : T.card2, color: p.popular ? "#000" : T.text, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>{p.price === 0 ? "Start Free" : "Get Started"}</button>
            </div>
          );
        })}
      </div>

      {/* LIFETIME DEAL */}
      {lifetimeLeft !== null && lifetimeLeft > 0 && (
        <div className="fade-in" style={{ background: `linear-gradient(135deg, ${T.goldDim}66, ${T.gold}22)`, border: `2px solid ${T.gold}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ background: T.red, color: T.white, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, animation: "pulse 2s infinite" }}>LIMITED</span>
            <span style={{ background: T.gold + "33", color: T.gold, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{lifetimeLeft} of 50 left</span>
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Lifetime Pro Access — <span style={{ color: T.gold }}>$299</span> <span style={{ fontSize: 16, color: T.textMuted, textDecoration: "line-through" }}>$588/yr</span>
          </div>
          <p style={{ color: T.textSub, fontSize: 15, marginBottom: 20, maxWidth: 500, margin: "0 auto 20px" }}>One payment. Pro features forever. No monthly fees. Only available for the first 50 customers.</p>
          <button onClick={() => onCheckout("lifetime")} style={{ background: T.gold, color: "#000", fontWeight: 700, fontSize: 16, padding: "14px 40px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Lock In Lifetime Access — $299
          </button>
        </div>
      )}
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onEnter, onLegal }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleEmailCapture = async () => {
    if (!email || !email.includes("@")) return;
    setSubmitting(true);
    try {
      await supabase.from("waitlist").insert({ email });
    } catch (e) { /* duplicate is fine */ }
    setSubmitted(true);
    setSubmitting(false);
  };

  const handleCheckout = async (plan) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else onEnter(); // fallback if checkout not configured yet
    } catch { onEnter(); }
  };

  const FEATURES = [
    { icon: "📋", title: "Deal Pipeline", desc: "Kanban board with 5 stages. See every deal from first pitch to final payment at a glance." },
    { icon: "🤝", title: "AI Negotiation Coach", desc: "Paste any brand offer, get a specific counter-offer amount and a ready-to-send email. Never leave money on the table." },
    { icon: "🖼️", title: "AI Media Kit", desc: "Generate a stunning media kit in 10 seconds. AI writes your stats, rates, and brand pitch." },
    { icon: "🧾", title: "Invoice Generator", desc: "AI invoices in 18 currencies with PDF export. One click from deal to professional invoice." },
    { icon: "📊", title: "Revenue Analytics", desc: "Track MRR, deal velocity, best brands, and revenue trends over time." },
    { icon: "🤖", title: "AI Content Generator", desc: "Generate tweets, outreach emails, follow-ups, and LinkedIn posts with AI. Copy, customize, and post." },
    { icon: "💬", title: "AI Business Assistant", desc: "Ask DealDesk AI anything — deal advice, rate strategy, outreach templates." },
  ];


  return (
    <div style={{ minHeight: "100vh", background: T.bg, overflowX: "hidden" }}>
      {/* NAV */}
      <nav className="dd-landing-nav" style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 60px", borderBottom: `1px solid ${T.border}`,
        position: "sticky", top: 0, background: T.bg + "EE", backdropFilter: "blur(12px)", zIndex: 100,
      }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800 }}>
          Deal<span style={{ color: T.gold }}>Desk</span>
        </div>
        <div className="dd-nav-links" style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
          {[["Rate Calculator", "rate-calculator"], ["Features", "features"], ["Pricing", "pricing"]].map(([l, id]) => (
            <span key={l} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })} style={{ fontSize: 14, color: T.textSub, cursor: "pointer" }}
              onMouseEnter={e => e.target.style.color = T.text}
              onMouseLeave={e => e.target.style.color = T.textSub}>{l}</span>
          ))}
          <Btn onClick={onEnter} size="sm">Launch App →</Btn>
        </div>
      </nav>

      {/* HERO */}
      <div className="dd-landing-hero" style={{ padding: "100px 60px 80px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <div className="fade-in" style={{ animationDelay: "0s" }}>
          <Badge color={T.gold} style={{ marginBottom: 20 }}>🚀 The Creator CRM is here</Badge>
          <br /><br />
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: 68, fontWeight: 800, lineHeight: 1.1,
            background: `linear-gradient(135deg, ${T.text} 40%, ${T.gold})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 24,
          }}>
            Every Brand Deal.<br />One Platform.
          </h1>
          <p style={{ fontSize: 20, color: T.textSub, lineHeight: 1.6, maxWidth: 600, margin: "0 auto 40px" }}>
            Stop tracking sponsorships in spreadsheets. DealDesk is the AI-powered CRM built exclusively for content creators.
          </p>
        </div>

        <div className="fade-in" style={{ animationDelay: "0.1s", display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn onClick={onEnter} size="lg" style={{ gap: 8 }}>Get Started Free</Btn>
          <Btn variant="ghost" size="lg" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>See Features</Btn>
        </div>

        <div className="fade-in" style={{
          animationDelay: "0.2s", display: "flex", gap: 32, justifyContent: "center",
          marginTop: 48, flexWrap: "wrap",
        }}>
          {[["5 Stages", "Pitch to Payment"], ["AI-Powered", "Media Kits, Invoices, Outreach"], ["$0 to Start", "Free Tier Available"]].map(([n, l]) => (
            <div key={n} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: T.gold }}>{n}</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DASHBOARD PREVIEW MOCKUP */}
      <div style={{ padding: "0 60px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
          padding: 24, boxShadow: `0 40px 80px ${T.bg}`,
        }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[T.red, T.gold, T.green].map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
          </div>
          <div className="dd-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {[["MRR", "$22,400", "+19%"], ["Active Deals", "8", "3 new"], ["Paid Out", "$57,200", "6mo"], ["Avg Deal", "$6,800", "↑ $800"]].map(([l, v, s]) => (
              <div key={l} style={{ background: T.bg2, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>{l}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: T.gold }}>{v}</div>
                <div style={{ fontSize: 11, color: T.green }}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STAGES.map(stage => (
              <div key={stage} style={{ background: T.bg2, borderRadius: 8, padding: "10px 16px", flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 11, color: STAGE_COLORS[stage], fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  {STAGE_LABELS[stage]}
                </div>
                {MOCKUP_DEALS.filter(d => d.stage === stage).slice(0, 1).map(d => (
                  <div key={d.id} style={{ background: T.card, borderRadius: 6, padding: "8px 10px", marginBottom: 6, fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: T.text }}>{d.brand}</div>
                    <div style={{ color: T.gold, fontSize: 11 }}>{fmt$(d.value)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* FREE RATE CALCULATOR */}
      <div className="dd-landing-section" style={{ padding: "80px 60px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <span style={{ background: T.green + "22", color: T.green, border: `1px solid ${T.green}44`, borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>100% Free — No Login Required</span>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, marginTop: 16, marginBottom: 12 }}>
            What should you <span style={{ color: T.gold }}>charge?</span>
          </h2>
          <p style={{ color: T.textSub, fontSize: 18, marginBottom: 40 }}>Enter your stats. Get instant rate estimates based on real market data.</p>
          <RateCalculator />
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" className="dd-landing-section" style={{ padding: "80px 60px", background: T.bg2 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, marginBottom: 16 }}>
              Built for how creators <span style={{ color: T.gold }}>actually</span> work
            </h2>
            <p style={{ color: T.textSub, fontSize: 18 }}>Everything you need to run a six-figure brand deal business.</p>
          </div>
          <div className="dd-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {FEATURES.map(f => (
              <Card key={f.title} style={{ padding: 28 }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6 }}>{f.desc}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" className="dd-landing-section" style={{ padding: "80px 60px" }}>
        <PricingSection onCheckout={handleCheckout} onEnter={onEnter} />
      </div>

      {/* SOCIAL PROOF */}
      <div className="dd-landing-section" style={{ padding: "80px 60px", background: T.bg2 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, marginBottom: 16 }}>
            Built by a creator, <span style={{ color: T.gold }}>for creators</span>
          </h2>
          <p style={{ color: T.textSub, fontSize: 18, lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            DealDesk was born from the frustration of managing brand deals in spreadsheets. We're building the tool we always wished existed — and we want your feedback to make it perfect.
          </p>
          <div className="dd-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { icon: "🚀", title: "Early Access", desc: "Be among the first creators to use DealDesk and shape the product roadmap." },
              { icon: "💬", title: "Direct Feedback Line", desc: "Talk directly to the founder. Your feature requests go straight to the top of the list." },
              { icon: "🎁", title: "Founder's Pricing", desc: "Early adopters lock in the lowest price we'll ever offer. Guaranteed for life." },
            ].map(f => (
              <Card key={f.title} style={{ padding: 28 }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6 }}>{f.desc}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "80px 60px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800, marginBottom: 16 }}>
          Ready to close more <span style={{ color: T.gold }}>deals?</span>
        </h2>
        <p style={{ color: T.textSub, fontSize: 18, marginBottom: 40 }}>Get early access and lock in founder's pricing before we raise rates.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", maxWidth: 500, margin: "0 auto" }}>
          {submitted ? (
            <div style={{ color: T.green, fontSize: 16 }}>✓ You're on the list! We'll be in touch.</div>
          ) : (
            <>
              <Input value={email} onChange={setEmail} placeholder="your@email.com" style={{ flex: 1 }} />
              <Btn onClick={handleEmailCapture} disabled={submitting} size="md">{submitting ? "..." : "Start Free"}</Btn>
            </>
          )}
        </div>
        <p style={{ color: T.textMuted, fontSize: 12, marginTop: 16 }}>Free plan available. No credit card required to start.</p>
      </div>

      {/* FOOTER */}
      <div style={{ padding: "32px 60px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>Deal<span style={{ color: T.gold }}>Desk</span></div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {[["Terms", "terms"], ["Privacy", "privacy"], ["Refund Policy", "refund"]].map(([label, page]) => (
              <span key={page} onClick={() => onLegal && onLegal(page)} style={{ fontSize: 12, color: T.textMuted, cursor: "pointer" }}
                onMouseEnter={e => e.target.style.color = T.text}
                onMouseLeave={e => e.target.style.color = T.textMuted}
              >{label}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>&copy; {new Date().getFullYear()} {CONFIG.BUSINESS_NAME}. All rights reserved.</div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, onLogout, mobileOpen, setMobileOpen, userName, userPlan }) {
  const NAV = [
    { id: "dashboard", icon: "⚡", label: "Dashboard" },
    { id: "pipeline", icon: "📋", label: "Pipeline" },
    { id: "brands", icon: "🤝", label: "Brands" },
    { id: "mediakit", icon: "🖼️", label: "Media Kit AI" },
    { id: "invoices", icon: "🧾", label: "Invoices AI" },
    { id: "analytics", icon: "📊", label: "Analytics" },
    { id: "autopilot", icon: "🤖", label: "AI Content" },
    { id: "negotiate", icon: "🤝", label: "Negotiate AI" },
    { id: "assistant", icon: "💬", label: "AI Assistant" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "#000A", zIndex: 199 }} />}
      <div className={`dd-sidebar${mobileOpen ? " open" : ""}`} style={{
      width: 220, minHeight: "100vh", background: T.bg2, borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", padding: "24px 0", position: "fixed", top: 0, left: 0, bottom: 0,
    }}>
      <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800 }}>
          Deal<span style={{ color: T.gold }}>Desk</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <LiveDot />
          <span style={{ fontSize: 11, color: T.textMuted }}>AI Ready</span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {NAV.map(item => (
          <div key={item.id} onClick={() => { setActive(item.id); setMobileOpen && setMobileOpen(false); }} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
            borderRadius: 8, marginBottom: 4, cursor: "pointer",
            background: active === item.id ? T.gold + "1A" : "transparent",
            color: active === item.id ? T.gold : T.textSub,
            borderLeft: active === item.id ? `3px solid ${T.gold}` : "3px solid transparent",
            fontWeight: active === item.id ? 600 : 400, fontSize: 14,
          }}
            onMouseEnter={e => { if (active !== item.id) { e.currentTarget.style.background = T.card; e.currentTarget.style.color = T.text; } }}
            onMouseLeave={e => { if (active !== item.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textSub; } }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.gold + "33", border: `2px solid ${T.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{userName || "Creator"}</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>{(userPlan||"free").charAt(0).toUpperCase() + (userPlan||"free").slice(1)} Plan</div>
          </div>
        </div>
        <Btn variant="ghost" size="sm" onClick={onLogout} style={{ width: "100%" }}>Sign Out</Btn>
      </div>
    </div>
    </>
  );
}

// ─── DASHBOARD VIEW ──────────────────────────────────────────────────────────
function DashboardView({ deals, brands, plan, onNavigate, showOnboarding, setShowOnboarding }) {
  const paid = deals.filter(d => d.stage === "paid");
  const active = deals.filter(d => d.stage !== "paid");
  const totalRevenue = paid.reduce((s, d) => s + d.value, 0);
  const pipelineValue = active.reduce((s, d) => s + d.value, 0);
  const avgDeal = deals.length ? Math.round(deals.reduce((s, d) => s + d.value, 0) / deals.length) : 0;
  const hasData = deals.length > 0;

  // Build real revenue by month from actual deals
  const revenueByMonth = {};
  paid.forEach(d => {
    if (d.due || d.created_at) {
      const date = new Date(d.due || d.created_at);
      const key = date.toLocaleDateString("en-US", { month: "short" });
      revenueByMonth[key] = (revenueByMonth[key] || 0) + d.value;
    }
  });
  const realRevenueData = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }));

  return (
    <div className="fade-in">
      <SectionTitle sub={hasData ? "Here\u2019s your business at a glance" : "Welcome! Add your first deal to get started"}>Dashboard Overview</SectionTitle>

      {showOnboarding && <OnboardingChecklist deals={deals} brands={brands} onNavigate={onNavigate} onDismiss={() => setShowOnboarding(false)} />}

      {hasData && (PLAN_LIMITS[plan] || PLAN_LIMITS.free).dealIntelligence && <DealIntelligence deals={deals} />}

      <div className="dd-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <Stat label="Pipeline Value" value={fmt$(pipelineValue)} sub={`${active.length} active deals`} icon="📋" />
        <Stat label="Total Earned" value={fmt$(totalRevenue)} sub={`${paid.length} deals paid`} color={T.green} icon="💰" />
        <Stat label="Avg Deal Size" value={fmt$(avgDeal)} sub={hasData ? "Your deals" : "Add deals to track"} color={T.blue} icon="📈" />
        <Stat label="Brands Tracked" value={brands.length} sub="In your CRM" color={T.purple} icon="🤝" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 24 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{hasData ? "Your Revenue" : "Creator Economy by Tier"}</div>
            {!hasData && <Badge color={T.blue}>Industry Data</Badge>}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hasData && realRevenueData.length ? realRevenueData : INDUSTRY_STATS.revenue}>
              <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${v / 1000}k` : `$${v}`} />
              <Tooltip contentStyle={{ background: T.card2, border: `1px solid ${T.border}`, borderRadius: 8 }} labelStyle={{ color: T.text }} itemStyle={{ color: T.gold }} formatter={v => [fmt$(v), hasData ? "Revenue" : "Avg Annual Income"]} />
              <Bar dataKey="revenue" fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {!hasData && <p style={{ fontSize: 11, color: T.textMuted, textAlign: "center", marginTop: 8 }}>Source: Influencer Marketing Hub 2024 — Average annual creator income by tier</p>}
        </Card>

        <Card>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Deal Pipeline</div>
          {STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage);
            const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
            const pct = deals.length ? (stageDeals.length / deals.length) * 100 : 0;
            return (
              <div key={stage} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: STAGE_COLORS[stage], fontWeight: 600 }}>{STAGE_LABELS[stage]}</span>
                  <span style={{ color: T.textSub }}>{stageDeals.length} · {fmt$(stageValue)}</span>
                </div>
                <div style={{ background: T.border, borderRadius: 4, height: 6 }}>
                  <div style={{ background: STAGE_COLORS[stage], borderRadius: 4, height: 6, width: `${pct}%`, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
          {!hasData && <p style={{ fontSize: 12, color: T.textMuted, marginTop: 12, textAlign: "center" }}>Go to Pipeline → + New Deal to start</p>}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{hasData ? "Your Top Brands" : "Getting Started"}</div>
          </div>
          {hasData ? (
            [...brands].sort((a, b) => (b.totalValue||0) - (a.totalValue||0)).slice(0, 5).map(b => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: T.gold + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: T.gold }}>{b.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{b.industry}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.gold }}>{fmt$(b.totalValue)}</div>
              </div>
            ))
          ) : (
            [
              { icon: "📋", text: "Add your first brand deal in Pipeline", color: T.gold },
              { icon: "🤝", text: "Track brand contacts in Brands CRM", color: T.blue },
              { icon: "🖼️", text: "Generate an AI media kit to pitch brands", color: T.purple },
              { icon: "🧾", text: "Create professional invoices with AI", color: T.green },
              { icon: "💬", text: "Ask the AI Assistant for deal negotiation tips", color: T.textSub },
            ].map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: a.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{a.icon}</div>
                <div style={{ fontSize: 13, color: T.text }}>{a.text}</div>
              </div>
            ))
          )}
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{hasData ? "Avg Deal by Platform" : "Avg Brand Deal by Platform"}</div>
            {!hasData && <Badge color={T.blue}>Industry Data</Badge>}
          </div>
          {(hasData ? (() => {
            const byCategory = deals.reduce((acc, d) => { acc[d.category || "Other"] = (acc[d.category || "Other"] || 0) + d.value; return acc; }, {});
            return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
          })() : INDUSTRY_STATS.avgDealByPlatform).map((item, i) => (
            <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: T.textSub }}>{item.name}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.gold }}>{fmt$(item.value)}</span>
            </div>
          ))}
          {!hasData && <p style={{ fontSize: 11, color: T.textMuted, textAlign: "center", marginTop: 8 }}>Source: Influencer Marketing Hub 2024 — Average brand deal by platform</p>}
        </Card>
      </div>
    </div>
  );
}

// ─── PIPELINE (KANBAN) ───────────────────────────────────────────────────────
function PipelineView({ deals, setDeals, userId, plan, onUpgrade }) {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editDeal, setEditDeal] = useState(null);
  const [newDeal, setNewDeal] = useState({ brand: "", contact: "", value: "", deliverable: "", due: "", stage: "pitched", notes: "", category: "" });

  const handleDragStart = (deal) => setDragging(deal);
  const handleDragOver = (e, stage) => { e.preventDefault(); setDragOver(stage); };
  const handleDrop = (e, stage) => {
    e.preventDefault();
    if (dragging) {
      setDeals(prev => prev.map(d => d.id === dragging.id ? { ...d, stage } : d));
      if (userId) supabase.from("deals").update({ stage }).eq("id", dragging.id);
      setDragging(null);
      setDragOver(null);
    }
  };

  const addDeal = async () => {
    if (!newDeal.brand || !newDeal.value) return;
    if (atLimit(plan, deals.length, "deals")) { onUpgrade(); return; }
    setAdding(true);
    const deal = { ...newDeal, value: parseInt(newDeal.value) || 0 };
    if (userId) {
      const { data } = await supabase.from("deals").insert({ ...deal, user_id: userId }).select().single();
      if (data) setDeals(prev => [...prev, data]);
    } else {
      setDeals(prev => [...prev, { ...deal, id: Date.now() }]);
    }
    setNewDeal({ brand: "", contact: "", value: "", deliverable: "", due: "", stage: "pitched", notes: "", category: "" });
    setShowAdd(false);
    setAdding(false);
  };

  const saveDeal = async (updated) => {
    setDeals(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated, value: parseInt(updated.value) || 0 } : d));
    if (userId) supabase.from("deals").update({ brand: updated.brand, contact: updated.contact, value: parseInt(updated.value)||0, deliverable: updated.deliverable, due: updated.due, notes: updated.notes, category: updated.category, stage: updated.stage }).eq("id", updated.id);
    setEditDeal(null);
  };

  const doDeleteDeal = (id) => {
    setDeals(prev => prev.filter(d => d.id !== id));
    if (userId) supabase.from("deals").delete().eq("id", id);
    setConfirmDelete(null);
  };
  const moveDeal = (deal, dir) => {
    const idx = STAGES.indexOf(deal.stage);
    const newStage = STAGES[idx + dir];
    if (newStage) {
      setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: newStage } : d));
      if (userId) supabase.from("deals").update({ stage: newStage }).eq("id", deal.id);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <SectionTitle sub={`${deals.length} deals · ${fmt$(deals.reduce((s, d) => s + d.value, 0))} total pipeline`}>Deal Pipeline</SectionTitle>
        <Btn onClick={() => atLimit(plan, deals.length, "deals") ? onUpgrade() : setShowAdd(true)}>+ New Deal</Btn>
      </div>

      {atLimit(plan, deals.length, "deals") && (
        <div style={{ background: T.gold + "11", border: `1px solid ${T.gold}33`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: T.gold }}>⚡ You've reached {PLAN_LIMITS[plan]?.deals || 3} deals on the Free plan</span>
          <Btn size="sm" onClick={onUpgrade}>Upgrade</Btn>
        </div>
      )}

      <Input value={search} onChange={setSearch} placeholder="Search deals by brand, contact, deliverable..." style={{ marginBottom: 16 }} />

      {confirmDelete && <ConfirmDialog message="Delete this deal?" onConfirm={() => doDeleteDeal(confirmDelete)} onCancel={() => setConfirmDelete(null)} />}

      {/* Edit Deal Modal */}
      {editDeal && (
        <div style={{ position: "fixed", inset: 0, background: "#000A", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <Card style={{ width: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700 }}>Edit Deal</div>
              <Btn variant="ghost" size="sm" onClick={() => setEditDeal(null)}>✕</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Brand Name</div><Input value={editDeal.brand} onChange={v => setEditDeal(p => ({ ...p, brand: v }))} /></div>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Deal Value</div><Input value={editDeal.value} onChange={v => setEditDeal(p => ({ ...p, value: v }))} type="number" /></div>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Contact</div><Input value={editDeal.contact||""} onChange={v => setEditDeal(p => ({ ...p, contact: v }))} /></div>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Category</div><Input value={editDeal.category||""} onChange={v => setEditDeal(p => ({ ...p, category: v }))} /></div>
              <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Deliverable</div><Input value={editDeal.deliverable||""} onChange={v => setEditDeal(p => ({ ...p, deliverable: v }))} /></div>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Due Date</div><Input value={editDeal.due||""} onChange={v => setEditDeal(p => ({ ...p, due: v }))} type="date" /></div>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Stage</div>
                <select value={editDeal.stage} onChange={e => setEditDeal(p => ({ ...p, stage: e.target.value }))} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, width: "100%" }}>
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Notes</div><Textarea value={editDeal.notes||""} onChange={v => setEditDeal(p => ({ ...p, notes: v }))} rows={2} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="secondary" onClick={() => setEditDeal(null)}>Cancel</Btn>
              <Btn onClick={() => saveDeal(editDeal)}>Save Changes</Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Column totals */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {STAGES.map(stage => {
          const sd = deals.filter(d => d.stage === stage);
          return (
            <div key={stage} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: STAGE_COLORS[stage], fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{STAGE_LABELS[stage]}</div>
              <div style={{ fontSize: 13, color: T.textSub }}>{fmt$(sd.reduce((s, d) => s + d.value, 0))}</div>
            </div>
          );
        })}
      </div>

      {/* Kanban */}
      <div className="dd-kanban" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16 }}>
        {STAGES.map(stage => (
          <div key={stage}
            onDragOver={e => handleDragOver(e, stage)}
            onDrop={e => handleDrop(e, stage)}
            style={{
              minWidth: 220, flex: 1, background: dragOver === stage ? T.gold + "0A" : T.bg2,
              border: `1px solid ${dragOver === stage ? T.gold : T.border}`, borderRadius: 12,
              padding: 12, transition: "all 0.2s",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: STAGE_COLORS[stage], textTransform: "uppercase", letterSpacing: 1 }}>
                {STAGE_LABELS[stage]}
              </div>
              <Badge color={STAGE_COLORS[stage]}>{deals.filter(d => d.stage === stage).length}</Badge>
            </div>

            {deals.filter(d => d.stage === stage && (!search || (d.brand||"").toLowerCase().includes(search.toLowerCase()) || (d.contact||"").toLowerCase().includes(search.toLowerCase()) || (d.deliverable||"").toLowerCase().includes(search.toLowerCase()))).map(deal => (
              <div key={deal.id} draggable
                onDragStart={() => handleDragStart(deal)}
                style={{
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14,
                  marginBottom: 8, cursor: "grab", opacity: dragging?.id === deal.id ? 0.5 : 1,
                  transition: "all 0.2s",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{deal.brand}</div>
                  <div style={{ color: T.gold, fontWeight: 700, fontSize: 13 }}>{fmt$(deal.value)}</div>
                </div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>{deal.contact}</div>
                {deal.deliverable && <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, background: T.bg, borderRadius: 4, padding: "3px 6px" }}>{deal.deliverable}</div>}
                {deal.due && <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Due: {fmtDate(deal.due)}</div>}
                <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                  <Btn size="sm" variant="ghost" onClick={() => moveDeal(deal, -1)} disabled={STAGES.indexOf(deal.stage) === 0} style={{ padding: "3px 8px", fontSize: 11 }}>←</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => moveDeal(deal, 1)} disabled={STAGES.indexOf(deal.stage) === 4} style={{ padding: "3px 8px", fontSize: 11 }}>→</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setEditDeal({...deal, value: String(deal.value)})} style={{ padding: "3px 8px", fontSize: 11 }}>✎</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setConfirmDelete(deal.id)} style={{ padding: "3px 8px", fontSize: 11, color: T.red }}>✕</Btn>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add Deal Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "#000A", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <Card style={{ width: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700 }}>Add New Deal</div>
              <Btn variant="ghost" size="sm" onClick={() => setShowAdd(false)}>✕</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Brand Name *</div><Input value={newDeal.brand} onChange={v => setNewDeal(p => ({ ...p, brand: v }))} placeholder="Nike, Spotify..." /></div>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Deal Value *</div><Input value={newDeal.value} onChange={v => setNewDeal(p => ({ ...p, value: v }))} placeholder="5000" type="number" /></div>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Contact Name</div><Input value={newDeal.contact} onChange={v => setNewDeal(p => ({ ...p, contact: v }))} placeholder="John Smith" /></div>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Category</div><Input value={newDeal.category} onChange={v => setNewDeal(p => ({ ...p, category: v }))} placeholder="SaaS, Fashion..." /></div>
              <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Deliverable</div><Input value={newDeal.deliverable} onChange={v => setNewDeal(p => ({ ...p, deliverable: v }))} placeholder="2x Instagram Reels" /></div>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Due Date</div><Input value={newDeal.due} onChange={v => setNewDeal(p => ({ ...p, due: v }))} type="date" /></div>
              <div>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Stage</div>
                <select value={newDeal.stage} onChange={e => setNewDeal(p => ({ ...p, stage: e.target.value }))} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, width: "100%" }}>
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Notes</div><Textarea value={newDeal.notes} onChange={v => setNewDeal(p => ({ ...p, notes: v }))} placeholder="Any notes about this deal..." rows={3} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Btn>
              <Btn onClick={addDeal} disabled={adding}>{adding ? "Adding..." : "Add Deal"}</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── BRANDS CRM ──────────────────────────────────────────────────────────────
function BrandsView({ brands, setBrands, userId, plan, onUpgrade }) {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [newBrand, setNewBrand] = useState({ name: "", industry: "", contact: "", email: "", rating: 5 });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = brands.filter(b =>
    (b.name||"").toLowerCase().includes(search.toLowerCase()) ||
    (b.industry||"").toLowerCase().includes(search.toLowerCase())
  );

  const addBrand = async () => {
    if (!newBrand.name) return;
    if (atLimit(plan, brands.length, "brands")) { onUpgrade(); return; }
    const brand = { ...newBrand, totalDeals: 0, totalValue: 0, lastDeal: new Date().toISOString().split("T")[0] };
    if (userId) {
      const { data } = await supabase.from("brands").insert({
        name: brand.name, industry: brand.industry, contact: brand.contact, email: brand.email,
        rating: brand.rating, total_deals: 0, total_value: 0, last_deal: brand.lastDeal, user_id: userId,
      }).select().single();
      if (data) setBrands(prev => [...prev, { ...data, totalDeals: data.total_deals, totalValue: data.total_value, lastDeal: data.last_deal }]);
    } else {
      setBrands(prev => [...prev, { ...brand, id: Date.now() }]);
    }
    setNewBrand({ name: "", industry: "", contact: "", email: "", rating: 5 });
    setShowAdd(false);
  };

  const doRemoveBrand = (id) => {
    setBrands(prev => prev.filter(br => br.id !== id));
    if (userId) supabase.from("brands").delete().eq("id", id);
    setConfirmDelete(null);
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <SectionTitle sub={`${brands.length} brand partners in your CRM`}>Brand Contacts</SectionTitle>
        <Btn onClick={() => setShowAdd(true)}>+ Add Brand</Btn>
      </div>

      <Input value={search} onChange={setSearch} placeholder="Search brands, industries..." style={{ marginBottom: 16 }} />

      {confirmDelete && <ConfirmDialog message="Remove this brand?" onConfirm={() => doRemoveBrand(confirmDelete)} onCancel={() => setConfirmDelete(null)} />}

      {/* Mobile card view */}
      <div className="dd-brands-cards" style={{ display: "none" }}>
        {filtered.map(b => (
          <Card key={b.id} style={{ marginBottom: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: T.gold + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: T.gold, fontSize: 16 }}>{(b.name||"?")[0]}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{b.industry || "—"} · {b.contact || "—"}</div>
                </div>
              </div>
              <Btn size="sm" variant="ghost" onClick={() => setConfirmDelete(b.id)} style={{ color: T.red, fontSize: 11 }}>✕</Btn>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: T.textSub }}>
              <span>{b.totalDeals||0} deals</span>
              <span style={{ color: T.gold, fontWeight: 600 }}>{fmt$(b.totalValue||0)}</span>
              <span style={{ color: T.gold }}>{"★".repeat(b.rating||0)}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="dd-brands-table" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.bg2 }}>
              {["Brand", "Industry", "Contact", "Total Deals", "Total Value", "Last Deal", "Rating", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => (
              <tr key={b.id} style={{ borderTop: `1px solid ${T.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = T.card2}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: T.gold + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: T.gold, fontSize: 14 }}>{(b.name||"?")[0]}</div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}><Badge color={T.blue}>{b.industry}</Badge></td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: T.textSub }}>{b.contact}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, textAlign: "center" }}>{b.totalDeals}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: T.gold }}>{fmt$(b.totalValue)}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: T.textSub }}>{fmtDate(b.lastDeal)}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: T.gold }}>{"★".repeat(b.rating)}{"☆".repeat(5 - b.rating)}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <Btn size="sm" variant="ghost" onClick={() => setConfirmDelete(b.id)} style={{ color: T.red }}>Remove</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "#000A", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <Card style={{ width: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700 }}>Add Brand Partner</div>
              <Btn variant="ghost" size="sm" onClick={() => setShowAdd(false)}>✕</Btn>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Brand Name", "name", "Nike, Spotify..."], ["Industry", "industry", "SaaS, Fashion..."], ["Contact Name", "contact", "John Smith"], ["Email", "email", "john@brand.com"]].map(([l, k, ph]) => (
                <div key={k}>
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>{l}</div>
                  <Input value={newBrand[k]} onChange={v => setNewBrand(p => ({ ...p, [k]: v }))} placeholder={ph} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <Btn variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Btn>
              <Btn onClick={addBrand}>Add Brand</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── MEDIA KIT AI ────────────────────────────────────────────────────────────
function MediaKitView({ aiLimitHit, trackAiCall }) {
  const [form, setForm] = useState({
    name: "", handle: "", platform: "",
    followers: "", avgViews: "", engagementRate: "",
    niche: "", location: "",
    pastBrands: "", rates: "",
  });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setOutput("");
    const prompt = `Generate a professional media kit for a content creator with these stats:
Name: ${form.name}
Handle: ${form.handle}
Platforms: ${form.platform}
Followers: ${form.followers}
Avg Views: ${form.avgViews}
Engagement Rate: ${form.engagementRate}%
Niche: ${form.niche}
Location: ${form.location}
Past Brand Partners: ${form.pastBrands}
Rates: ${form.rates}

Write a complete, professional media kit that includes:
1. Creator bio (2-3 sentences, compelling)
2. Key stats summary
3. Audience demographics section
4. Content pillars (3-4)
5. Brand partnership packages with rates
6. Why brands love working with this creator
7. Call to action

Make it sound premium, confident, and conversion-focused. Format with clear sections using headers.`;

    const result = await callClaude(prompt, "You are an expert brand partnerships consultant who writes compelling media kits for content creators. Write professionally and persuasively.");
    if (trackAiCall) trackAiCall();
    setOutput(result);
    setLoading(false);
  };

  const fields = [
    ["Creator Name", "name"], ["Handle", "handle"], ["Platforms", "platform"],
    ["Total Followers", "followers"], ["Avg Views/Post", "avgViews"], ["Engagement Rate %", "engagementRate"],
    ["Niche", "niche"], ["Location", "location"],
  ];

  return (
    <div className="fade-in">
      <SectionTitle sub="Generate a professional media kit in seconds with AI">AI Media Kit Builder</SectionTitle>
      {aiLimitHit && <div style={{ background: T.red + "11", border: `1px solid ${T.red}33`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: T.red }}>⚡ You've used all your AI calls this month. Upgrade to Pro for more.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Your Creator Stats</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {fields.map(([l, k]) => (
                <div key={k}>
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>{l}</div>
                  <Input value={form[k]} onChange={v => setForm(p => ({ ...p, [k]: v }))} placeholder={l} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Past Brand Partners</div>
              <Input value={form.pastBrands} onChange={v => setForm(p => ({ ...p, pastBrands: v }))} placeholder="Nike, Spotify, Notion..." />
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Rates (describe your packages)</div>
              <Textarea value={form.rates} onChange={v => setForm(p => ({ ...p, rates: v }))} placeholder="Videos $5K, Posts $2K, Stories $1K" rows={2} />
            </div>
          </Card>
          <Btn onClick={generate} disabled={loading || !form.name || !form.followers} style={{ width: "100%" }} size="lg">
            {loading ? "✨ Generating your media kit..." : !form.name || !form.followers ? "Fill in Name & Followers to generate" : "✨ Generate AI Media Kit"}
          </Btn>
          {loading && <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}><Spinner /></div>}
        </div>

        <Card style={{ minHeight: 400, background: output ? T.card : T.bg2 }}>
          {!output && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, color: T.textMuted, textAlign: "center", gap: 12 }}>
              <div style={{ fontSize: 48 }}>🖼️</div>
              <div style={{ fontSize: 16 }}>Your AI-generated media kit will appear here</div>
              <div style={{ fontSize: 13 }}>Fill in your stats and click Generate</div>
            </div>
          )}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 16 }}>
              <Spinner />
              <div style={{ color: T.textSub, fontSize: 14 }}>AI is crafting your media kit...</div>
            </div>
          )}
          {output && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Badge color={T.green}>✓ Generated</Badge>
                <Btn size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(output)}>Copy</Btn>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: T.textSub, whiteSpace: "pre-wrap" }}>{output}</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── INVOICES AI ─────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
];

function exportInvoicePDF(invoiceText, creatorName, brandName, invoiceNum) {
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to export PDF."); return; }
  win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoiceNum}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; padding: 48px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #E8A020; }
  .logo { font-size: 28px; font-weight: 700; }
  .logo span { color: #E8A020; }
  .invoice-label { font-size: 32px; font-weight: 700; color: #888; text-align: right; }
  .meta { text-align: right; font-size: 13px; color: #666; margin-top: 8px; }
  pre { white-space: pre-wrap; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.8; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; text-align: center; }
  @media print { body { padding: 24px; } @page { margin: 0.75in; } }
</style></head><body>
<div class="header">
  <div><div class="logo">Deal<span>Desk</span></div><div style="font-size:13px;color:#666;margin-top:4px">${creatorName || "DealDesk"}</div></div>
  <div><div class="invoice-label">INVOICE</div><div class="meta">${invoiceNum}<br>${new Date().toLocaleDateString()}</div></div>
</div>
<pre>${invoiceText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
<div class="footer">Generated with DealDesk · dealdesk.com</div>
<script>window.onload = () => { window.print(); }</script>
</body></html>`);
  win.document.close();
}

function InvoicesView({ deals, user, aiLimitHit, trackAiCall, plan }) {
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [creatorInfo, setCreatorInfo] = useState({ name: "", address: "", email: user?.email || "", paymentTerms: "Net 30" });
  const [currency, setCurrency] = useState("USD");
  const [invoice, setInvoice] = useState("");
  const [loading, setLoading] = useState(false);

  // Load profile data for invoice
  useEffect(() => {
    if (user?.id) {
      supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
        if (data) setCreatorInfo(prev => ({
          ...prev,
          name: data.business_name || data.full_name || prev.name,
          email: data.email || prev.email,
        }));
      });
    }
  }, [user]);

  const cur = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const fmtCur = (n) => `${cur.symbol}${n.toLocaleString()}`;
  const paidDeals = deals.filter(d => d.stage !== "pitched");

  const generateInvoice = async () => {
    if (!selectedDeal) return;
    setLoading(true);
    setInvoice("");
    const deal = deals.find(d => d.id === selectedDeal);
    const invoiceNum = `INV-${String(deal.id).replace(/-/g, "").substring(0, 6).toUpperCase()}`;
    const prompt = `Generate a professional invoice for a brand deal. Format it as a proper business invoice with:

CREATOR (Bill From):
Name: ${creatorInfo.name || "[Your Business Name]"}
Address: ${creatorInfo.address || "[Your Address]"}
Email: ${creatorInfo.email}

CLIENT (Bill To):
Brand: ${deal.brand}
Contact: ${deal.contact || "[Contact Name]"}

DEAL DETAILS:
Service: ${deal.deliverable || "Content Creation Services"}
Amount: ${fmtCur(deal.value)} ${cur.code}
Due Date: ${deal.due || "Net 30 from invoice date"}
Payment Terms: ${creatorInfo.paymentTerms}
Currency: ${cur.code} (${cur.name})

Invoice Number: ${invoiceNum}
Invoice Date: ${new Date().toLocaleDateString()}

Include:
- Professional invoice header
- Itemized line items for the deliverables
- Subtotal, any applicable taxes, and total (all amounts in ${cur.symbol} ${cur.code})
- Payment instructions section
- Professional closing note

Format cleanly with clear sections. Use ${cur.symbol} symbol for ALL amounts. Make it look like a real professional invoice.`;

    const result = await callClaude(prompt, "You are a professional invoicing assistant. Generate clean, professional invoices for freelancers and content creators. Be precise and formal. Use the specified currency symbol for all monetary amounts.");
    if (trackAiCall) trackAiCall();
    setInvoice(result);
    setLoading(false);
  };

  const deal = selectedDeal ? deals.find(d => d.id === selectedDeal) : null;
  const invoiceNum = deal ? `INV-${String(deal.id).replace(/-/g, "").substring(0, 6).toUpperCase()}` : "";

  return (
    <div className="fade-in">
      <SectionTitle sub="Generate professional invoices in any currency — export as PDF">AI Invoice Generator</SectionTitle>

      <div className="dd-invoice-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Your Info</div>
            {[["Your Name / Business", "name"], ["Address", "address"], ["Email", "email"], ["Payment Terms", "paymentTerms"]].map(([l, k]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>{l}</div>
                <Input value={creatorInfo[k]} onChange={v => setCreatorInfo(p => ({ ...p, [k]: v }))} placeholder={l} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Currency</div>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{
                background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px",
                color: T.text, fontSize: 14, width: "100%", fontFamily: "'DM Sans', sans-serif", outline: "none",
              }}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>
                ))}
              </select>
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Select Deal</div>
            {paidDeals.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: T.textMuted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 14, marginBottom: 4 }}>No deals available for invoicing</div>
                <div style={{ fontSize: 12 }}>Add deals in Pipeline and move them past "Pitched" stage to create invoices.</div>
              </div>
            ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {paidDeals.map(d => (
                <div key={d.id} onClick={() => setSelectedDeal(d.id)} style={{
                  padding: 12, borderRadius: 8, border: `2px solid ${selectedDeal === d.id ? T.gold : T.border}`,
                  background: selectedDeal === d.id ? T.gold + "11" : T.bg2,
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{d.brand}</div>
                    <div style={{ color: T.gold, fontWeight: 700 }}>{fmtCur(d.value)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSub, marginTop: 4 }}>{d.deliverable || "Content Creation"}</div>
                  <Badge color={STAGE_COLORS[d.stage]} style={{ marginTop: 6 }}>{STAGE_LABELS[d.stage]}</Badge>
                </div>
              ))}
            </div>
            )}
          </Card>

          <Btn onClick={generateInvoice} disabled={!selectedDeal || loading} size="lg">
            {loading ? "Generating invoice..." : `🧾 Generate Invoice (${cur.code})`}
          </Btn>
        </div>

        <Card style={{ background: invoice ? "#FAFAF8" : T.bg2, minHeight: 500 }}>
          {!invoice && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, color: T.textMuted, textAlign: "center", gap: 12 }}>
              <div style={{ fontSize: 48 }}>🧾</div>
              <div style={{ fontSize: 16 }}>Select a deal and click Generate Invoice</div>
              <div style={{ fontSize: 13 }}>AI will create a professional invoice in {cur.code}</div>
            </div>
          )}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 16 }}>
              <Spinner />
              <div style={{ color: T.textSub }}>Drafting professional invoice in {cur.code}...</div>
            </div>
          )}
          {invoice && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge color={T.green}>✓ Invoice Ready</Badge>
                  <Badge color={T.blue}>{cur.code}</Badge>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(invoice)}>📋 Copy</Btn>
                  {(PLAN_LIMITS[plan] || PLAN_LIMITS.free).pdfExport ? (
                    <Btn size="sm" variant="primary" onClick={() => exportInvoicePDF(invoice, creatorInfo.name, deal?.brand, invoiceNum)}>📄 Export PDF</Btn>
                  ) : (
                    <Btn size="sm" variant="ghost" onClick={() => alert("PDF export is available on Pro and Business plans. Upgrade in Settings.")} style={{ opacity: 0.6 }}>📄 PDF (Pro)</Btn>
                  )}
                </div>
              </div>
              <pre style={{ fontSize: 12, lineHeight: 1.8, color: "#333", fontFamily: "'DM Mono', 'Courier New', monospace", whiteSpace: "pre-wrap", background: "#FAFAF8" }}>{invoice}</pre>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
function AnalyticsView({ deals }) {
  const hasData = deals.length > 0;
  const byCategory = deals.reduce((acc, d) => {
    acc[d.category || "Other"] = (acc[d.category || "Other"] || 0) + d.value;
    return acc;
  }, {});
  const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = [T.gold, T.blue, T.green, T.purple, T.red, T.textSub];

  const funnelData = STAGES.map(stage => ({
    name: STAGE_LABELS[stage],
    value: deals.filter(d => STAGES.indexOf(d.stage) >= STAGES.indexOf(stage)).length,
    fill: STAGE_COLORS[stage],
  }));

  const conversionRate = deals.length ? Math.round((deals.filter(d => d.stage === "paid").length / deals.length) * 100) : 0;
  const paidDeals = deals.filter(d => d.stage === "paid");
  const bestMonth = paidDeals.length ? fmt$(Math.max(...paidDeals.map(d => d.value))) : "$0";
  const totalWon = paidDeals.length;

  // Real revenue by month from deals
  const revenueByMonth = {};
  deals.forEach(d => {
    if (d.due || d.created_at) {
      const date = new Date(d.due || d.created_at);
      const key = date.toLocaleDateString("en-US", { month: "short" });
      revenueByMonth[key] = (revenueByMonth[key] || 0) + d.value;
    }
  });
  const realRevenueData = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }));

  // Real deals by month
  const dealsByMonth = {};
  deals.forEach(d => {
    if (d.due || d.created_at) {
      const key = new Date(d.due || d.created_at).toLocaleDateString("en-US", { month: "short" });
      dealsByMonth[key] = (dealsByMonth[key] || 0) + 1;
    }
  });
  const realDealsByMonth = Object.entries(dealsByMonth).map(([month, count]) => ({ month, deals: count }));

  return (
    <div className="fade-in">
      <SectionTitle sub={hasData ? "Deep dive into your revenue and deal performance" : "Industry benchmarks — your data will appear as you add deals"}>Analytics & Insights</SectionTitle>

      <div className="dd-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <Stat label="Conversion Rate" value={hasData ? `${conversionRate}%` : "~25%"} sub={hasData ? "Pitch to paid" : "Industry avg"} color={T.green} icon="📈" />
        <Stat label="Avg Deal Cycle" value={hasData ? `${deals.length > 2 ? "~21d" : "N/A"}` : "21\u201330 days"} sub={hasData ? "Your deals" : "Industry avg"} color={T.blue} icon="⏱️" />
        <Stat label={hasData ? "Best Deal" : "Avg Deal Size"} value={hasData ? bestMonth : "$2,500"} sub={hasData ? "Highest paid" : "Micro-influencer avg"} color={T.gold} icon="🏆" />
        <Stat label="Deals Won" value={hasData ? totalWon : "N/A"} sub={hasData ? "All time" : "Add deals to track"} color={T.purple} icon="✅" />
      </div>

      <div className="dd-chart-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{hasData ? "Your Revenue Trend" : "Creator Economy Market Size ($B)"}</div>
            {!hasData && <Badge color={T.blue}>Industry Data</Badge>}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hasData && realRevenueData.length ? realRevenueData : INDUSTRY_STATS.marketGrowth}>
              <defs>
                <linearGradient id="goldGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.gold} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={T.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => hasData ? (v >= 1000 ? `$${v/1000}k` : `$${v}`) : `$${v/1000}B`} />
              <Tooltip contentStyle={{ background: T.card2, border: `1px solid ${T.border}`, borderRadius: 8 }} itemStyle={{ color: T.gold }} formatter={v => [hasData ? fmt$(v) : `$${(v/1000).toFixed(1)}B`, hasData ? "Revenue" : "Market Size"]} />
              <Area type="monotone" dataKey="revenue" stroke={T.gold} fill="url(#goldGrad2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          {!hasData && <p style={{ fontSize: 11, color: T.textMuted, textAlign: "center", marginTop: 4 }}>Source: Goldman Sachs / SignalFire — Influencer marketing market size in millions</p>}
        </Card>

        <Card>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>{hasData ? "Revenue by Category" : "Avg Deal by Platform"}</div>
          {hasData && categoryData.length ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: T.card2, border: `1px solid ${T.border}`, borderRadius: 8 }} formatter={v => [fmt$(v), "Revenue"]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {categoryData.map((c, i) => (
                  <div key={c.name} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={{ color: T.textSub }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {INDUSTRY_STATS.avgDealByPlatform.map((item, i) => (
                <div key={item.name} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: PIE_COLORS[i], fontWeight: 600 }}>{item.name}</span>
                    <span style={{ color: T.textSub }}>{fmt$(item.value)}</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 6 }}>
                    <div style={{ background: PIE_COLORS[i], borderRadius: 4, height: 6, width: `${(item.value / 4200) * 100}%` }} />
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 11, color: T.textMuted, textAlign: "center", marginTop: 8 }}>Source: Influencer Marketing Hub 2024</p>
            </>
          )}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>{hasData ? "Your Deals per Month" : "Add deals to see your monthly trend"}</div>
          {hasData && realDealsByMonth.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={realDealsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: T.card2, border: `1px solid ${T.border}`, borderRadius: 8 }} itemStyle={{ color: T.blue }} />
                <Bar dataKey="deals" fill={T.blue} radius={[4, 4, 0, 0]} name="Deals" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180, color: T.textMuted, fontSize: 14 }}>Add deals in Pipeline to see your chart here</div>
          )}
        </Card>

        <Card>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Deal Conversion Funnel</div>
          {funnelData.map(f => (
            <div key={f.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: f.fill, fontWeight: 600 }}>{f.name}</span>
                <span style={{ color: T.textSub }}>{f.value} deals</span>
              </div>
              <div style={{ background: T.border, borderRadius: 4, height: 8 }}>
                <div style={{ background: f.fill, borderRadius: 4, height: 8, width: deals.length ? `${(f.value / deals.length) * 100}%` : "0%", transition: "width 0.8s" }} />
              </div>
            </div>
          ))}
          {!hasData && <p style={{ fontSize: 12, color: T.textMuted, textAlign: "center", marginTop: 8 }}>Your funnel will populate as you add deals</p>}
        </Card>
      </div>
    </div>
  );
}

// ─── AI AUTOPILOT ─────────────────────────────────────────────────────────────
function AutopilotView({ aiLimitHit, trackAiCall }) {
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(null);
  const [generating, setGenerating] = useState(false);

  const runNow = async (template) => {
    setRunning(template.id);
    setGenerating(true);

    const prompts = {
      tweets: "Generate 3 engaging tweets about the creator economy and brand deals. Each should be standalone, under 280 chars, include a hashtag. Format as numbered list.",
      outreach: "Write a cold outreach email template to a brand partnership manager. Keep it concise, personal, and focused on creator value. Include subject line. Use [BRAND], [YOUR NAME], [YOUR NICHE], [FOLLOWER COUNT] as placeholders.",
      followup: "Write a professional follow-up email template for a brand deal that went quiet after initial interest. Be warm but create urgency. Keep it under 100 words. Use [BRAND] and [YOUR NAME] as placeholders.",
      analytics: "Write a weekly creator business report template. Include sections for: deals closed, revenue summary, top performing brand, and recommendations. Use placeholder brackets for data.",
      seo: "Write an SEO-optimized blog intro (150 words) for the topic: 'How to negotiate brand deals as a micro-influencer'. Include target keyword 3 times naturally.",
      social: "Write a LinkedIn post (200 words) about the business lessons from managing brand deals as a content creator. Professional tone, include a takeaway.",
    };

    const result = await callClaude(prompts[template.id] || "Generate relevant content for a creator business task.");
    const newLog = {
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      task: template.name,
      content: result.substring(0, 300) + (result.length > 300 ? "..." : ""),
      status: "success",
      full: result,
    };
    setLogs(prev => [newLog, ...prev]);
    setRunning(null);
    setGenerating(false);
  };

  const activeCount = automations.filter(a => a.active).length;

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <SectionTitle sub="Generate content drafts with AI — copy, customize, and post wherever you want">AI Content Generator</SectionTitle>
      </div>

      <div style={{ background: T.gold + "11", border: `1px solid ${T.gold}33`, borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: T.gold }}>
        💡 <strong>How it works:</strong> Click "Generate" to create a draft with AI. Copy the output and paste it into Twitter, LinkedIn, your email, etc. To schedule posts automatically, use Buffer or Make.com (see the Operations Manual).
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textSub, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>TEMPLATES</div>
          {AUTOPILOT_TEMPLATES.map(a => (
            <Card key={a.id} style={{ marginBottom: 12, padding: 16 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>{a.description}</div>
              <Btn size="sm" variant="primary" onClick={() => runNow(a)} disabled={running === a.id || generating} style={{ fontSize: 12, width: "100%" }}>
                {running === a.id ? "⏳ Generating..." : "✨ Generate"}
              </Btn>
            </Card>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textSub, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>GENERATED CONTENT</div>
          <Card style={{ background: T.bg2, padding: 0, overflow: "hidden", maxHeight: 680, overflowY: "auto" }}>
            {generating && (
              <div className="slide-in" style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, background: T.gold + "0A", display: "flex", gap: 12, alignItems: "center" }}>
                <Spinner />
                <span style={{ fontSize: 13, color: T.gold }}>AI is generating content...</span>
              </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="slide-in" style={{ padding: "14px 16px", borderBottom: i < logs.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textSub, textTransform: "uppercase", letterSpacing: 0.5 }}>{log.task}</span>
                  <span style={{ fontSize: 11, color: T.textMuted, marginLeft: "auto" }}>{log.time}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{log.content}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Btn size="sm" variant="ghost" style={{ fontSize: 11 }} onClick={() => navigator.clipboard?.writeText(log.full || log.content)}>📋 Copy</Btn>
                </div>
              </div>
            ))}
            {!generating && logs.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
                <div style={{ fontSize: 14 }}>No content generated yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Click "Generate" on any template to create AI content</div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}


// ─── AI NEGOTIATION COACH ────────────────────────────────────────────────
function NegotiateView({ deals, brands, aiLimitHit, trackAiCall }) {
  const [brandOffer, setBrandOffer] = useState("");
  const [context, setContext] = useState({ followers: "", platform: "Instagram", niche: "", currentRate: "" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const activeDeal = selectedDeal ? deals.find(d => d.id === selectedDeal) : null;

  const analyze = async () => {
    if (!brandOffer.trim() && !activeDeal) return;
    if (aiLimitHit) return;
    setLoading(true);
    setResult("");
    await trackAiCall();

    const dealContext = activeDeal ? `\nExisting deal context: ${activeDeal.brand}, ${activeDeal.deliverable || "content creation"}, current value $${activeDeal.value}, stage: ${activeDeal.stage}` : "";

    const prompt = `You are an expert creator economy negotiation coach. A content creator needs help negotiating a brand deal.

CREATOR STATS:
- Followers: ${context.followers || "Not specified"}
- Platform: ${context.platform}
- Niche: ${context.niche || "Not specified"}
- Current rate expectations: ${context.currentRate || "Not specified"}
${dealContext}

BRAND'S OFFER/MESSAGE:
${brandOffer || `Brand: ${activeDeal?.brand}, offering $${activeDeal?.value} for ${activeDeal?.deliverable}`}

Provide a detailed negotiation analysis:

1. OFFER ASSESSMENT: Is this offer fair, below market, or above market? Give a specific fair market range based on their follower count and platform.

2. RED FLAGS: Any concerning terms or missing elements in the offer?

3. COUNTER-OFFER STRATEGY: Specific dollar amount to counter with and reasoning.

4. COUNTER-OFFER EMAIL: Write a professional, friendly counter-offer email they can copy and send. Use [CREATOR NAME] and [BRAND CONTACT] as placeholders. The email should:
   - Thank them for the opportunity
   - Reference the value they bring (engagement, audience quality)
   - Present the counter-offer with justification
   - Be warm but confident
   - Include a specific call to action

5. NEGOTIATION TIPS: 2-3 specific tactical tips for this particular negotiation.

Be specific with numbers. Be direct. Help them get more money.`;

    const res = await callClaude(prompt, "You are the world's top creator economy negotiation coach. You've helped creators negotiate over $50M in brand deals. Be specific, tactical, and help them maximize their earnings. Always include exact dollar amounts and a ready-to-send email.");
    setResult(res);
    setLoading(false);
  };

  const negotiatingDeals = deals.filter(d => d.stage === "pitched" || d.stage === "negotiating");

  return (
    <div className="fade-in">
      <SectionTitle sub="Paste a brand's offer and get an AI-powered counter-offer with exact amounts">AI Negotiation Coach</SectionTitle>

      {aiLimitHit && (
        <div style={{ background: T.red + "22", border: `1px solid ${T.red}44`, borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: T.red }}>
          You've hit your AI call limit this month. Upgrade to Pro for 200 calls/month.
        </div>
      )}

      <div className="dd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Quick select from existing deals */}
          {negotiatingDeals.length > 0 && (
            <Card>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Quick Select: Your Active Deals</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {negotiatingDeals.map(d => (
                  <div key={d.id} onClick={() => { setSelectedDeal(d.id); setBrandOffer(`Brand: ${d.brand}, offering $${d.value} for ${d.deliverable || "content creation"}`); }}
                    style={{ padding: 10, borderRadius: 8, border: `2px solid ${selectedDeal === d.id ? T.gold : T.border}`, background: selectedDeal === d.id ? T.gold + "11" : T.bg2, cursor: "pointer", fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600 }}>{d.brand}</span>
                      <span style={{ color: T.gold }}>{fmt$(d.value)}</span>
                    </div>
                    {d.deliverable && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{d.deliverable}</div>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Your Stats</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>Followers</div>
                <Input value={context.followers} onChange={v => setContext(p => ({...p, followers: v}))} placeholder="50,000" /></div>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>Platform</div>
                <select value={context.platform} onChange={e => setContext(p => ({...p, platform: e.target.value}))} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, width: "100%" }}>
                  {["Instagram", "YouTube", "TikTok", "Twitter", "Podcast", "LinkedIn"].map(p => <option key={p}>{p}</option>)}
                </select></div>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>Niche</div>
                <Input value={context.niche} onChange={v => setContext(p => ({...p, niche: v}))} placeholder="Fitness, Tech..." /></div>
              <div><div style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>Your Rate</div>
                <Input value={context.currentRate} onChange={v => setContext(p => ({...p, currentRate: v}))} placeholder="$3,000" /></div>
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Brand's Offer</div>
            <Textarea value={brandOffer} onChange={setBrandOffer} placeholder="Paste the brand's email, DM, or offer details here...\n\nExample: 'Hi! We'd love to partner with you for our spring campaign. We're offering $2,000 for 2 Instagram Reels and 3 Stories...'" rows={6} />
          </Card>

          <Btn onClick={analyze} disabled={loading || aiLimitHit || (!brandOffer.trim() && !activeDeal)} size="lg" style={{ width: "100%" }}>
            {loading ? "\u2728 Analyzing offer..." : "\u2728 Get Counter-Offer Strategy"}
          </Btn>
        </div>

        <Card style={{ minHeight: 500, background: result ? T.card : T.bg2 }}>
          {!result && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 500, color: T.textMuted, textAlign: "center", gap: 12 }}>
              <div style={{ fontSize: 64 }}>\uD83E\uDD1D</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: T.text }}>AI Negotiation Coach</div>
              <div style={{ fontSize: 14, maxWidth: 300, lineHeight: 1.6 }}>Paste a brand's offer and your stats. Get a specific counter-offer amount and a ready-to-send email.</div>
            </div>
          )}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 500, gap: 16 }}>
              <Spinner />
              <div style={{ color: T.gold, fontSize: 14 }}>Analyzing the offer and crafting your counter-strategy...</div>
            </div>
          )}
          {result && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Badge color={T.green}>\u2713 Strategy Ready</Badge>
                <Btn size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(result)}>\uD83D\uDCCB Copy All</Btn>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: T.textSub, whiteSpace: "pre-wrap" }}>{result}</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────
function AssistantView({ deals, brands, aiLimitHit, trackAiCall }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I'm your DealDesk AI assistant. I can see your deals, brands, and pipeline data — or if you're just getting started, I can help you land your first brand deal.\n\nTry: *'How do I find brand deals?'* or *'Help me set my rates'* or *'Write me an outreach email'*" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const SUGGESTIONS = deals.length > 0 ? [
    "What deals should I prioritize?",
    "Write a follow-up for my latest deal",
    "How can I increase my rates?",
    "Analyze my best brand categories",
  ] : [
    "How do I find my first brand deal?",
    "What should I charge as a new creator?",
    "Write me a brand outreach email",
    "What do brands look for in creators?",
  ];

  const send = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    const totalValue = deals.reduce((s, d) => s + d.value, 0);
    const paidValue = deals.filter(d => d.stage === "paid").reduce((s, d) => s + d.value, 0);
    const context = deals.length > 0 ? `
CREATOR BUSINESS CONTEXT (real data):
- Total deals: ${deals.length} worth ${fmt$(totalValue)}
- Paid deals: ${deals.filter(d => d.stage === "paid").length} worth ${fmt$(paidValue)}
- Deals by stage: ${STAGES.map(s => `${STAGE_LABELS[s]}: ${deals.filter(d => d.stage === s).length}`).join(", ")}
- Brands: ${brands.slice(0, 5).map(b => `${b.name} (${b.industry})`).join(", ") || "None added yet"}
- Deal details: ${deals.slice(0, 5).map(d => `${d.brand} ${fmt$(d.value)} [${d.stage}]`).join(", ")}
` : `
CONTEXT: This creator just started using DealDesk. They have no deals or brands added yet. Help them get started — suggest how to find brand deals, set rates, and build their pipeline. Be encouraging and practical.
`;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Build conversation history for multi-turn memory (last 10 messages)
    const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    history.push({ role: "user", content: `${context}\n\nCreator question: ${msg}` });

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        messages: history,
        systemPrompt: "You are DealDesk AI, a smart business assistant for content creators. You have access to their deal pipeline, brand relationships, and revenue data. Give concise, actionable, business-focused advice. Use specific numbers from their context when relevant. Be direct, confident, and helpful.",
      }),
    });
    const data = await res.json();
    if (trackAiCall) trackAiCall();
    const reply = data.text || "Sorry, I couldn't process that. Try again.";
    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  return (
    <div className="fade-in" className="dd-assistant-height" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      <SectionTitle sub="Context-aware AI that knows your entire business">AI Business Assistant</SectionTitle>
      {aiLimitHit && <div style={{ background: T.red + "11", border: `1px solid ${T.red}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: T.red }}>⚡ Monthly AI limit reached. Upgrade for more calls.</div>}

      <Card style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 20, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && (
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.gold + "22", border: `2px solid ${T.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🤖</div>
              )}
              <div style={{
                maxWidth: "72%", padding: "12px 16px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role === "user" ? T.gold : T.card2,
                color: m.role === "user" ? "#000" : T.text, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap",
              }}>{m.content}</div>
              {m.role === "user" && (
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.blue + "22", border: `2px solid ${T.blue}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.gold + "22", border: `2px solid ${T.gold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
              <div style={{ background: T.card2, padding: "12px 16px", borderRadius: "16px 16px 16px 4px", display: "flex", gap: 6, alignItems: "center" }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.textMuted, animation: `pulse 1.4s ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div style={{ padding: "0 20px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 20, padding: "6px 14px",
                color: T.textSub, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
                onMouseEnter={e => { e.target.style.borderColor = T.gold; e.target.style.color = T.gold; }}
                onMouseLeave={e => { e.target.style.borderColor = T.border; e.target.style.color = T.textSub; }}
              >{s}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, display: "flex", gap: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask anything about your business..."
            style={{ flex: 1, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px", color: T.text, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none" }}
            onFocus={e => e.target.style.borderColor = T.gold}
            onBlur={e => e.target.style.borderColor = T.border}
          />
          <Btn onClick={() => send()} disabled={!input.trim() || loading || aiLimitHit} size="md">
            {loading ? <Spinner /> : "Send →"}
          </Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, onBack }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Get referral code from URL
  const refCode = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("ref") : null;

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!email) { setError("Please enter your email."); return; }
    if (mode !== "forgot" && !password) { setError("Please enter your password."); return; }
    if (mode !== "forgot" && password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data: signupData, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;

        // If we have a referral code, save it to the new user's profile
        if (refCode && signupData?.user?.id) {
          // Find the referrer by their code (first 8 chars of ID)
          const { data: profiles } = await supabase.from("profiles").select("id").limit(100);
          const referrer = profiles?.find(p => p.id.replace(/-/g, "").substring(0, 8).toUpperCase() === refCode.toUpperCase());
          if (referrer) {
            // Wait a moment for the trigger to create the profile, then update
            setTimeout(async () => {
              await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", signupData.user.id);
            }, 2000);
          }
        }

        setSuccess("Check your email to confirm your account, then sign in.");
        setMode("login");
      } else if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setSuccess("If that email exists, we've sent a password reset link.");
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div onClick={onBack} style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, cursor: "pointer" }}>
            Deal<span style={{ color: T.gold }}>Desk</span>
          </div>
          <p style={{ color: T.textSub, fontSize: 14, marginTop: 8 }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
          </p>
        </div>
        <Card style={{ padding: 28 }}>
          {error && <div style={{ background: T.red+"22", border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: T.red }}>{error}</div>}
          {success && <div style={{ background: T.green+"22", border: `1px solid ${T.green}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: T.green }}>{success}</div>}
          {mode === "signup" && (
            <div style={{ marginBottom: 14 }}><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Full Name</div><Input value={name} onChange={setName} placeholder="Your name" /></div>
          )}
          <div style={{ marginBottom: 14 }}><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Email</div><Input value={email} onChange={setEmail} placeholder="you@example.com" /></div>
          {mode !== "forgot" && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: T.textSub }}>Password</span>
                {mode === "login" && <span onClick={() => setMode("forgot")} style={{ fontSize: 12, color: T.gold, cursor: "pointer" }}>Forgot?</span>}
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, width: "100%", fontFamily: "'DM Sans', sans-serif", outline: "none" }}
                onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} />
            </div>
          )}
          <Btn onClick={handleSubmit} disabled={loading} style={{ width: "100%", marginTop: 8 }} size="lg">
            {loading ? <Spinner /> : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
          </Btn>
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: T.textSub }}>
            {mode === "login" ? <>Don't have an account? <span onClick={() => { setMode("signup"); setError(""); }} style={{ color: T.gold, cursor: "pointer" }}>Sign up</span></> :
              <>Have an account? <span onClick={() => { setMode("login"); setError(""); }} style={{ color: T.gold, cursor: "pointer" }}>Sign in</span></>}
          </div>
        </Card>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <span onClick={onBack} style={{ fontSize: 13, color: T.textMuted, cursor: "pointer" }}>&larr; Back to homepage</span>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS VIEW ──────────────────────────────────────────────────────────
function SettingsView({ user, onLogout, plan, deals, brands }) {
  const [profile, setProfile] = useState({ full_name: "", email: user?.email || "", business_name: "" });
  const [saved, setSaved] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [referralCredits, setReferralCredits] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile({ full_name: data.full_name || "", email: data.email, business_name: data.business_name || "" });
        // Generate referral code from user ID (first 8 chars)
        setReferralCode(user.id.replace(/-/g, "").substring(0, 8).toUpperCase());
      }
    });
    // Count referrals
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("referred_by", user.id)
      .then(({ count }) => setReferralCount(count || 0));
    // Count credits earned
    supabase.from("referral_credits").select("*", { count: "exact", head: true }).eq("referrer_id", user.id)
      .then(({ count }) => setReferralCredits(count || 0));
  }, [user]);

  const save = async () => {
    await supabase.from("profiles").update({ full_name: profile.full_name, business_name: profile.business_name }).eq("id", user.id);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const referralLink = typeof window !== "undefined" ? `${window.location.origin}?ref=${referralCode}` : "";
  const copyLink = () => {
    navigator.clipboard?.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fade-in">
      <SectionTitle sub="Manage your account, billing, and preferences">Settings</SectionTitle>
      <div className="dd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 800 }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Profile</div>
          {[["Display Name", "full_name"], ["Business Name", "business_name"]].map(([l, k]) => (
            <div key={k} style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>{l}</div>
              <Input value={profile[k]} onChange={v => setProfile(p => ({ ...p, [k]: v }))} placeholder={l} /></div>
          ))}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6 }}>Email <span style={{ fontSize: 10, color: T.textMuted }}>(managed by auth)</span></div>
            <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.textMuted, fontSize: 14 }}>{profile.email}</div>
          </div>
          <Btn onClick={save} style={{ marginTop: 8 }}>{saved ? "✓ Saved" : "Save Changes"}</Btn>
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Subscription</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Badge color={(plan||"free") === "free" ? T.textSub : (plan||"free") === "pro" ? T.gold : T.purple}>{((plan||"free")).charAt(0).toUpperCase() + (plan||"free").slice(1)} Plan</Badge>
          </div>
          <p style={{ fontSize: 13, color: T.textSub, marginBottom: 16, lineHeight: 1.6 }}>
            {(plan||"free") === "free" ? "Upgrade to unlock AI features, unlimited deals, and more." : "Manage billing, update payment methods, or cancel."}
          </p>
          {(plan||"free") === "free" ? (
            <Btn onClick={async () => {
              try {
                const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: "pro" }) });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              } catch {}
            }}>Upgrade to Pro — $49/mo</Btn>
          ) : (
            <Btn variant="secondary" onClick={() => window.open(CONFIG.STRIPE_PORTAL_URL, "_blank")}>Manage Billing</Btn>
          )}
          <Divider style={{ margin: "20px 0" }} />
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Data Export</div>
          {(PLAN_LIMITS[plan] || PLAN_LIMITS.free).dataExport ? (
            <>
              <p style={{ fontSize: 13, color: T.textSub, marginBottom: 12 }}>Download all your deals and brands as CSV.</p>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="ghost" size="sm" onClick={() => {
                  const csv = "Brand,Contact,Value,Stage,Deliverable,Due,Category,Notes\n" + (deals||[]).map(d => `"${d.brand||""}","${d.contact||""}",${d.value||0},"${d.stage||""}","${d.deliverable||""}","${d.due||""}","${d.category||""}","${d.notes||""}"`).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "dealdesk-deals.csv"; a.click();
                }}>📥 Export Deals</Btn>
                <Btn variant="ghost" size="sm" onClick={() => {
                  const csv = "Name,Industry,Contact,Email,Deals,Value,Rating\n" + (brands||[]).map(b => `"${b.name||""}","${b.industry||""}","${b.contact||""}","${b.email||""}",${b.totalDeals||0},${b.totalValue||0},${b.rating||0}`).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "dealdesk-brands.csv"; a.click();
                }}>📥 Export Brands</Btn>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: T.textMuted }}>CSV data export is available on the Business plan.</p>
          )}
          <Divider style={{ margin: "20px 0" }} />
          <Btn variant="ghost" onClick={onLogout} style={{ color: T.red, borderColor: T.red+"44" }}>Sign Out</Btn>
        </Card>
      </div>

      {/* REFERRAL PROGRAM */}
      <Card style={{ marginTop: 24, maxWidth: 800 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>🎁 Refer a Creator, Get Rewarded</div>
            <div style={{ fontSize: 13, color: T.textSub }}>When your referral upgrades to Pro, you both get 1 month free.</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge color={T.gold}>{referralCount} referred</Badge>
            {referralCredits > 0 && <Badge color={T.green}>{referralCredits} credits earned</Badge>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", background: T.bg2, borderRadius: 8, padding: "10px 14px", border: `1px solid ${T.border}` }}>
          <div style={{ flex: 1, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{referralLink}</div>
          <Btn size="sm" variant="primary" onClick={copyLink}>{copied ? "✓ Copied!" : "Copy Link"}</Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
          <div style={{ textAlign: "center", padding: 12, background: T.bg2, borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.gold, fontFamily: "'Syne', sans-serif" }}>{referralCount}</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>Friends Referred</div>
          </div>
          <div style={{ textAlign: "center", padding: 12, background: T.bg2, borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.green, fontFamily: "'Syne', sans-serif" }}>{referralCredits}</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>Credits Earned</div>
          </div>
          <div style={{ textAlign: "center", padding: 12, background: T.bg2, borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.blue, fontFamily: "'Syne', sans-serif" }}>${referralCredits * 49}</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>Value Earned</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── LEGAL PAGES ─────────────────────────────────────────────────────────────
const LS = { page:{minHeight:"100vh",background:"#fafafa",fontFamily:"-apple-system,sans-serif",color:"#1a1a2e",lineHeight:1.7}, hdr:{background:"#1a1a2e",padding:"40px 0",textAlign:"center"}, c:{maxWidth:760,margin:"0 auto",padding:"48px 24px 80px"}, h2:{fontSize:20,color:"#1a1a2e",margin:"36px 0 12px",paddingBottom:8,borderBottom:"2px solid #e8e8f0"}, p:{fontSize:15,color:"#444",marginBottom:12}, hl:{background:"#f0f4ff",borderLeft:"4px solid #2e75b6",padding:"16px 20px",borderRadius:"0 8px 8px 0",margin:"20px 0"}, ft:{textAlign:"center",color:"#999",fontSize:13,marginTop:48,paddingTop:24,borderTop:"1px solid #e8e8f0"} };

function TermsPage({ onBack }) { return (
  <div style={LS.page}><div style={{...LS.hdr}}><div onClick={onBack} style={{color:"#8a8aaf",cursor:"pointer",fontSize:13,marginBottom:8}}>&larr; Back</div><h1 style={{color:"#fff",fontSize:28,fontWeight:700,margin:0}}>Terms of Service</h1><p style={{color:"#8a8aaf",fontSize:14,marginTop:8}}>Last updated: March 2026</p></div><div style={LS.c}>
    <div style={LS.hl}><p style={{margin:0,color:"#2e75b6",fontWeight:500}}>By using DealDesk, you agree to these terms.</p></div>
    <h2 style={LS.h2}>1. Agreement</h2><p style={LS.p}>These Terms govern your use of DealDesk. By creating an account, you agree to be bound by them. You must be 18+.</p>
    <h2 style={LS.h2}>2. Service</h2><p style={LS.p}>DealDesk is an AI-powered CRM for content creators. AI outputs are informational only — not legal, financial, or professional advice.</p>
    <h2 style={LS.h2}>3. Accounts</h2><p style={LS.p}>You must provide accurate information, keep credentials secure, and accept responsibility for all activity under your account.</p>
    <h2 style={LS.h2}>4. Payment</h2><p style={LS.p}>Paid plans are billed monthly via Stripe. We may change pricing with 30 days notice. Cancel anytime — access continues until end of billing period.</p>
    <h2 style={LS.h2}>5. Refunds</h2><p style={LS.p}>7-day money-back guarantee on new subscriptions. See our Refund Policy for details.</p>
    <h2 style={LS.h2}>6. Acceptable Use</h2><p style={LS.p}>Don't violate laws, upload harmful content, reverse engineer the Service, or resell access.</p>
    <h2 style={LS.h2}>7. IP</h2><p style={LS.p}>We own the Service. You own your content. AI outputs are yours to use freely.</p>
    <h2 style={LS.h2}>8. Disclaimers</h2><p style={{...LS.p,fontWeight:500}}>THE SERVICE IS PROVIDED "AS IS." We don't guarantee AI accuracy, uptime, or fitness for any purpose.</p>
    <h2 style={LS.h2}>9. Liability</h2><p style={LS.p}>Our total liability shall not exceed what you paid us in the prior 12 months.</p>
    <h2 style={LS.h2}>10. Contact</h2><p style={{...LS.p,fontWeight:600}}>Email: {CONFIG.SUPPORT_EMAIL}</p>
    <div style={LS.ft}>&copy; {new Date().getFullYear()} {CONFIG.BUSINESS_NAME}</div>
  </div></div>);
}

function PrivacyPage({ onBack }) { return (
  <div style={LS.page}><div style={LS.hdr}><div onClick={onBack} style={{color:"#8a8aaf",cursor:"pointer",fontSize:13,marginBottom:8}}>&larr; Back</div><h1 style={{color:"#fff",fontSize:28,fontWeight:700,margin:0}}>Privacy Policy</h1><p style={{color:"#8a8aaf",fontSize:14,marginTop:8}}>Last updated: March 2026</p></div><div style={LS.c}>
    <div style={LS.hl}><p style={{margin:0,color:"#2e75b6",fontWeight:500}}>We collect only what's needed and never sell your data.</p></div>
    <h2 style={LS.h2}>1. Data We Collect</h2><p style={LS.p}><strong>You provide:</strong> name, email, password, deal content, support messages. <strong>Auto-collected:</strong> usage data, device info, cookies.</p>
    <h2 style={LS.h2}>2. How We Use It</h2><p style={LS.p}>To provide the Service, process AI analysis, handle payments, send emails (marketing only with consent), prevent fraud, and improve the product.</p>
    <h2 style={LS.h2}>3. Your Deal Content</h2><div style={LS.hl}><p style={{margin:0,color:"#2e75b6",fontWeight:500}}>Encrypted in transit and at rest. NOT used to train AI. NEVER sold. Deleted within 30 days of account deletion.</p></div>
    <h2 style={LS.h2}>4. Third Parties</h2><p style={LS.p}>We use Stripe (payments), Anthropic (AI), Vercel (hosting), Supabase (database). Each has their own privacy policy. We share minimum data.</p>
    <h2 style={LS.h2}>5. Your Rights</h2><p style={LS.p}>Access, correct, delete, or export your data. Opt out of marketing. Contact {CONFIG.SUPPORT_EMAIL} to exercise these rights.</p>
    <h2 style={LS.h2}>6. Retention</h2><p style={LS.p}>Account data: while active + 30 days after deletion. Payment records: 7 years. Logs: 90 days.</p>
    <h2 style={LS.h2}>7. Contact</h2><p style={{...LS.p,fontWeight:600}}>Email: {CONFIG.SUPPORT_EMAIL}</p>
    <div style={LS.ft}>&copy; {new Date().getFullYear()} {CONFIG.BUSINESS_NAME}</div>
  </div></div>);
}

function RefundPage({ onBack }) { return (
  <div style={LS.page}><div style={LS.hdr}><div onClick={onBack} style={{color:"#8a8aaf",cursor:"pointer",fontSize:13,marginBottom:8}}>&larr; Back</div><h1 style={{color:"#fff",fontSize:28,fontWeight:700,margin:0}}>Refund Policy</h1><p style={{color:"#8a8aaf",fontSize:14,marginTop:8}}>Last updated: March 2026</p></div><div style={LS.c}>
    <div style={{background:"#f0faf0",borderLeft:"4px solid #28a745",padding:"16px 20px",borderRadius:"0 8px 8px 0",margin:"20px 0"}}><p style={{margin:0,color:"#1a6b2a",fontWeight:500}}>7-day money-back guarantee on all new subscriptions.</p></div>
    <h2 style={LS.h2}>1. Eligibility</h2><p style={LS.p}><strong>Within 7 days:</strong> Full refund, no questions. <strong>Renewal within 48 hours:</strong> Refund if unused. <strong>Service outage:</strong> Prorated credit. <strong>After 7 days:</strong> Cancel anytime, no refund.</p>
    <h2 style={LS.h2}>2. How to Request</h2><p style={LS.p}>Email {CONFIG.SUPPORT_EMAIL} with subject "Refund Request" and your account email. We respond in 1-2 business days. Refund in 5-10 business days.</p>
    <h2 style={LS.h2}>3. Cancellation</h2><p style={LS.p}>Cancel in Settings → Manage Billing, or email us. Access continues until end of billing period. No cancellation fee.</p>
    <h2 style={LS.h2}>4. Contact</h2><p style={{...LS.p,fontWeight:600}}>Email: {CONFIG.SUPPORT_EMAIL}</p>
    <div style={LS.ft}>&copy; {new Date().getFullYear()} {CONFIG.BUSINESS_NAME}</div>
  </div></div>);
}

// ─── MAIN APP SHELL ───────────────────────────────────────────────────────────
function AppShell({ user, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [deals, setDeals] = useState([]);
  const [brands, setBrands] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMore, setMobileMore] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPlan, setUserPlan] = useState("free");
  const [aiUsage, setAiUsage] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Load real data from Supabase on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [dealsRes, brandsRes, profileRes] = await Promise.all([
          supabase.from("deals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("brands").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("profiles").select("full_name,plan").eq("id", user.id).single(),
        ]);
        if (profileRes.data) { setUserName(profileRes.data.full_name || ""); setUserPlan(profileRes.data.plan || "free"); }
        // Load AI usage count for current month
        const month = new Date().toISOString().slice(0, 7);
        const { count } = await supabase.from("ai_usage").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", month + "-01");
        setAiUsage(count || 0);
        if (dealsRes.data) setDeals(dealsRes.data.map(d => ({ ...d, value: d.value || 0 })));
        if (brandsRes.data) setBrands(brandsRes.data.map(b => ({ ...b, totalDeals: b.total_deals || 0, totalValue: b.total_value || 0, lastDeal: b.last_deal })));
      } catch (e) {
        // If Supabase isn't set up yet, show empty state — that's fine
        console.log("Database not connected yet — showing empty state.");
      }
      setDataLoaded(true);
    }
    loadData();
  }, [user]);

  // Feature gating — check plan before rendering AI features
  const gated = (feature, Component) => {
    if (!canAccess(userPlan, feature)) {
      return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Pro Feature</div>
          <div style={{ fontSize: 15, color: T.textSub, marginBottom: 24, maxWidth: 400, lineHeight: 1.6 }}>Upgrade to Pro to unlock AI-powered {feature === "mediakit" ? "media kits" : feature === "invoices" ? "invoicing" : feature === "autopilot" ? "content generation" : feature === "negotiate" ? "negotiation coaching" : "business assistant"}, unlimited deals, and more.</div>
          <Btn onClick={() => setShowUpgrade(feature)} size="lg">Upgrade to Pro — $49/mo</Btn>
        </div>
      );
    }
    return Component;
  };

  // Track AI calls
  const trackAiCall = async () => {
    setAiUsage(prev => prev + 1);
    try { await supabase.from("ai_usage").insert({ user_id: user.id }); } catch {}
  };

  const aiLimitHit = atLimit(userPlan, aiUsage, "aiCallsPerMonth");

  const VIEWS = {
    dashboard: <DashboardView deals={deals} brands={brands} plan={userPlan} onNavigate={setTab} showOnboarding={showOnboarding} setShowOnboarding={setShowOnboarding} />,
    pipeline: <PipelineView deals={deals} setDeals={setDeals} userId={user.id} plan={userPlan} onUpgrade={() => setShowUpgrade("deals")} />,
    brands: <BrandsView brands={brands} setBrands={setBrands} userId={user.id} plan={userPlan} onUpgrade={() => setShowUpgrade("brands")} />,
    mediakit: gated("mediakit", <MediaKitView aiLimitHit={aiLimitHit} trackAiCall={trackAiCall} />),
    invoices: gated("invoices", <InvoicesView deals={deals} user={user} aiLimitHit={aiLimitHit} trackAiCall={trackAiCall} plan={userPlan} />),
    analytics: <AnalyticsView deals={deals} />,
    autopilot: gated("autopilot", <AutopilotView aiLimitHit={aiLimitHit} trackAiCall={trackAiCall} />),
    negotiate: gated("negotiate", <NegotiateView deals={deals} brands={brands} aiLimitHit={aiLimitHit} trackAiCall={trackAiCall} />),
    assistant: gated("assistant", <AssistantView deals={deals} brands={brands} aiLimitHit={aiLimitHit} trackAiCall={trackAiCall} />),
    settings: <SettingsView user={user} onLogout={onLogout} plan={userPlan} deals={deals} brands={brands} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg }}>
      <Sidebar active={tab} setActive={setTab} onLogout={onLogout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} userName={userName} userPlan={userPlan} />

      <main className="dd-main" style={{ marginLeft: 220, flex: 1, padding: "32px 36px", maxWidth: "calc(100vw - 220px)", overflowX: "hidden" }}>
        {VIEWS[tab]}
      </main>

      {/* Upgrade modal */}
      {showUpgrade && <UpgradeModal feature={showUpgrade} plan={userPlan} onClose={() => setShowUpgrade(null)} onUpgrade={async () => {
        try {
          const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: "pro" }) });
          const data = await res.json();
          if (data.url) window.location.href = data.url;
        } catch {}
        setShowUpgrade(null);
      }} />}

      {/* Mobile bottom navigation */}
      <div className="dd-mobile-nav">
        {[
          { id: "dashboard", icon: "⚡", label: "Home" },
          { id: "pipeline", icon: "📋", label: "Pipeline" },
          { id: "assistant", icon: "💬", label: "AI Chat" },
          { id: "analytics", icon: "📊", label: "Analytics" },
          { id: "_more", icon: "⚙️", label: "More" },
        ].map(item => (
          <button key={item.id} className={tab === item.id || (item.id === "_more" && mobileMore) ? "active" : ""} onClick={() => {
            if (item.id === "_more") setMobileMore(prev => !prev);
            else { setTab(item.id); setMobileMore(false); }
          }}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Mobile More menu */}
      {mobileMore && (
        <div style={{ position: "fixed", bottom: 52, left: 0, right: 0, background: T.bg2, borderTop: `1px solid ${T.border}`, zIndex: 199, padding: "12px 16px", maxHeight: "60vh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { id: "brands", icon: "🤝", label: "Brands" },
              { id: "mediakit", icon: "🖼️", label: "Media Kit" },
              { id: "invoices", icon: "🧾", label: "Invoices" },
              { id: "autopilot", icon: "🤖", label: "AI Content" },
              { id: "negotiate", icon: "🤝", label: "Negotiate" },
              { id: "settings", icon: "⚙️", label: "Settings" },
            ].map(item => (
              <button key={item.id} onClick={() => { setTab(item.id); setMobileMore(false); }} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "14px 8px",
                background: tab === item.id ? T.gold + "1A" : T.card, border: `1px solid ${tab === item.id ? T.gold : T.border}`,
                borderRadius: 10, color: tab === item.id ? T.gold : T.textSub, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function DealDesk() {
  const [view, setView] = useState("loading"); // loading | landing | auth | app | terms | privacy | refund
  const [user, setUser] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const timeout = setTimeout(() => setView("landing"), 3000); // Fallback if Supabase hangs
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) { setUser(session.user); setView("app"); }
      else setView("landing");
    }).catch(() => { clearTimeout(timeout); setView("landing"); });

    // Listen for auth changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) { setUser(session.user); setView("app"); }
      if (event === "SIGNED_OUT") { setUser(null); setView("landing"); }
    });
    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setView("landing");
  };

  const handleLegal = (page) => setView(page);
  const handleBackFromLegal = () => setView(user ? "app" : "landing");

  if (view === "loading") return (
    <><GlobalStyle /><div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Deal<span style={{ color: T.gold }}>Desk</span></div>
        <Spinner />
      </div>
    </div></>
  );

  return (
    <>
      <GlobalStyle />
      {view === "landing" && <LandingPage onEnter={() => setView("auth")} onLegal={handleLegal} />}
      {view === "auth" && <AuthScreen onAuth={(u) => { setUser(u); setView("app"); }} onBack={() => setView("landing")} />}
      {view === "app" && user && <AppShell user={user} onLogout={handleLogout} />}
      {view === "terms" && <TermsPage onBack={handleBackFromLegal} />}
      {view === "privacy" && <PrivacyPage onBack={handleBackFromLegal} />}
      {view === "refund" && <RefundPage onBack={handleBackFromLegal} />}
    </>
  );
}
