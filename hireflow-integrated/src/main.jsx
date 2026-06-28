import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Copy,
  Download,
  Edit3,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  LineChart,
  Lock,
  Mail,
  MessageSquareText,
  PieChart,
  RefreshCw,
  SearchCheck,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
  WalletCards,
  Zap
} from "lucide-react";
import heroDashboard from "./assets/hireflow-dashboard.png";
import "./styles.css";

const platforms = ["LinkedIn", "Naukri", "Indeed", "Wellfound", "Foundit", "Glassdoor", "Monster", "AngelList", "Dice", "ZipRecruiter"];
const capabilities = ["Historical Intelligence", "AI Recruitment", "Platform Optimization", "Smart Budget", "Explainable AI", "Learning Agent", "Campaign Monitoring"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const demoCampaign = {
  job_title: "Senior Backend Engineer",
  budget: 800000,
  platforms: ["LinkedIn", "Indeed", "Naukri", "Wellfound"]
};

const navItems = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["create", "Create Campaign", BriefcaseBusiness],
  ["history", "Historical Intelligence", History],
  ["optimization", "Platform Optimization", Target],
  ["posts", "Job Generator", FileText],
  ["budget", "Budget Governance", WalletCards],
  ["monitoring", "Campaign Monitoring", Gauge],
  ["feedback", "Interview Feedback", ClipboardCheck],
  ["memory", "Recruitment Memory", Bot],
  ["reports", "Reports", LineChart],
  ["notifications", "Notifications", Bell],
  ["settings", "Settings", Settings]
];

const workspaceDefaults = {
  campaigns: [],
  notifications: [],
  drafts: {},
  interviews: [],
  reports: [],
  budgetLimits: { total: 800000, perPlatform: 350000, warningThreshold: 82 },
  settings: {
    companyName: "HireFlow AI",
    industry: "Technology",
    defaultBudget: 800000,
    preferredPlatforms: "LinkedIn, Naukri, Wellfound",
    aiGuardrails: "Block platforms with zero historical hires. Warn above 82% spend.",
    notifications: true
  }
};

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved ? { ...initialValue, ...JSON.parse(saved) } : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function formatINR(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function calculateRoi(campaign) {
  const budget = Number(campaign.budget ?? campaign.total_budget ?? 0);
  const hires = Number(campaign.hires ?? 0);
  if (!budget || !hires) return 0;
  return Number(((hires * 300000) / budget).toFixed(1));
}

function toCampaignRows(historicalRows = [], liveRows = []) {
  const historical = historicalRows.map((row) => ({
    id: `history-${row.campaign_id}`,
    role: row.role,
    platform: row.platform,
    budget: Number(row.budget) || 0,
    applications: Number(row.applications) || 0,
    interviews: Number(row.interviews) || 0,
    hires: Number(row.hires) || 0,
    status: row.hires > 0 ? "Completed" : "Watch",
    description: `Historical ${row.role} campaign on ${row.platform}`,
    skills: inferSkills(row.role),
    createdAt: `2026-0${(row.campaign_id % 6) + 1}-${String((row.campaign_id % 24) + 1).padStart(2, "0")}`
  }));
  return [...liveRows, ...historical];
}

function inferSkills(role = "") {
  const lower = role.toLowerCase();
  if (lower.includes("data") || lower.includes("ml")) return ["Python", "Statistics", "Modeling"];
  if (lower.includes("frontend")) return ["React", "JavaScript", "UI Systems"];
  if (lower.includes("devops")) return ["Cloud", "CI/CD", "Infrastructure"];
  if (lower.includes("product")) return ["Roadmapping", "Research", "Execution"];
  return ["Python", "APIs", "System Design"];
}

function summarizeCampaigns(campaignRows) {
  const active = campaignRows.filter((row) => row.status !== "Completed").length;
  const applications = campaignRows.reduce((sum, row) => sum + Number(row.applications || 0), 0);
  const interviews = campaignRows.reduce((sum, row) => sum + Number(row.interviews || 0), 0);
  const hires = campaignRows.reduce((sum, row) => sum + Number(row.hires || 0), 0);
  const budget = campaignRows.reduce((sum, row) => sum + Number(row.budget || 0), 0);
  return { active, applications, interviews, hires, budget, offers: Math.max(hires, Math.round(interviews * 0.18)) };
}

function buildTrend(campaignRows, range) {
  const buckets = range === "week"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return buckets.map((month, index) => {
    const rows = campaignRows.filter((_, rowIndex) => rowIndex % buckets.length === index);
    return {
      month,
      applications: rows.reduce((sum, row) => sum + Number(row.applications || 0), 0),
      interviews: rows.reduce((sum, row) => sum + Number(row.interviews || 0), 0),
      hires: rows.reduce((sum, row) => sum + Number(row.hires || 0), 0)
    };
  });
}

function buildPlatformPerformance(campaignRows) {
  const byPlatform = platforms.map((platform) => {
    const rows = campaignRows.filter((row) => row.platform === platform || row.platforms?.includes?.(platform));
    const budget = rows.reduce((sum, row) => sum + Number(row.budget || 0), 0);
    const hires = rows.reduce((sum, row) => sum + Number(row.hires || 0), 0);
    const applications = rows.reduce((sum, row) => sum + Number(row.applications || 0), 0);
    return { platform, budget, hires, applications };
  }).filter((row) => row.budget || row.applications || row.hires);
  const totalBudget = byPlatform.reduce((sum, row) => sum + row.budget, 0) || 1;
  const totalHires = byPlatform.reduce((sum, row) => sum + row.hires, 0) || 1;
  return byPlatform.slice(0, 6).map((row) => {
    const costPerHire = row.hires ? row.budget / row.hires : row.budget || 0;
    return {
      platform: row.platform,
      budgetShare: Number(((row.budget / totalBudget) * 100).toFixed(1)),
      qualifiedShare: Number(((row.hires / totalHires) * 100).toFixed(1)),
      costPerHire,
      status: row.hires === 0 ? "block" : costPerHire < 90000 ? "scale" : "keep"
    };
  });
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildBudgetRows(runtimeResult, workspaceData = workspaceDefaults) {
  const preferredPlatforms = String(workspaceData.settings?.preferredPlatforms || "LinkedIn, Naukri, Wellfound").split(",").map((item) => item.trim()).filter(Boolean);
  const allocations = runtimeResult?.budget_allocation?.length
    ? runtimeResult.budget_allocation
    : preferredPlatforms.map((platform) => ({
      platform,
      amount: Math.round((workspaceData.budgetLimits?.total || workspaceDefaults.budgetLimits.total) / preferredPlatforms.length),
      percentage: Number((100 / preferredPlatforms.length).toFixed(1)),
      weight: 0
    }));
  return allocations.map((item) => ({
    campaign: runtimeResult?.campaign_name || "Senior Backend Engineer",
    platform: item.platform,
    allocated_budget_inr: Math.round(item.amount),
    allocation_percentage: item.percentage,
    decision: runtimeResult?.cascadeflow?.decision || "projected",
    removed_platforms: runtimeResult?.platforms_removed?.map((platform) => platform.platform).join("; ") || "",
    hindsight_source: runtimeResult?.hindsight?.source || "local-json",
    citation: runtimeResult?.hindsight?.citation?.snippet || "Workspace budget export"
  }));
}

function buildCampaignSummaryRows(runtimeResult) {
  return [
    {
      metric: "Campaign",
      value: runtimeResult?.campaign_name || "Senior Backend Engineer"
    },
    {
      metric: "Original Platforms",
      value: runtimeResult?.request_payload?.platforms?.join("; ") || demoCampaign.platforms.join("; ")
    },
    {
      metric: "Final Platforms",
      value: runtimeResult?.platforms_selected?.join("; ") || "LinkedIn; Naukri; Wellfound"
    },
    {
      metric: "Removed Platforms",
      value: runtimeResult?.platforms_removed?.map((platform) => platform.platform).join("; ") || "Indeed"
    },
    {
      metric: "Budget Saved",
      value: runtimeResult?.budget_saved ?? 200000
    },
    {
      metric: "Hindsight Source",
      value: runtimeResult?.hindsight?.source || "local-json"
    },
    {
      metric: "Decision Summary",
      value: runtimeResult?.decision_summary || "CascadeFlow removes historically weak platforms and reallocates budget."
    }
  ];
}

function buildPostingRows(posts) {
  return Object.entries(posts).map(([platform, content]) => ({
    platform,
    character_count: content.length,
    generated_post: content
  }));
}

const generatedPosts = {
  LinkedIn: "We are hiring a Senior Backend Engineer to design resilient services, lead API architecture, and partner with product teams shipping AI-first hiring workflows. You will own high-scale systems, mentor engineers, and turn ambiguous product goals into reliable infrastructure.",
  Naukri: "Opening for Senior Backend Engineer with 5-8 years experience in Node.js, Python, distributed systems, databases, and cloud architecture. Strong problem-solving, API design, and production ownership required. Competitive salary and hybrid work.",
  Wellfound: "Join HireFlow AI as a Senior Backend Engineer and build the systems that automate recruitment operations for fast-growing teams. Ideal for builders who like ownership, clean architecture, and AI-enabled products."
};

function App() {
  const [route, setRoute] = useState("landing");
  const [screen, setScreen] = useState("dashboard");
  const [runtime, setRuntime] = useState({ status: "idle", result: null, error: "" });
  const [memory, setMemory] = useState({ status: "idle", profile: null, setup: null, error: "" });
  const [workspaceData, setWorkspaceData] = usePersistentState("hireflow-workspace-v2", workspaceDefaults);

  useEffect(() => {
    refreshMemoryProfile();
  }, []);

  async function refreshMemoryProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memory`);
      const profile = await response.json();
      if (!response.ok) throw new Error(profile.detail || "Unable to load memory profile.");
      setMemory((current) => ({ ...current, profile, error: "" }));
    } catch (error) {
      setMemory((current) => ({ ...current, error: error.message || "Memory profile unavailable." }));
    }
  }

  async function setupMemoryBank() {
    setMemory((current) => ({ ...current, status: "loading", error: "" }));
    console.log("[UI] Retaining historical campaigns into Hindsight memory.");

    try {
      const response = await fetch(`${API_BASE_URL}/api/setup-memory`, { method: "POST" });
      const setup = await response.json();
      if (!response.ok) throw new Error(setup.detail || "Unable to setup Hindsight memory.");
      setMemory((current) => ({ ...current, status: "complete", setup, error: "" }));
      await refreshMemoryProfile();
    } catch (error) {
      setMemory((current) => ({
        ...current,
        status: "error",
        error: error.message || "Memory setup failed."
      }));
    }
  }

  async function launchRuntimeCampaign(campaign = demoCampaign) {
    setRuntime({ status: "loading", result: null, error: "" });
    console.log("[UI] Main CTA clicked. Sending campaign to CascadeFlow runtime.", campaign);
    console.log("[HINDSIGHT MEMORY] HINDSIGHT RECALL ACTIVE via POST /api/launch");

    try {
      const response = await fetch(`${API_BASE_URL}/api/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaign)
      });
      const payload = await response.json();

      if (!response.ok) {
        const detail = Array.isArray(payload.detail)
          ? payload.detail.map((item) => item.msg).join(", ")
          : payload.detail;
        throw new Error(detail || `Runtime failed with status ${response.status}`);
      }

      console.log("[CascadeFlow] Decision returned to UI.", payload);
      console.log("[HINDSIGHT MEMORY] recall_source=", payload.hindsight?.source, "citation=", payload.hindsight?.citation?.snippet);
      setRuntime({ status: "complete", result: payload, error: "" });
      const campaignRecord = {
        id: makeId("campaign"),
        role: payload.campaign_name || campaign.job_title,
        platform: payload.platforms_selected?.join(", ") || campaign.platforms.join(", "),
        platforms: payload.platforms_selected?.length ? payload.platforms_selected : campaign.platforms,
        budget: Number(payload.total_budget || campaign.budget),
        applications: Math.round((payload.platforms_selected?.length || campaign.platforms.length) * 85),
        interviews: Math.round((payload.platforms_selected?.length || campaign.platforms.length) * 12),
        hires: 0,
        status: "Active",
        description: campaign.description || `Live campaign launched through CascadeFlow for ${campaign.job_title}.`,
        skills: campaign.skills?.length ? campaign.skills : inferSkills(campaign.job_title),
        createdAt: new Date().toISOString().slice(0, 10)
      };
      setWorkspaceData((current) => ({
        ...current,
        campaigns: [campaignRecord, ...(current.campaigns || [])],
        notifications: [{
          id: makeId("notification"),
          type: "Campaign created",
          message: `${campaignRecord.role} launched on ${campaignRecord.platform}.`,
          createdAt: new Date().toISOString(),
          read: false
        }, ...(current.notifications || [])]
      }));
      setRoute("app");
      setScreen("optimization");
    } catch (error) {
      console.error("[Runtime] Launch failed.", error);
      setRuntime({
        status: "error",
        result: null,
        error: error.message || "Unable to reach CascadeFlow runtime on port 8000."
      });
    }
  }

  const runtimePanel = <RuntimeDecisionPanel runtime={runtime} onClose={() => setRuntime({ status: "idle", result: null, error: "" })} />;

  if (route === "auth") return <><AuthPage onEnter={() => setRoute("app")} />{runtimePanel}</>;
  if (route === "landing") return <><LandingPage onLaunch={() => launchRuntimeCampaign()} onExplore={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} />{runtimePanel}</>;
  return <><Workspace active={screen} setActive={setScreen} onHome={() => setRoute("landing")} onLaunchCampaign={launchRuntimeCampaign} runtimeResult={runtime.result} memory={memory} onSetupMemory={setupMemoryBank} workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} />{runtimePanel}</>;
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LandingPage({ onLaunch, onExplore }) {
  return (
    <main className="site-shell stitch-site">
      <nav className="top-nav">
        <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          HireFlow AI
        </button>
        <div className="nav-links">
          <button onClick={() => scrollToSection("home")}>Home</button>
          <button onClick={onExplore}>Features</button>
          <button onClick={() => scrollToSection("workflow")}>How It Works</button>
          <button onClick={() => scrollToSection("technology")}>Technology</button>
          <button onClick={() => scrollToSection("about")}>About</button>
        </div>
        <div className="nav-actions">
          <button className="secondary-button small" onClick={onLaunch}>Launch Campaign</button>
        </div>
      </nav>

      <section className="hero-section" id="home">
        <div className="hero-copy fade-up">
          <span className="eyebrow"><Bot size={15} /> Autonomous Recruitment Intelligence Platform</span>
          <h1><span>Stop</span><span>Guessing</span><span>Where To Hire.</span><span>Let AI Decide.</span></h1>
          <p>HireFlow AI analyzes previous hiring campaigns, identifies high-performing recruitment platforms, optimizes hiring budgets, creates platform-specific job posts, and explains every decision with complete transparency.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={onLaunch}>Launch Your First Campaign <ArrowRight size={18} /></button>
            <button className="secondary-button" onClick={onExplore}>Explore Features</button>
          </div>
        </div>
      </section>

      <Ticker />
      <RoleChips />
      <CapabilityChips />
      <Problems />
      <Features />
      <AgentNetwork />
      <Pipeline />
      <BuiltFor />
      <FinalCTA onLaunch={onLaunch} />
    </main>
  );
}

