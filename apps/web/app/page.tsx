"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import GlowOverlay from "../components/ui/GlowOverlay";
import ConveyorAnimation from "../components/ConveyorAnimation";
import DashboardTab from "../components/DashboardTab";
import ForecastingTab from "../components/ForecastingTab";
import InventoryTab from "../components/InventoryTab";
import RecommendationsTab from "../components/RecommendationsTab";
import { ApiClient } from "../lib/api-client";
import { 
  Lock, 
  Mail, 
  Shield, 
  LayoutDashboard, 
  LineChart, 
  Inbox, 
  Boxes, 
  LogOut, 
  User, 
  Building2,
  Sun,
  Moon,
  Activity,
  ArrowRight
} from "lucide-react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, forecasting, inventory, recommendations
  const [userRole, setUserRole] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Initialize API client and check if user is already authenticated
    ApiClient.initialize();
    if (ApiClient.isAuthenticated()) {
      setIsLoggedIn(true);
      setUserRole(ApiClient.getRole() || "Manufacturer");
    }

    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("df_theme");
      const initialTheme = savedTheme === "dark" ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.setAttribute("data-theme", initialTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("df_theme", nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const { role } = await ApiClient.login(email, password);
      setUserRole(role);
      setIsLoggedIn(true);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend API.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const { role } = await ApiClient.loginWithGoogle();
      setUserRole(role);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError("Google Authentication failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogout = () => {
    ApiClient.clearAuth();
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
    setUserRole("");
  };

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen w-full relative flex items-center justify-center p-6 lg:p-12 overflow-hidden bg-[var(--color-md-background)]">
        <GlowOverlay />
        
        {/* Sleek, human-engineered split mechanical board grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl w-full relative z-10 items-center">
          
          {/* Left panel column: Real-time logistics telemetry monitor */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="mb-2 select-none">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-md-surface-container)] border border-[rgba(255,255,255,0.4)] shadow-[var(--shadow-card)]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[var(--shadow-glow)]" />
                <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-[var(--color-md-on-surface-variant)]">CORE OPERATIONS CONSOLE</span>
              </div>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--color-md-on-background)] font-sans leading-tight">
              Smarter supply chains<br />
              <span className="text-[var(--color-md-primary)]">modeled in real-time.</span>
            </h2>
            
            <p className="text-xs text-[var(--color-md-on-surface-variant)] max-w-md leading-relaxed font-sans mb-3">
              DemandFlow AI connects deep linear regression and neural forecasting structures directly into your inventory routing nodes, instantly avoiding stockouts.
            </p>

            <ConveyorAnimation />
          </div>

          {/* Right panel column: Tactical Braun-style control panel */}
          <div className="lg:col-span-5 w-full">
            <Card hasScrews={true} hasVents={true} className="w-full flex flex-col gap-6 p-8 shadow-[var(--shadow-floating)]">
              {/* Logo and title */}
              <div className="flex flex-col items-center gap-2 text-center select-none mt-2">
                <div className="h-12 w-12 bg-[var(--color-md-primary)] text-white rounded-lg flex items-center justify-center shadow-[4px_4px_8px_rgba(255,71,87,0.3)] border border-[rgba(255,255,255,0.2)]">
                  <Boxes className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--color-md-on-background)] mt-2 font-sans uppercase">DemandFlow AI</h1>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-md-on-surface-variant)]/60 font-mono">
                  SECURE CONTROL GATEWAY
                </p>
              </div>

              {/* Minimalist, streamlined auth flow */}
              <div className="flex flex-col gap-4">
                {/* 1. Google Authentication - Primary, highly user-friendly entrance */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  className="w-full h-12 inline-flex items-center justify-center gap-3 bg-[var(--color-md-background)] text-[var(--color-md-on-background)] font-mono text-xs uppercase tracking-wider font-bold rounded-md border border-[rgba(255,255,255,0.6)] shadow-[var(--shadow-card)] cursor-pointer select-none transition-all duration-150 active:translate-y-[2px] active:shadow-[var(--shadow-pressed)] disabled:opacity-50"
                >
                  {googleLoading ? (
                    <Activity className="h-4.5 w-4.5 text-[var(--color-md-primary)] animate-spin" />
                  ) : (
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  )}
                  <span>{googleLoading ? "SECURE SYNCING..." : "USE GOOGLE SECURE PORT"}</span>
                </button>

                {/* Separator split line */}
                <div className="flex items-center gap-3 select-none">
                  <div className="flex-1 h-[1px] bg-[var(--color-md-outline)] opacity-20" />
                  <span className="font-mono text-[8px] uppercase tracking-widest text-[var(--color-md-on-surface-variant)]/50">OR BY SECURITY PASS</span>
                  <div className="flex-1 h-[1px] bg-[var(--color-md-outline)] opacity-20" />
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <Input
                    id="email"
                    type="text"
                    label="OPERATOR USER ID"
                    placeholder="admin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  
                  <Input
                    id="password"
                    type="password"
                    label="SECURITY PASSCODE"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  {error && (
                    <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-[10px] rounded font-mono font-bold flex gap-2 items-center">
                      <Shield className="h-4 w-4 shrink-0" />
                      <span className="uppercase">{error}</span>
                    </div>
                  )}

                  <Button type="submit" disabled={loading || googleLoading} className="w-full mt-2 h-12 text-xs font-mono tracking-widest uppercase">
                    {loading ? "AUTHORIZING..." : "ENGAGE SECURITY DECK"}
                  </Button>
                </form>
              </div>

              {/* Stamped Register Label */}
              <div className="text-[10px] font-mono text-[var(--color-md-on-surface-variant)]/60 text-center select-none mb-2">
                NO REGISTERED CREDENTIALS?{" "}
                <Link href="/signup" className="text-[var(--color-md-primary)] font-bold hover:underline ml-1">
                  GENERATE LICENSE
                </Link>
              </div>
            </Card>
          </div>
          
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex relative w-full overflow-hidden bg-[var(--color-md-background)]">
      <GlowOverlay />
      
      {/* Sidebar navigation: Beautiful 3D Industrial Rack Mount Synthesizer Bracket */}
      <aside className="w-64 bg-[var(--color-md-surface-container)] border-r border-[var(--color-md-outline)] flex flex-col p-6 shrink-0 relative shadow-[var(--shadow-card)] border border-[rgba(255,255,255,0.4)]">
        {/* Screw brackets on corners */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[var(--color-md-outline)] opacity-40 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]" />
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-md-outline)] opacity-40 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]" />
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[var(--color-md-outline)] opacity-40 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]" />
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[var(--color-md-outline)] opacity-40 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]" />

        {/* Rack Label */}
        <div className="flex items-center gap-3 select-none mb-10 mt-2">
          <div className="h-10 w-10 bg-[var(--color-md-primary)] text-white rounded-lg flex items-center justify-center shadow-[2px_2px_4px_rgba(255,71,87,0.2)] border border-[rgba(255,255,255,0.15)]">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-[var(--color-md-on-background)] tracking-wider uppercase font-mono">DemandFlow AI</h1>
            <span className="text-[8px] uppercase font-black tracking-widest text-[var(--color-md-primary)] font-mono block">RACK UNIT // 01</span>
          </div>
        </div>

        {/* Links list: Tactile slide switches */}
        <nav className="flex flex-col gap-3 font-mono">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-3 w-full p-3 rounded text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
              activeTab === "overview"
                ? "bg-[var(--color-md-background)] text-[var(--color-md-on-background)] shadow-[var(--shadow-recessed)]"
                : "text-[var(--color-md-on-surface-variant)] hover:bg-[var(--color-md-surface-container-low)] active:translate-y-[1px]"
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5 text-[var(--color-md-primary)]" />
            <span>01 // CONSOLE OVERVIEW</span>
          </button>
          
          <button
            onClick={() => setActiveTab("forecasting")}
            className={`flex items-center gap-3 w-full p-3 rounded text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
              activeTab === "forecasting"
                ? "bg-[var(--color-md-background)] text-[var(--color-md-on-background)] shadow-[var(--shadow-recessed)]"
                : "text-[var(--color-md-on-surface-variant)] hover:bg-[var(--color-md-surface-container-low)] active:translate-y-[1px]"
            }`}
          >
            <LineChart className="h-4.5 w-4.5 text-[var(--color-md-primary)]" />
            <span>02 // DEMAND PREDICTION</span>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-3 w-full p-3 rounded text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
              activeTab === "inventory"
                ? "bg-[var(--color-md-background)] text-[var(--color-md-on-background)] shadow-[var(--shadow-recessed)]"
                : "text-[var(--color-md-on-surface-variant)] hover:bg-[var(--color-md-surface-container-low)] active:translate-y-[1px]"
            }`}
          >
            <Boxes className="h-4.5 w-4.5 text-[var(--color-md-primary)]" />
            <span>03 // INVENTORY PLANNER</span>
          </button>

          <button
            onClick={() => setActiveTab("recommendations")}
            className={`flex items-center gap-3 w-full p-3 rounded text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
              activeTab === "recommendations"
                ? "bg-[var(--color-md-background)] text-[var(--color-md-on-background)] shadow-[var(--shadow-recessed)]"
                : "text-[var(--color-md-on-surface-variant)] hover:bg-[var(--color-md-surface-container-low)] active:translate-y-[1px]"
            }`}
          >
            <Inbox className="h-4.5 w-4.5 text-[var(--color-md-primary)]" />
            <span>04 // DECISIONS INBOX</span>
          </button>
        </nav>

        {/* User profile rack mount info */}
        <div className="mt-auto border-t border-[var(--color-md-outline)] opacity-90 pt-5 flex flex-col gap-4 font-mono select-none">
          <div className="flex items-center gap-3 bg-[var(--color-md-background)] p-2.5 rounded shadow-[var(--shadow-recessed)]">
            <div className="h-8 w-8 bg-[var(--color-md-surface-container)] rounded flex items-center justify-center shadow-[var(--shadow-card)] shrink-0">
              <User className="h-4 w-4 text-[var(--color-md-primary)]" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[9px] font-bold text-[var(--color-md-on-background)] truncate uppercase">OPERATOR DECK</div>
              <span className="text-[8px] uppercase tracking-wider text-green-600 flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-led" />
                {userRole}
              </span>
            </div>
          </div>

          <Button
            variant="outlined"
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 h-9 text-[9px] font-bold font-mono py-1 rounded"
          >
            {theme === "dark" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            {theme === "dark" ? "LIGHT_MODE" : "DARK_MODE"}
          </Button>

          <Button 
            variant="outlined" 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 h-9 text-[9px] font-bold font-mono py-1 rounded border-red-500/20 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 hover:border-red-500 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> SHUT_DOWN
          </Button>
        </div>
      </aside>

      {/* Main content page area */}
      <section className="flex-1 p-8 overflow-y-auto max-h-screen">
        {activeTab === "overview" && <DashboardTab onNavigateToTab={setActiveTab} />}
        {activeTab === "forecasting" && <ForecastingTab />}
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "recommendations" && <RecommendationsTab />}
      </section>
    </main>
  );
}