function Ticker() {
  return (
    <section className="ticker-section">
      <div className="ticker-track">
        {[...platforms, ...platforms].map((platform, index) => <span key={`${platform}-${index}`}>{platform}</span>)}
      </div>
    </section>
  );
}

function CapabilityChips() {
  return (
    <section className="capability-section">
      <div className="chip-cloud">
        {[...capabilities, ...capabilities].map((chip, index) => <span key={`${chip}-${index}`} className="capability-chip"><Zap size={14} />{chip}</span>)}
      </div>
    </section>
  );
}

function RoleChips() {
  return (
    <div className="role-chip-row">
      {["Product Manager", "Business Analyst", "UX Designer", "QA Engineer", "Software Engineer", "Backend Engineer"].map((role) => <span key={role}>{role}</span>)}
    </div>
  );
}

function Problems() {
  const cards = [
    ["No Historical Intelligence", "Recruiters repeatedly make hiring decisions without learning from previous campaigns.", History],
    ["Budget Gets Wasted", "Hiring budgets are often spent on platforms that historically perform poorly.", CircleDollarSign],
    ["Generic Job Posts", "The same job description is posted everywhere, reducing engagement and attracting less relevant candidates.", MessageSquareText]
  ];
  return <CardGrid title="Problems HireFlow Solves" cards={cards} />;
}

function Features() {
  const cards = [
    ["Recruitment Planning Agent", "Analyzes hiring requirements and plans the recruitment strategy.", SearchCheck],
    ["Historical Intelligence Agent", "Retrieves previous campaign data and finds similar hiring patterns.", History],
    ["Platform Optimization Agent", "Chooses the best platforms and rejects historically weak channels.", Target],
    ["Content Generation Agent", "Creates platform-specific descriptions for LinkedIn, Naukri, Wellfound, and more.", FileText],
    ["Budget Governance Agent", "Prevents overspending and optimizes allocation while campaigns run.", ShieldCheck],
    ["Campaign Monitoring Agent", "Tracks applications, engagement, and underperforming campaigns.", Gauge]
  ];
  return <CardGrid id="features" title="Meet HireFlow AI" cards={cards} />;
}

function CardGrid({ id, title, cards }) {
  return (
    <section className="content-section" id={id || "problems"}>
      <div className="section-heading">
        <span className="eyebrow"><Sparkles size={15} /> Solution Architecture</span>
        <h2>{title}</h2>
      </div>
      <div className="feature-grid">
        {cards.map(([title, text, Icon]) => (
          <article className="feature-card" key={title}>
            <div className="icon-pill"><Icon size={20} /></div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AgentNetwork() {
  const agents = [
    ["Recruitment Planning Agent", "Analyzes hiring requirements and prepares an optimized recruitment strategy."],
    ["Historical Intelligence Agent", "Searches previous campaigns and retrieves relevant hiring insights."],
    ["Platform Optimization Agent", "Ranks recruitment platforms using historical hiring performance and removes low-performing options."],
    ["Budget Governance Agent", "Monitors campaign spending and reallocates budget intelligently."],
    ["Content Generation Agent", "Generates customized job posts tailored for LinkedIn, Naukri, Wellfound, and other platforms."],
    ["Campaign Monitoring Agent", "Tracks campaign performance and highlights opportunities for improvement."]
  ];
  return (
    <section className="content-section technical-section" id="about">
      <div className="section-heading">
        <span className="eyebrow">// AGENT_NETWORK</span>
        <h2>Autonomous AI Agents Working Behind Every Campaign</h2>
      </div>
      <div className="agent-grid">
        {agents.map(([title, text], index) => (
          <article className="agent-card" key={title}>
            <span>// {String(index + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Pipeline() {
  const phases = ["Create a hiring campaign.", "AI searches historical recruitment data.", "Similar campaigns are analyzed.", "Platform ROI is calculated.", "Low-performing platforms are removed.", "Budget is automatically optimized.", "Platform-specific job descriptions are generated.", "A complete decision audit is created."];
  return (
    <section className="pipeline-section" id="workflow">
      <span className="eyebrow">// WORKFLOW_PIPELINE</span>
      <h2>From Job Description to Optimized Hiring Campaign</h2>
      <div className="pipeline-grid">
        {phases.map((phase, index) => <div key={phase}><strong>{index + 1}</strong><span>{phase}</span></div>)}
      </div>
    </section>
  );
}

function BuiltFor() {
  return (
    <section className="content-section built-for" id="technology">
      <div className="section-heading">
        <span className="eyebrow">// STACK_ARCHITECTURE</span>
        <h2>Built for Recruitment</h2>
      </div>
      <div className="feature-grid">
        {["Hindsight", "CascadeFlow", "Modern AI Stack"].map((title, index) => (
          <article className="feature-card compact" key={title}>
            <h3>{title}</h3>
            <p>{["Persistent AI memory.", "Runtime intelligence.", "React, FastAPI, Python, LLMs, Agent Memory, Analytics."][index]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinalCTA({ onLaunch }) {
  return (
    <section className="final-cta">
      <h2>Ready to Build Smarter Hiring Campaigns?</h2>
      <p>Stop relying on guesswork. Let HireFlow AI transform historical hiring data into intelligent recruitment decisions that save time, reduce costs, and improve hiring outcomes.</p>
      <button className="primary-button" onClick={onLaunch}>Launch Your First Campaign</button>
      <span>// SYSTEM_READY</span>
    </section>
  );
}

function AuthPage({ onEnter }) {
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");

  function handleProvider(provider) {
    setMessage(`${provider} authentication connected. Continue to enter the workspace.`);
  }

  return (
    <main className="auth-shell">
      <section className="auth-art">
        <button className="brand auth-brand"><span className="brand-mark"><Sparkles size={18} /></span>HireFlow AI</button>
        <img src={heroDashboard} alt="AI recruitment dashboard illustration" />
        <div className="auth-float one"><Bot size={18} /> AI planner active</div>
        <div className="auth-float two"><PieChart size={18} /> Budget reallocated</div>
      </section>
      <section className="auth-panel fade-up">
        <span className="eyebrow"><Lock size={15} /> Secure workspace</span>
        <h1>{isSignup ? "Create Account" : "Welcome Back"}</h1>
        <p>{isSignup ? "Create your recruitment intelligence workspace and start with a guided campaign." : "Sign in to monitor campaigns, review AI decisions, and launch your next hiring workflow."}</p>
        <label>Email<input type="email" placeholder="talent@company.com" /></label>
        <label>Password<input type="password" placeholder="••••••••" /></label>
        {isSignup && <label>Company Name<input type="text" placeholder="Acme Talent Ops" /></label>}
        <div className="auth-row"><label className="check-label"><input type="checkbox" defaultChecked /> Remember me</label><button onClick={() => setMessage("Password reset link prepared for the entered email.")}>Forgot Password</button></div>
        {message && <div className="inline-status">{message}</div>}
        <button className="primary-button full" onClick={onEnter}>{isSignup ? "Create Workspace" : "Login"} <ArrowRight size={18} /></button>
        <div className="divider"><span>or continue with</span></div>
        <div className="oauth-grid"><button onClick={() => handleProvider("Google")}>Google</button><button onClick={() => handleProvider("Microsoft")}>Microsoft</button></div>
        <p className="auth-switch">{isSignup ? "Already have an account?" : "Don't have an account?"} <button onClick={() => { setIsSignup(!isSignup); setMessage(""); }}>{isSignup ? "Login" : "Create Account"}</button></p>
      </section>
    </main>
  );
}

function Workspace({ active, setActive, onHome, onLaunchCampaign, runtimeResult, memory, onSetupMemory, workspaceData, setWorkspaceData }) {
  const currentPage = navItems.find(([id]) => id === active) || ["planning", "AI Planning Screen", Sparkles];
  const ActiveIcon = currentPage[2];
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const campaignRows = useMemo(() => toCampaignRows(memory.profile?.campaigns || memory.profile?.sample_campaigns || [], workspaceData.campaigns || []), [memory.profile, workspaceData.campaigns]);
  const searchResults = useMemo(() => buildSearchResults(searchQuery, campaignRows, workspaceData.reports || []), [searchQuery, campaignRows, workspaceData.reports]);

  function showNotice(text) {
    setNotice(text);
    window.clearTimeout(window.__hireflowNoticeTimer);
    window.__hireflowNoticeTimer = window.setTimeout(() => setNotice(""), 2400);
  }

  function addNotification(type, message) {
    setWorkspaceData((current) => ({
      ...current,
      notifications: [{
        id: makeId("notification"),
        type,
        message,
        createdAt: new Date().toISOString(),
        read: false
      }, ...(current.notifications || [])]
    }));
    showNotice(message);
  }

  const unreadCount = workspaceData.notifications?.filter((item) => !item.read).length || 0;

  return (
    <main className="workspace">
      <aside className="sidebar">
        <button className="brand" onClick={onHome}><span className="brand-mark"><Sparkles size={18} /></span>HireFlow AI</button>
        <nav>
          {navItems.map(([id, label, Icon]) => (
            <button className={active === id ? "active" : ""} key={id} onClick={() => setActive(id)}>
              <Icon size={18} /> <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <section className="app-area">
        <header className="app-header">
          <div>
            <span className="eyebrow"><ActiveIcon size={15} /> AI Workspace</span>
            <h1>{currentPage[1]}</h1>
          </div>
          <div className="header-actions">
            <label className="global-search"><SearchCheck size={16} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search dashboard, reports, memory" /></label>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setActive("notifications")}><Bell size={18} />{unreadCount > 0 && <span>{unreadCount}</span>}</button>
            <button className="primary-button small" onClick={() => setActive("create")}>New Campaign</button>
          </div>
        </header>
        {notice && <div className="app-toast">{notice}</div>}
        {searchQuery && <SearchResults query={searchQuery} results={searchResults} onSelect={(target) => { setActive(target); setSearchQuery(""); }} />}
        <Screen active={active} setActive={setActive} showNotice={showNotice} addNotification={addNotification} onLaunchCampaign={onLaunchCampaign} runtimeResult={runtimeResult} memory={memory} onSetupMemory={onSetupMemory} workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} />
      </section>
    </main>
  );
}

function buildSearchResults(query, campaignRows, reports) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const dashboard = [
    ...campaignRows.map((row) => ({ area: "Dashboard", target: "dashboard", title: row.role, body: `${row.platform} ${row.status} ${row.applications} applications` })),
    ...reports.map((report) => ({ area: "Reports", target: "reports", title: report.name, body: `${report.rows} rows ${report.createdAt}` })),
    ...campaignRows.map((row) => ({ area: "Recruitment Memory", target: "memory", title: `${row.role} memory`, body: `${row.description} ${row.skills?.join(" ")}` }))
  ];
  return dashboard.filter((item) => `${item.area} ${item.title} ${item.body}`.toLowerCase().includes(normalized)).slice(0, 8);
}

function highlightText(text, query) {
  const value = String(text || "");
  const index = value.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return value;
  return <>{value.slice(0, index)}<mark>{value.slice(index, index + query.length)}</mark>{value.slice(index + query.length)}</>;
}

function SearchResults({ query, results, onSelect }) {
  return (
    <div className="search-results">
      {results.length ? results.map((item) => (
        <button key={`${item.area}-${item.title}-${item.body}`} onClick={() => onSelect(item.target)}>
          <span>{item.area}</span>
          <strong>{highlightText(item.title, query)}</strong>
          <small>{highlightText(item.body, query)}</small>
        </button>
      )) : <div className="empty-state">No matching workspace records.</div>}
    </div>
  );
}

function Screen({ active, setActive, showNotice, addNotification, onLaunchCampaign, runtimeResult, memory, onSetupMemory, workspaceData, setWorkspaceData }) {
  const campaignRows = toCampaignRows(memory.profile?.campaigns || memory.profile?.sample_campaigns || [], workspaceData.campaigns || []);
  const screens = {
    dashboard: <Dashboard setActive={setActive} campaignRows={campaignRows} notifications={workspaceData.notifications || []} />,
    create: <CreateCampaign onLaunchCampaign={onLaunchCampaign} memory={memory} onSetupMemory={onSetupMemory} addNotification={addNotification} />,
    planning: <PlanningScreen setActive={setActive} runtimeResult={runtimeResult} />,
    history: <HistoricalIntelligence memory={memory} runtimeResult={runtimeResult} campaignRows={campaignRows} />,
    optimization: <PlatformOptimization runtimeResult={runtimeResult} workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} addNotification={addNotification} />,
    posts: <GeneratedPosts showNotice={showNotice} workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} addNotification={addNotification} />,
    budget: <BudgetGovernance runtimeResult={runtimeResult} workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} addNotification={addNotification} campaignRows={campaignRows} />,
    monitoring: <CampaignMonitoring workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} addNotification={addNotification} />,
    feedback: <InterviewFeedback showNotice={showNotice} workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} addNotification={addNotification} />,
    memory: <RecruitmentMemory memory={memory} runtimeResult={runtimeResult} onSetupMemory={onSetupMemory} campaignRows={campaignRows} />,
    reports: <Reports showNotice={showNotice} runtimeResult={runtimeResult} workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} campaignRows={campaignRows} />,
    notifications: <NotificationCenter workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} />,
    settings: <SettingsScreen showNotice={showNotice} workspaceData={workspaceData} setWorkspaceData={setWorkspaceData} addNotification={addNotification} />
  };
  return screens[active] || screens.dashboard;
}

function Dashboard({ setActive, campaignRows, notifications }) {
  const [range, setRange] = useState("month");
  const stats = summarizeCampaigns(campaignRows);
  const dynamicStats = [
    ["Active Campaigns", stats.active, `${campaignRows.length} total`, Target],
    ["Applications", stats.applications.toLocaleString("en-IN"), "From campaign memory", UsersRound],
    ["Interviews", stats.interviews.toLocaleString("en-IN"), `${Math.round((stats.interviews / Math.max(stats.applications, 1)) * 100)}% of applicants`, CalendarClock],
    ["Offers", stats.offers.toLocaleString("en-IN"), "Estimated from interviews", UserRoundCheck],
    ["Hires", stats.hires.toLocaleString("en-IN"), `${Math.round((stats.hires / Math.max(stats.interviews, 1)) * 100)}% interview close`, Check],
    ["Budget", formatINR(stats.budget), "Tracked spend", CircleDollarSign]
  ];
  const trend = buildTrend(campaignRows, range);
  const performance = buildPlatformPerformance(campaignRows);
  const recentDecisions = notifications.slice(0, 4).map((item) => item.message);
  return (
    <div className="screen-grid">
      <div className="metric-grid">
        {dynamicStats.map(([label, value, detail, Icon]) => <Metric key={label} label={label} value={value} detail={detail} Icon={Icon} />)}
      </div>
      <Panel title="Hiring Analytics" className="wide"><div className="panel-tools"><button className={range === "week" ? "active" : ""} onClick={() => setRange("week")}>Week</button><button className={range === "month" ? "active" : ""} onClick={() => setRange("month")}>Month</button></div><HiringTrendChart data={trend} /></Panel>
      <Panel title="Platform Performance"><PlatformEfficiencyChart data={performance} /></Panel>
      <Panel title="Recent AI Decisions">
        <div className="decision-list">{recentDecisions.length ? recentDecisions.map((item) => <div key={item}><Bot size={16} /><span>{item}</span></div>) : <div><Bot size={16} /><span>No real AI decisions recorded yet.</span></div>}</div>
      </Panel>
      <Panel title="Recent Campaigns" className="wide">
        <CampaignTable compact rows={campaignRows} />
      </Panel>
      <button className="command-card" onClick={() => setActive("create")}>
        <span><Sparkles size={18} /> Create Recruitment Campaign</span>
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

function Metric({ label, value, detail, Icon }) {
  return <article className="metric-card"><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div><Icon size={22} /></article>;
}

function Panel({ title, children, className = "" }) {
  return <section className={`panel ${className}`}><div className="panel-title"><h2>{title}</h2></div>{children}</section>;
}

function Bars() {
  return <HiringTrendChart data={[]} />;
}

function Donut() {
  return <PlatformEfficiencyChart data={[]} />;
}

function HiringTrendChart({ data }) {
  if (!data.length) return <p className="panel-copy">No hiring trend data loaded yet.</p>;
  const width = 680;
  const height = 260;
  const padding = { top: 18, right: 22, bottom: 42, left: 54 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxApplications = Math.max(1, ...data.map((item) => item.applications));
  const xFor = (index) => padding.left + (data.length > 1 ? (index / (data.length - 1)) * innerWidth : innerWidth / 2);
  const yForApplications = (value) => padding.top + innerHeight - (value / maxApplications) * innerHeight;
  const yForRate = (value) => padding.top + innerHeight - (value / 18) * innerHeight;
  const applicationPoints = data.map((item, index) => `${xFor(index)},${yForApplications(item.applications)}`).join(" ");
  const hireRatePoints = data.map((item, index) => {
    const rate = item.applications ? (item.hires / item.applications) * 100 : 0;
    return `${xFor(index)},${yForRate(rate)}`;
  }).join(" ");

  return (
    <div className="analytics-chart">
      <div className="chart-summary">
        <div><span>Latest Applications</span><strong>{data.at(-1).applications}</strong></div>
        <div><span>Latest Interviews</span><strong>{data.at(-1).interviews}</strong></div>
        <div><span>Latest Hires</span><strong>{data.at(-1).hires}</strong></div>
      </div>
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly hiring funnel trend">
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padding.top + tick * innerHeight;
          const label = Math.round(maxApplications * (1 - tick));
          return (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="chart-grid-line" />
              <text x={padding.left - 12} y={y + 4} className="chart-axis-label" textAnchor="end">{label}</text>
            </g>
          );
        })}
        <polyline points={applicationPoints} className="applications-line" />
        <polyline points={hireRatePoints} className="hire-rate-line" />
        {data.map((item, index) => {
          const x = xFor(index);
          const applicationY = yForApplications(item.applications);
          const rate = (item.applications ? (item.hires / item.applications) * 100 : 0).toFixed(1);
          const rateY = yForRate(Number(rate));
          return (
            <g key={item.month}>
              <line x1={x} x2={x} y1={padding.top} y2={padding.top + innerHeight} className="chart-month-line" />
              <circle cx={x} cy={applicationY} r="5" className="applications-dot" />
              <circle cx={x} cy={rateY} r="4" className="hire-rate-dot" />
              <text x={x} y={height - 18} className="chart-axis-label" textAnchor="middle">{item.month}</text>
              <text x={x} y={applicationY - 10} className="chart-value-label" textAnchor="middle">{item.applications}</text>
              <text x={x} y={rateY + 18} className="chart-rate-label" textAnchor="middle">{rate}%</text>
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        <span><i className="legend-lime" /> Applications</span>
        <span><i className="legend-brown" /> Hire rate</span>
      </div>
    </div>
  );
}

function PlatformEfficiencyChart({ data }) {
  if (!data.length) return <p className="panel-copy">No platform performance data loaded yet.</p>;
  const best = [...data].sort((a, b) => b.qualifiedShare - a.qualifiedShare)[0];
  return (
    <div className="platform-chart">
      <div className="platform-chart-head">
        <strong>{best.platform} produces {best.qualifiedShare}% of qualified hires with {best.budgetShare}% of spend.</strong>
        <span>Computed from loaded campaign memory and active workspace campaigns.</span>
      </div>
      <div className="platform-bars">
        {data.map((item) => (
          <div className="platform-row" key={item.platform}>
            <div className="platform-row-title">
              <strong>{item.platform}</strong>
              <span className={`platform-status ${item.status}`}>{item.status}</span>
            </div>
            <div className="comparison-bars">
              <div>
                <span>Budget share</span>
                <meter min="0" max="40" value={item.budgetShare} />
                <strong>{item.budgetShare}%</strong>
              </div>
              <div>
                <span>Qualified hires</span>
                <meter min="0" max="40" value={item.qualifiedShare} />
                <strong>{item.qualifiedShare}%</strong>
              </div>
            </div>
            <small>Cost per hire: ₹{item.costPerHire.toLocaleString("en-IN")}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetAllocationChart({ runtimeResult, workspaceData }) {
  const activeCampaign = workspaceData?.campaigns?.[0];
  const configuredPlatforms = activeCampaign?.platforms?.length
    ? activeCampaign.platforms
    : String(workspaceData?.settings?.preferredPlatforms || "LinkedIn, Naukri, Wellfound").split(",").map((item) => item.trim()).filter(Boolean);
  const allocations = runtimeResult?.budget_allocation?.length
    ? runtimeResult.budget_allocation
    : configuredPlatforms.map((platform) => ({
      platform,
      amount: Math.round((workspaceData?.budgetLimits?.total || workspaceDefaults.budgetLimits.total) / configuredPlatforms.length),
      percentage: Number((100 / configuredPlatforms.length).toFixed(1))
    }));
  const total = allocations.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="allocation-chart">
      <div className="allocation-total">
        <span>Governed Spend</span>
        <strong>₹{Math.round(total).toLocaleString("en-IN")}</strong>
        <small>{runtimeResult ? "After CascadeFlow override" : "From workspace limits"}</small>
      </div>
      <div className="allocation-stack" aria-label="Budget allocation by platform">
        {allocations.map((item) => (
          <span key={item.platform} style={{ width: `${item.percentage}%` }} title={`${item.platform}: ${item.percentage}%`} />
        ))}
      </div>
      <div className="allocation-list">
        {allocations.map((item) => (
          <div key={item.platform}>
            <strong>{item.platform}</strong>
            <span>₹{Math.round(item.amount).toLocaleString("en-IN")}</span>
            <small>{item.percentage}%</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateCampaign({ onLaunchCampaign, memory, onSetupMemory, addNotification }) {
  const [jobTitle, setJobTitle] = useState(demoCampaign.job_title);
  const [budget, setBudget] = useState(String(demoCampaign.budget));
  const [selectedPlatforms, setSelectedPlatforms] = useState(demoCampaign.platforms);
  const [details, setDetails] = useState({
    department: "Engineering",
    experience: "5-8 years",
    employmentType: "Full-time",
    openPositions: "2",
    salaryRange: "₹35L - ₹55L",
    skills: "Python, APIs, System Design",
    deadline: "2026-07-31",
    description: "Own backend services, platform reliability, API design, and data-informed hiring workflow automation."
  });
  const campaignPayload = {
    job_title: jobTitle,
    budget: Number(budget) || demoCampaign.budget,
    platforms: selectedPlatforms,
    description: details.description,
    skills: details.skills.split(",").map((item) => item.trim()).filter(Boolean)
  };

  function togglePlatform(platform) {
    setSelectedPlatforms((current) => (
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    ));
  }

  return (
    <div className="form-layout">
      <MemorySetupPanel memory={memory} onSetupMemory={onSetupMemory} />
      <Panel title="Job Details" className="wide">
        <div className="form-grid">
          <label>Job Title<input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Senior Backend Engineer" /></label>
          <label>Department<input value={details.department} onChange={(event) => setDetails({ ...details, department: event.target.value })} /></label>
          <label>Experience<input value={details.experience} onChange={(event) => setDetails({ ...details, experience: event.target.value })} /></label>
          <label>Employment Type<input value={details.employmentType} onChange={(event) => setDetails({ ...details, employmentType: event.target.value })} /></label>
          <label>Open Positions<input value={details.openPositions} onChange={(event) => setDetails({ ...details, openPositions: event.target.value })} /></label>
          <label>Salary Range<input value={details.salaryRange} onChange={(event) => setDetails({ ...details, salaryRange: event.target.value })} /></label>
          <label>Skills Required<input value={details.skills} onChange={(event) => setDetails({ ...details, skills: event.target.value })} /></label>
          <label>Hiring Deadline<input type="date" value={details.deadline} onChange={(event) => setDetails({ ...details, deadline: event.target.value })} /></label>
          <label className="span-2">Job Description<textarea value={details.description} onChange={(event) => setDetails({ ...details, description: event.target.value })} placeholder="Describe the role, outcomes, requirements, and hiring signals..." /></label>
        </div>
      </Panel>
      <Panel title="Budget">
        <label>Total Budget<input value={budget} onChange={(event) => setBudget(event.target.value.replace(/[^\d]/g, ""))} placeholder="800000" /></label>
        <label>Preferred Cost Per Applicant<input placeholder="₹1,200" /></label>
      </Panel>
      <Panel title="Recruitment Platforms">
        <div className="checkbox-grid">{platforms.slice(0, 6).map((platform) => <label className="check-card" key={platform}><input type="checkbox" checked={selectedPlatforms.includes(platform)} onChange={() => togglePlatform(platform)} />{platform}</label>)}</div>
      </Panel>
      <BackendPayloadPanel payload={campaignPayload} />
      <button className="primary-button launch-command" onClick={() => { addNotification?.("Campaign created", `${jobTitle} submitted to CascadeFlow.`); onLaunchCampaign(campaignPayload); }}>Launch Through CascadeFlow <ArrowRight size={18} /></button>
    </div>
  );
}

function MemorySetupPanel({ memory, onSetupMemory }) {
  const profile = memory.profile;
  return (
    <Panel title="Step 1: Hindsight Memory Setup" className="wide">
      <div className="memory-setup">
        <div>
          <span className="eyebrow"><History size={15} /> Persistent Memory</span>
          <p>Historical campaigns are retained once, then recalled at launch time. This is the data CascadeFlow uses to decide whether the user's platform selection should be allowed or overridden.</p>
        </div>
        <div className="memory-stats">
          <div><span>Bank</span><strong>{profile?.bank_id || "hireflow-campaigns"}</strong></div>
          <div><span>Campaigns</span><strong>{profile?.campaign_count || 0}</strong></div>
          <div><span>Zero-Hire Risks</span><strong>{profile?.zero_hire_count || 0}</strong></div>
        </div>
        <button className="secondary-button" onClick={onSetupMemory} disabled={memory.status === "loading"}>
          {memory.status === "loading" ? "Retaining Memory..." : "Retain History"}
        </button>
        {memory.setup && <div className="inline-status">Memory setup: {memory.setup.status}. {memory.setup.message || `${memory.setup.retained} campaigns retained.`}</div>}
        {memory.error && <div className="inline-status warning">Memory note: {memory.error}</div>}
      </div>
    </Panel>
  );
}

function BackendPayloadPanel({ payload }) {
  return (
    <Panel title="Step 2: Backend Request Preview" className="wide">
      <div className="backend-flow">
        <div className="flow-lane">
          {["UI payload", "POST /api/launch", "CascadeFlow intercept", "Hindsight recall", "Governance result"].map((step, index) => (
            <div key={step}><strong>{index + 1}</strong><span>{step}</span></div>
          ))}
        </div>
        <pre>{JSON.stringify(payload, null, 2)}</pre>
      </div>
    </Panel>
  );
}

function PlanningScreen({ setActive, runtimeResult }) {
  return (
    <div className="planning-page">
      <Panel title="Autonomous AI Workflow" className="wide">
        <div className="timeline">
          {["Reading hiring requirements", "Searching recruitment memory", "Finding similar campaigns", "Comparing hiring platforms", "Calculating ROI", "Removing poor-performing platforms", "Reallocating budget", "Selecting AI model", "Generating job descriptions", "Preparing recruitment campaign"].map((step, index) => (
            <div className="timeline-step" key={step} style={{ animationDelay: `${index * 80}ms` }}><span><Check size={14} /></span>{step}</div>
          ))}
        </div>
        <div className="ready-row"><strong>Campaign Ready</strong><button className="secondary-button" onClick={() => setActive("monitoring")}>Open Campaign Dashboard</button></div>
      </Panel>
      {runtimeResult && <RuntimeSummary result={runtimeResult} />}
    </div>
  );
}

function HistoricalIntelligence({ memory, runtimeResult, campaignRows }) {
  const profile = memory.profile;
  const recalled = runtimeResult?.hindsight?.citations || [];
  const performance = buildPlatformPerformance(campaignRows);
  return (
    <div className="screen-grid">
      <Panel title="Previous Recruitment Campaigns" className="wide">
        <CampaignTable rows={campaignRows} />
      </Panel>
      <Panel title="Recalled For Latest Launch" className="wide">
        {recalled.length ? <MemoryEvidenceList citations={recalled} /> : <p className="panel-copy">Launch a campaign to see which previous campaigns Hindsight recalled for CascadeFlow.</p>}
      </Panel>
      <Panel title="Zero-Hire Risk Memory" className="wide">
        <RiskMemoryTable rows={profile?.risk_examples} />
      </Panel>
      <Panel title="Hiring Predictions"><PredictionList rows={campaignRows} /></Panel>
      <Panel title="Platform Recommendations" className="wide"><PlatformEfficiencyChart data={performance} /></Panel>
    </div>
  );
}

function CampaignTable({ compact = false, rows }) {
  const sourceRows = rows?.length
    ? rows.map((row) => ({
      role: row.role,
      platform: row.platform,
      budget: formatINR(row.budget),
      apps: row.applications || 0,
      interviews: row.interviews || 0,
      hires: row.hires || 0,
      roi: `${calculateRoi(row).toFixed(1)}x`,
      rec: row.hires > 0 ? "Good" : row.status === "Active" ? "Active" : "Poor"
    }))
    : [];
  if (!sourceRows.length) return <p className="panel-copy">No campaign rows loaded yet.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{["Job Role", "Platform", "Budget", "Applications", "Interviews", "Hires", "ROI", "Recommendation"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{sourceRows.slice(0, compact ? 3 : sourceRows.length).map((row, index) => <tr key={`${row.role}-${row.platform}-${index}`}><td>{row.role}</td><td>{row.platform}</td><td>{row.budget}</td><td>{row.apps}</td><td>{row.interviews}</td><td>{row.hires}</td><td>{row.roi}</td><td><span className={`badge ${row.rec.toLowerCase()}`}>{row.rec}</span></td></tr>)}</tbody>
      </table>
    </div>
  );
}

function PredictionList({ rows }) {
  const topRoles = [...rows]
    .sort((a, b) => calculateRoi(b) - calculateRoi(a))
    .slice(0, 4);
  return (
    <div className="confidence-list">
      {topRoles.map((row) => (
        <div key={row.id || `${row.role}-${row.platform}`}>
          <span>{row.role} on {row.platform}</span>
          <strong>{Math.max(1, Math.round((row.interviews || 0) * 0.18))} predicted hires</strong>
        </div>
      ))}
    </div>
  );
}

function RiskMemoryTable({ rows = [] }) {
  if (!rows.length) return <p className="panel-copy">No risk examples loaded yet.</p>;
  return (
    <div className="risk-list">
      {rows.map((row) => (
        <div key={row.campaign_id}>
          <strong>{row.platform}</strong>
          <span>{row.role}</span>
          <small>{row.applications} applications, {row.interviews} interviews, {row.hires} hires</small>
        </div>
      ))}
    </div>
  );
}

function MemoryEvidenceList({ citations }) {
  return (
    <div className="evidence-list">
      {citations.map((citation) => (
        <article key={`${citation.platform}-${citation.campaign_id}`}>
          <span>{citation.source}</span>
          <h3>{citation.platform} campaign #{citation.campaign_id}</h3>
          <p>{citation.snippet}</p>
        </article>
      ))}
    </div>
  );
}

function Confidence() {
  return <div className="confidence-list">{["LinkedIn — Excellent", "Naukri — Good", "Wellfound — Average", "Indeed — Poor"].map((item, index) => <div key={item}><span>{item}</span><strong>{[94, 88, 64, 31][index]}%</strong></div>)}</div>;
}

function PlatformOptimization({ runtimeResult, workspaceData, setWorkspaceData, addNotification }) {
  const [mode, setMode] = useState("ai");
  const removed = runtimeResult?.platforms_removed?.map((item) => item.platform) || ["Indeed"];
  const kept = runtimeResult?.platforms_selected || workspaceData.campaigns?.[0]?.platforms || ["LinkedIn", "Naukri", "Wellfound"];
  const baseAllocations = runtimeResult?.budget_allocation?.length
    ? runtimeResult.budget_allocation
    : kept.map((platform) => ({ platform, amount: Math.round((workspaceData.budgetLimits?.total || 800000) / kept.length), percentage: Number((100 / kept.length).toFixed(1)) }));
  const [manualAllocations, setManualAllocations] = useState(baseAllocations);
  const allocations = mode === "ai" ? baseAllocations : manualAllocations;

  function updateAllocation(platform, amount) {
    setManualAllocations((current) => current.map((item) => item.platform === platform ? { ...item, amount: Number(amount) || 0 } : item));
  }

  function approveAll() {
    const total = allocations.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    setWorkspaceData((current) => ({ ...current, budgetLimits: { ...(current.budgetLimits || {}), total } }));
    addNotification?.("Budget updated", `${mode.toUpperCase()} allocations approved for ${kept.join(", ")}.`);
  }

  return (
    <div className="optimization-layout">
      <Panel title="Before"><PlatformStack items={demoCampaign.platforms} strike={removed[0]} /></Panel>
      <div className="arrow-panel"><ArrowRight size={28} /></div>
      <Panel title="After AI"><PlatformStack items={kept} /></Panel>
      <Panel title="Optimization Reason" className="side-panel">
        <div className="panel-tools"><button className={mode === "ai" ? "active" : ""} onClick={() => setMode("ai")}>AI Allocation</button><button className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>Manual</button></div>
        <Metric label="Budget Saved" value={`₹${Math.round((runtimeResult?.budget_saved || 200000) / 1000)}K`} detail="CascadeFlow override" Icon={WalletCards} />
        <p>{runtimeResult?.override?.citation?.snippet || "Launch a campaign to populate the optimization reason from CascadeFlow and Hindsight evidence."}</p>
        <div className="allocation-editor">
          {allocations.map((item) => (
            <label key={item.platform}>{item.platform}<input disabled={mode === "ai"} value={Math.round(item.amount)} onChange={(event) => updateAllocation(item.platform, event.target.value.replace(/[^\d]/g, ""))} /></label>
          ))}
        </div>
        <button className="secondary-button full" onClick={approveAll}>Approve All</button>
        <div className="reason-grid"><span>Hindsight Source</span><strong>{runtimeResult?.hindsight?.source || "local-json"}</strong><span>Budget Reallocated</span><strong>{kept.join(" + ")}</strong><span>Recommended Platforms</span><strong>{kept.length} active</strong></div>
      </Panel>
      {runtimeResult && <RuntimeSummary result={runtimeResult} />}
    </div>
  );
}

function PlatformStack({ items, strike }) {
  return <div className="platform-stack">{items.map((item) => <div className={item === strike ? "removed" : ""} key={item}>{item}</div>)}</div>;
}

function GeneratedPosts({ showNotice, workspaceData, setWorkspaceData, addNotification }) {
  const [tab, setTab] = useState("LinkedIn");
  const [posts, setPosts] = useState({ ...generatedPosts, ...(workspaceData.drafts || {}) });
  const [editing, setEditing] = useState(false);
  const count = posts[tab].length;

  async function copyPost() {
    try {
      await navigator.clipboard.writeText(posts[tab]);
      showNotice("Generated job post copied to clipboard.");
    } catch {
      showNotice("Copy is unavailable in this browser session, but the text is selected for editing.");
      setEditing(true);
    }
  }

  function regeneratePost() {
    setPosts((current) => ({
      ...current,
      [tab]: `${current[tab]} Optimized tone: direct, measurable, and tailored for ${tab} candidates.`
    }));
    addNotification?.("Draft saved", `${tab} post tone optimized.`);
  }

  function saveDraft() {
    setWorkspaceData((current) => ({ ...current, drafts: { ...(current.drafts || {}), ...posts } }));
    addNotification?.("Draft saved", `${tab} draft saved locally.`);
  }

  function postAllPlatforms() {
    setWorkspaceData((current) => ({
      ...current,
      notifications: [{
        id: makeId("notification"),
        type: "Campaign posted",
        message: `Posts published for ${Object.keys(posts).join(", ")}.`,
        createdAt: new Date().toISOString(),
        read: false
      }, ...(current.notifications || [])]
    }));
    showNotice("All platform posts recorded as published.");
  }

  function exportPostsCSV() {
    downloadCSV("hireflow-generated-posts.csv", buildPostingRows(posts));
    showNotice("Generated job posts CSV downloaded.");
  }

  return (
    <Panel title="AI Generated Job Posts" className="wide">
      <div className="tabs">{Object.keys(posts).map((name) => <button className={tab === name ? "active" : ""} onClick={() => setTab(name)} key={name}>{name}</button>)}</div>
      <textarea className="post-editor" value={posts[tab]} readOnly={!editing} onChange={(event) => setPosts({ ...posts, [tab]: event.target.value })} />
      <div className="editor-actions"><span>{count} characters</span><button onClick={copyPost}><Copy size={16} />Copy</button><button onClick={() => { setEditing(!editing); showNotice(editing ? "Editing locked." : "Editing enabled."); }}><Edit3 size={16} />{editing ? "Lock" : "Edit"}</button><button onClick={regeneratePost}><RefreshCw size={16} />Optimize Tone</button><button onClick={saveDraft}><Check size={16} />Save Draft</button><button onClick={postAllPlatforms}><Zap size={16} />Post All Platforms</button><button onClick={exportPostsCSV}><Download size={16} />CSV</button></div>
    </Panel>
  );
}

function BudgetGovernance({ runtimeResult, workspaceData, setWorkspaceData, addNotification, campaignRows }) {
  const [editing, setEditing] = useState(false);
  const limits = workspaceData.budgetLimits || workspaceDefaults.budgetLimits;
  const spent = campaignRows.filter((row) => row.status === "Completed").reduce((sum, row) => sum + Number(row.budget || 0), 0);
  const remaining = Math.max(0, Number(limits.total || 0) - spent);
  function exportBudgetCSV() {
    downloadCSV("hireflow-budget-allocation.csv", buildBudgetRows(runtimeResult, workspaceData));
  }

  function saveLimits(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextLimits = {
      total: Number(form.get("total")) || limits.total,
      perPlatform: Number(form.get("perPlatform")) || limits.perPlatform,
      warningThreshold: Number(form.get("warningThreshold")) || limits.warningThreshold
    };
    setWorkspaceData((current) => ({ ...current, budgetLimits: nextLimits }));
    setEditing(false);
    addNotification?.("Budget updated", `Budget limit updated to ${formatINR(nextLimits.total)}.`);
  }

  return (
    <div className="screen-grid">
      <div className="metric-grid four">{[["Allocated", formatINR(limits.total)], ["Spent", formatINR(spent)], ["Remaining", formatINR(remaining)], ["Saved", formatINR(runtimeResult?.budget_saved || 0)]].map(([l, v]) => <Metric key={l} label={l} value={v} detail="Live budget state" Icon={CircleDollarSign} />)}</div>
      <Panel title="Budget Distribution" className="wide"><BudgetAllocationChart runtimeResult={runtimeResult} workspaceData={workspaceData} /><div className="export-row"><button className="secondary-button" onClick={() => setEditing(true)}><Edit3 size={16} />Adjust Limits</button><button className="secondary-button" onClick={exportBudgetCSV}><Download size={16} />Download Budget CSV</button></div></Panel>
      <Panel title="Alerts" className="wide"><div className="alert-list"><div><ShieldCheck size={17} /> Overspending warning: LinkedIn CPC increased 12% today.</div><div><Sparkles size={17} /> Suggestion: shift ₹60K to Naukri while qualified applicant rate remains high.</div></div></Panel>
      {editing && <div className="modal-backdrop"><form className="modal" onSubmit={saveLimits}><h3>Adjust Budget Limits</h3><label>Total Limit<input name="total" defaultValue={limits.total} /></label><label>Per Platform Limit<input name="perPlatform" defaultValue={limits.perPlatform} /></label><label>Warning Threshold %<input name="warningThreshold" defaultValue={limits.warningThreshold} /></label><div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button">Save Limits</button></div></form></div>}
    </div>
  );
}

function CampaignMonitoring({ workspaceData, setWorkspaceData, addNotification }) {
  const activeCampaign = workspaceData.campaigns?.[0];
  const metrics = [
    ["Applications", activeCampaign?.applications || 0],
    ["Views", activeCampaign ? Math.round((activeCampaign.applications || 1) * 28) : 0],
    ["CTR", activeCampaign ? `${Math.max(1.1, ((activeCampaign.applications || 0) / Math.max((activeCampaign.applications || 1) * 28, 1)) * 100).toFixed(1)}%` : "0%"],
    ["Interviews", activeCampaign?.interviews || 0],
    ["Offers", Math.round((activeCampaign?.interviews || 0) * 0.18)]
  ];
  const [recommendations, setRecommendations] = useState([
    "Refresh Wellfound job post headline and reduce daily cap.",
    "Move 8% of manual budget to Naukri for stronger hire efficiency."
  ]);

  function applyRecommendation(text) {
    setWorkspaceData((current) => ({
      ...current,
      campaigns: (current.campaigns || []).map((campaign, index) => index === 0 ? { ...campaign, applications: (campaign.applications || 0) + 24, status: "Optimized" } : campaign)
    }));
    setRecommendations((current) => current.filter((item) => item !== text));
    addNotification?.("Recommendation applied", text);
  }

  function dismissRecommendation(text) {
    setRecommendations((current) => current.filter((item) => item !== text));
    addNotification?.("Recommendation dismissed", text);
  }

  return (
    <div className="screen-grid">
      <div className="metric-grid">{metrics.map(([l, v]) => <Metric key={l} label={l} value={v} detail="Live analytics" Icon={Gauge} />)}</div>
      <Panel title="Campaign Timeline" className="wide"><div className="timeline horizontal">{["Campaign Started", "Applications Received", "Candidates Shortlisted", "Interview Scheduled", "Offer Sent", "Candidate Hired"].map((step) => <div className="timeline-step done" key={step}><span><Check size={14} /></span>{step}</div>)}</div></Panel>
      <Panel title="Corrective Actions" className="wide"><div className="alert-list">{recommendations.map((item) => <div key={item}><Bot size={17} /><span>{item}</span><button className="secondary-button small" onClick={() => applyRecommendation(item)}>Apply</button><button className="ghost-button small" onClick={() => dismissRecommendation(item)}>Dismiss</button></div>)}</div></Panel>
    </div>
  );
}

function InterviewFeedback({ showNotice, workspaceData, setWorkspaceData, addNotification }) {
  const seedCandidates = ["Aarav Mehta", "Neha Kapoor", "Rohan Iyer"];
  const candidates = workspaceData.interviews?.length ? workspaceData.interviews.map((item) => item.candidate) : seedCandidates;
  const [candidate, setCandidate] = useState(candidates[0]);
  const [scheduling, setScheduling] = useState(false);
  const selected = workspaceData.interviews?.find((item) => item.candidate === candidate) || {
    candidate,
    stage: "Final Round",
    technical: 88,
    communication: 82,
    recommendation: "Hire",
    scheduledAt: "Not scheduled"
  };

  function saveInterview(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record = {
      id: makeId("interview"),
      candidate: form.get("candidate"),
      stage: form.get("stage"),
      scheduledAt: form.get("scheduledAt"),
      technical: Number(form.get("technical")),
      communication: Number(form.get("communication")),
      recommendation: form.get("recommendation")
    };
    setWorkspaceData((current) => ({ ...current, interviews: [record, ...(current.interviews || []).filter((item) => item.candidate !== record.candidate)] }));
    setCandidate(record.candidate);
    setScheduling(false);
    addNotification?.("Interview scheduled", `${record.candidate} interview saved.`);
  }

  return (
    <div className="feedback-layout">
      <Panel title="Candidates">
        <div className="candidate-list">{candidates.map((name) => <button className={candidate === name ? "active" : ""} key={name} onClick={() => setCandidate(name)}><UsersRound size={16} />{name}<span>Final Round</span></button>)}</div>
        <button className="secondary-button full memory-refresh" onClick={() => setScheduling(true)}>Schedule Interview</button>
      </Panel>
      <Panel title={`${candidate} Report`} className="wide">
        <div className="report-grid"><div><span>Technical Score</span><strong>{selected.technical}/100</strong></div><div><span>Communication Score</span><strong>{selected.communication}/100</strong></div><div><span>Scheduled</span><strong>{selected.scheduledAt}</strong></div><div><span>Problem Solving</span><strong>{selected.technical >= 80 ? "Advanced" : "Needs review"}</strong></div><div><span>Strengths</span><strong>System design</strong></div><div><span>Culture Fit</span><strong>{selected.communication >= 75 ? "High" : "Medium"}</strong></div></div>
        <div className="recommendation"><strong>AI Recommendation</strong><span>{selected.recommendation}</span><button className="secondary-button" onClick={() => showNotice(`${candidate} report exported from saved interview data.`)}>Export PDF Report</button></div>
      </Panel>
      {scheduling && <div className="modal-backdrop"><form className="modal" onSubmit={saveInterview}><h3>Schedule Interview</h3><label>Candidate<input name="candidate" defaultValue={candidate} /></label><label>Stage<input name="stage" defaultValue="Final Round" /></label><label>Date<input name="scheduledAt" type="datetime-local" /></label><label>Technical Score<input name="technical" defaultValue="88" /></label><label>Communication Score<input name="communication" defaultValue="82" /></label><label>Recommendation<select name="recommendation" defaultValue="Hire"><option>Hire</option><option>Hold</option><option>Reject</option></select></label><div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setScheduling(false)}>Cancel</button><button className="primary-button">Save Interview</button></div></form></div>}
    </div>
  );
}

function RecruitmentMemory({ memory, runtimeResult, onSetupMemory, campaignRows }) {
  const profile = memory.profile;
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  return (
    <div className="screen-grid">
      <div className="metric-grid four">{[["Campaigns Loaded", profile?.campaign_count || 0], ["Memory Bank", profile?.bank_id || "hireflow-campaigns"], ["Risk Memories", profile?.zero_hire_count || 0], ["Last Recall", runtimeResult ? `${runtimeResult.hindsight?.latency_ms}ms` : "Not run"]].map(([l, v]) => <Metric key={l} label={l} value={v} detail="Hindsight memory state" Icon={Bot} />)}</div>
      <Panel title="Memory Lifecycle" className="wide">
        <div className="memory-chain">{["Retain historical campaigns", "Recall similar role/platform memories", "Attach citation to decision", "CascadeFlow gates the launch", "Audit trail updates the UI"].map((item) => <div key={item}>{item}</div>)}</div>
        <button className="secondary-button memory-refresh" onClick={onSetupMemory}>Retain History Again</button>
      </Panel>
      <Panel title="Latest Hindsight Evidence" className="wide">
        {runtimeResult?.hindsight?.citations?.length ? <MemoryEvidenceList citations={runtimeResult.hindsight.citations} /> : <p className="panel-copy">No runtime recall yet. Launch a campaign to populate evidence.</p>}
      </Panel>
      <Panel title="Dynamic Campaign History" className="wide">
        <div className="campaign-card-grid">{campaignRows.slice(0, 12).map((campaign) => <button className="campaign-memory-card" key={campaign.id} onClick={() => setSelectedCampaign(campaign)}><strong>{campaign.role}</strong><span>{campaign.platform}</span><small>{formatINR(campaign.budget)} · {campaign.status}</small></button>)}</div>
      </Panel>
      {selectedCampaign && <div className="modal-backdrop"><div className="modal"><h3>{selectedCampaign.role}</h3><div className="detail-list"><div><span>Budget</span><strong>{formatINR(selectedCampaign.budget)}</strong></div><div><span>Skills</span><strong>{selectedCampaign.skills?.join(", ")}</strong></div><div><span>Platforms</span><strong>{selectedCampaign.platforms?.join(", ") || selectedCampaign.platform}</strong></div><div><span>Status</span><strong>{selectedCampaign.status}</strong></div><div><span>Created Date</span><strong>{selectedCampaign.createdAt}</strong></div><div><span>Description</span><strong>{selectedCampaign.description}</strong></div></div><button className="primary-button full" onClick={() => setSelectedCampaign(null)}>Close</button></div></div>}
    </div>
  );
}

function Reports({ showNotice, runtimeResult, workspaceData, setWorkspaceData, campaignRows }) {
  const [builder, setBuilder] = useState({ name: "Hiring Efficiency Report", includeBudget: true, includeCampaigns: true, includeInterviews: true });
  function exportSummaryCSV() {
    downloadCSV("hireflow-campaign-summary.csv", buildCampaignSummaryRows(runtimeResult));
    showNotice("Campaign summary CSV downloaded.");
  }

  function exportFullReportCSV() {
    const performanceRows = buildPlatformPerformance(campaignRows);
    const trendRows = buildTrend(campaignRows, "month");
    downloadCSV("hireflow-full-report.csv", [
      ...buildCampaignSummaryRows(runtimeResult).map((row) => ({ section: "summary", item: row.metric, value: row.value, notes: "" })),
      ...buildBudgetRows(runtimeResult, workspaceData).map((row) => ({ section: "budget", item: row.platform, value: `INR ${row.allocated_budget_inr}`, notes: `${row.allocation_percentage}% allocation; decision=${row.decision}; source=${row.hindsight_source}` })),
      ...performanceRows.map((row) => ({ section: "platform_performance", item: row.platform, value: row.status, notes: `budget_share=${row.budgetShare}%; qualified_hires=${row.qualifiedShare}%; cost_per_hire=INR ${Math.round(row.costPerHire)}` })),
      ...trendRows.map((row) => ({ section: "hiring_trend", item: row.month, value: row.applications, notes: `interviews=${row.interviews}; hires=${row.hires}` }))
    ]);
    showNotice("Full report CSV downloaded.");
  }

  function generateReport() {
    const report = {
      id: makeId("report"),
      ...builder,
      createdAt: new Date().toISOString(),
      rows: campaignRows.length
    };
    setWorkspaceData((current) => ({ ...current, reports: [report, ...(current.reports || [])] }));
    showNotice(`${report.name} generated and saved.`);
  }

  return <div className="screen-grid"><Panel title="Executive Report" className="wide"><HiringTrendChart data={buildTrend(campaignRows, "month")} /><p className="panel-copy">Report metrics are generated from campaign history and saved workspace activity.</p></Panel><Panel title="Custom Report Builder"><div className="report-builder"><label>Report Name<input value={builder.name} onChange={(event) => setBuilder({ ...builder, name: event.target.value })} /></label><label className="check-label"><input type="checkbox" checked={builder.includeBudget} onChange={(event) => setBuilder({ ...builder, includeBudget: event.target.checked })} /> Budget</label><label className="check-label"><input type="checkbox" checked={builder.includeCampaigns} onChange={(event) => setBuilder({ ...builder, includeCampaigns: event.target.checked })} /> Campaigns</label><label className="check-label"><input type="checkbox" checked={builder.includeInterviews} onChange={(event) => setBuilder({ ...builder, includeInterviews: event.target.checked })} /> Interviews</label><button className="primary-button full" onClick={generateReport}>Generate Report</button></div></Panel><Panel title="Saved Reports" className="wide"><div className="decision-list">{(workspaceData.reports || []).map((report) => <div key={report.id}><FileText size={16} /><span>{report.name} · {new Date(report.createdAt).toLocaleString()} · {report.rows} campaign rows</span></div>)}</div></Panel><Panel title="Export Center"><div className="export-actions"><button className="primary-button full" onClick={exportFullReportCSV}><Download size={16} />Download Full Report CSV</button><button className="secondary-button full" onClick={exportSummaryCSV}><Download size={16} />Download Summary CSV</button><button className="secondary-button full" onClick={() => { downloadCSV("hireflow-budget-allocation.csv", buildBudgetRows(runtimeResult, workspaceData)); showNotice("Budget CSV downloaded."); }}><Download size={16} />Download Budget CSV</button></div></Panel></div>;
}

function NotificationCenter({ workspaceData, setWorkspaceData }) {
  function markAllRead() {
    setWorkspaceData((current) => ({ ...current, notifications: (current.notifications || []).map((item) => ({ ...item, read: true })) }));
  }

  return (
    <Panel title="Notification Center" className="wide">
      <div className="export-row"><button className="secondary-button" onClick={markAllRead}>Mark All Read</button></div>
      <div className="decision-list">
        {(workspaceData.notifications || []).map((item) => <div key={item.id} className={item.read ? "read" : ""}><Bell size={16} /><span>{item.type}: {item.message} · {new Date(item.createdAt).toLocaleString()}</span></div>)}
        {!(workspaceData.notifications || []).length && <div><Bell size={16} /><span>No notifications yet.</span></div>}
      </div>
    </Panel>
  );
}

function SettingsScreen({ workspaceData, setWorkspaceData, addNotification }) {
  const [selected, setSelected] = useState("Company Profile");
  const [form, setForm] = useState(workspaceData.settings || workspaceDefaults.settings);
  const sections = ["Company Profile", "AI Guardrails", "Default Budget", "Preferred Platforms", "Notification Settings"];

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveSettings() {
    setWorkspaceData((current) => ({ ...current, settings: form }));
    addNotification?.("Settings updated", `${selected} saved.`);
  }

  return <Panel title="Settings" className="wide"><div className="settings-layout"><div className="settings-list">{sections.map((section) => <button className={selected === section ? "active" : ""} key={section} onClick={() => setSelected(section)}><Building2 size={17} />{section}<ChevronRight size={17} /></button>)}</div><div className="settings-detail"><span>// CONFIG_PANEL</span><h3>{selected}</h3><p>Settings persist locally and update campaign guardrails and defaults.</p><label>Company Name<input value={form.companyName} onChange={(event) => updateField("companyName", event.target.value)} /></label><label>Industry<input value={form.industry} onChange={(event) => updateField("industry", event.target.value)} /></label><label>Default Budget<input value={form.defaultBudget} onChange={(event) => updateField("defaultBudget", event.target.value.replace(/[^\d]/g, ""))} /></label><label>Preferred Platforms<input value={form.preferredPlatforms} onChange={(event) => updateField("preferredPlatforms", event.target.value)} /></label><label>AI Guardrails<textarea value={form.aiGuardrails} onChange={(event) => updateField("aiGuardrails", event.target.value)} /></label><label className="check-label"><input type="checkbox" checked={form.notifications} onChange={(event) => updateField("notifications", event.target.checked)} /> Notifications Enabled</label><button className="primary-button" onClick={saveSettings}>Save Settings</button></div></div></Panel>;
}

function RuntimeDecisionPanel({ runtime, onClose }) {
  if (runtime.status === "idle") return null;

  const result = runtime.result;
  const citation = result?.hindsight?.citation;
  const removed = result?.platforms_removed || [];

  return (
    <aside className="runtime-panel" aria-live="polite">
      <div className="runtime-header">
        <span className="eyebrow"><ShieldCheck size={15} /> CascadeFlow Runtime</span>
        {runtime.status !== "loading" && <button className="icon-button" aria-label="Close runtime panel" onClick={onClose}>x</button>}
      </div>

      {runtime.status === "loading" && (
        <div className="runtime-loading">
          <div className="runtime-pulse" />
          <h3>Intercepting campaign launch</h3>
          <p>UI request captured. CascadeFlow is querying Hindsight memory and preparing the governance decision.</p>
          <div className="runtime-steps">
            <span>UI action received</span>
            <span>Hindsight recall running</span>
            <span>CascadeFlow gate evaluating</span>
          </div>
        </div>
      )}

      {runtime.status === "error" && (
        <div className="runtime-error">
          <AlertTriangle size={22} />
          <h3>Runtime unavailable</h3>
          <p>{runtime.error}</p>
        </div>
      )}

      {runtime.status === "complete" && result && (
        <>
          <div className={`override-banner ${result.cascadeflow?.overrode_user_action ? "active" : "allowed"}`}>
            <AlertTriangle size={20} />
            <div>
              <strong>{result.cascadeflow?.overrode_user_action ? "CascadeFlow overrode the launch" : "CascadeFlow allowed the launch"}</strong>
              <span>{result.decision_summary}</span>
            </div>
          </div>

          <div className="runtime-grid">
            <div><span>Original Platforms</span><strong>{result.request_payload?.platforms?.join(", ") || demoCampaign.platforms.join(", ")}</strong></div>
            <div><span>Final Platforms</span><strong>{result.platforms_selected.join(", ") || "None"}</strong></div>
            <div><span>Removed</span><strong>{removed.map((item) => item.platform).join(", ") || "None"}</strong></div>
            <div><span>Recall Latency</span><strong>{result.hindsight?.latency_ms}ms</strong></div>
          </div>

          <section className="route-box">
            <span>// BACKEND_RUNTIME_PATH</span>
            {(result.cascadeflow?.runtime_path || []).map((step, index) => (
              <div key={step}><strong>{index + 1}</strong><span>{step}</span></div>
            ))}
            <pre>{JSON.stringify(result.request_payload, null, 2)}</pre>
          </section>

          {citation && (
            <section className="citation-box">
              <span>// HINDSIGHT_CITATION</span>
              <h3>{citation.platform} campaign #{citation.campaign_id}</h3>
              <p>{citation.snippet}</p>
            </section>
          )}

          <section className="audit-box">
            <span>// AUDIT_TRAIL</span>
            {result.audit_log.slice(0, 9).map((log, index) => (
              <div key={`${log.timestamp}-${index}`}><strong>{log.level}</strong><span>{log.message}</span></div>
            ))}
          </section>
        </>
      )}
    </aside>
  );
}

function RuntimeSummary({ result }) {
  const citation = result?.hindsight?.citation;
  return (
    <Panel title="Live Runtime Decision" className="wide runtime-summary">
      <div className="override-banner active">
        <ShieldCheck size={20} />
        <div>
          <strong>{result.cascadeflow?.decision === "override" ? "Autonomous override applied" : "Launch allowed"}</strong>
          <span>{result.decision_summary}</span>
        </div>
      </div>
      {citation && <p className="panel-copy"><strong>Hindsight citation:</strong> {citation.snippet}</p>}
      <div className="audit-box inline">
        {result.audit_log.slice(0, 6).map((log, index) => (
          <div key={`${log.timestamp}-${index}`}><strong>{log.level}</strong><span>{log.message}</span></div>
        ))}
      </div>
    </Panel>
  );
}

createRoot(document.getElementById("root")).render(<App />);
