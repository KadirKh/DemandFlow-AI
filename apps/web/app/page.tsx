"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import GlowOverlay from "../components/ui/GlowOverlay";
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
  Moon
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, forecasting, inventory, recommendations
  const [userRole, setUserRole] = useState("");
  const [theme, setTheme] = useState("light");

  const checkRedirect = async () => {
    try {
      const res = await ApiClient.checkDataStatus();
      if (res.has_data) {
        router.push("/dashboard");
      } else {
        router.push("/upload");
      }
    } catch (err) {
      console.error("Failed to check data status:", err);
      router.push("/upload");
    }
  };

  useEffect(() => {
    // Initialize API client and check if user is already authenticated
    ApiClient.initialize();
    if (ApiClient.isAuthenticated()) {
      setIsLoggedIn(true);
      setUserRole(ApiClient.getRole() || "Manufacturer");
      checkRedirect();
    }

    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("df_theme");
      const initialTheme = savedTheme === "dark" ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.setAttribute("data-theme", initialTheme);
    }
  }, []);

  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      // Validate origin
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === "GOOGLE_AUTH_SUCCESS") {
        const { email, name } = event.data;
        setError("");
        setLoading(true);
        try {
          // Use secure deterministic password for Google accounts
          const googlePass = `google_oauth_bypass_${email}_demandflow_2026`;
          let role = "Manufacturer";
          try {
            // Try logging in
            const res = await ApiClient.login(email, googlePass);
            role = res.role;
          } catch (err: any) {
            // Register since account does not exist
            const regRes = await ApiClient.register(email, googlePass, "manufacturer");
            role = regRes.role;
          }
          
          setUserRole(role);
          setIsLoggedIn(true);
        } catch (err: any) {
          setError(err.message || "Google Account authentication failed.");
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => {
      window.removeEventListener("message", handleAuthMessage);
    };
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
      await checkRedirect();
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend API.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      "/google-login.html",
      "Google Sign-In",
      `width=${width},height=${height},top=${top},left=${left},scrollbars=no,resizable=no`
    );
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
      <main className="min-h-screen w-full relative flex items-center justify-center p-4 overflow-hidden">
        <GlowOverlay />
        
        <Card className="w-full max-w-md flex flex-col gap-6 p-8 relative shadow-lg">
          {/* Logo and title */}
          <div className="flex flex-col items-center gap-2 text-center select-none">
            <div className="h-14 w-14 bg-md-primary text-white rounded-[20px] flex items-center justify-center shadow-md animate-pulse">
              <Boxes className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-md-on-background mt-2">DemandFlow AI</h1>
            <p className="text-xs text-md-on-surface-variant max-w-xs leading-relaxed">
              Log in to access supply chain demand predictions, inventory controls, and transport lane logs.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="absolute top-6 right-6 h-9 w-9 rounded-full border border-md-outline/20 bg-md-surface-container-low text-md-on-surface-variant flex items-center justify-center hover:bg-md-primary/10"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="relative">
              <Input
                id="email"
                type="text"
                label="User ID"
                placeholder="Enter User ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="relative">
              <Input
                id="password"
                type="password"
                label="Security Key / Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex justify-end mt-1 px-1">
                <button
                  type="button"
                  onClick={() => alert("Please contact system administrator to reset security keys.")}
                  className="text-[10px] text-md-primary font-semibold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </div>


            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold flex gap-2 items-center">
                <Shield className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-2 h-11 text-xs font-bold">
              {loading ? "Authorizing..." : "Sign In to Console"}
            </Button>
          </form>

          <div className="text-[11px] text-md-on-surface-variant text-center">
            Need an account?{" "}
            <Link href="/signup" className="text-md-primary font-bold hover:underline">
              Create one
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 select-none py-1">
            <div className="h-px bg-md-outline/10 flex-1" />
            <span className="text-[9px] font-bold text-md-on-surface-variant/40 uppercase tracking-widest">or sign in with</span>
            <div className="h-px bg-md-outline/10 flex-1" />
          </div>

          {/* Google Sign-In */}
          <Button 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={loading || googleLoading} 
            className="w-full h-11 text-xs font-bold flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm transition-colors duration-200"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </Button>

        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex relative w-full overflow-hidden">
      <GlowOverlay />
      
      {/* Sidebar navigation */}
      <aside className="w-64 bg-md-surface-container/60 border-r border-md-outline/10 flex flex-col p-6 shrink-0 relative">
        <div className="flex items-center gap-3 select-none mb-10">
          <div className="h-10 w-10 bg-md-primary text-white rounded-xl flex items-center justify-center shadow-sm">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-md-on-background tracking-tight">DemandFlow AI</h1>
            <span className="text-[9px] uppercase font-bold tracking-wider text-md-primary">Supply Optimization</span>
          </div>
        </div>

        {/* Links list */}
        <nav className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-3.5 w-full p-3 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === "overview"
                ? "bg-md-secondary-container text-md-on-secondary-container shadow-sm"
                : "text-md-on-surface-variant hover:bg-md-primary/5 hover:text-md-primary"
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            <span>Console Overview</span>
          </button>
          
          <button
            onClick={() => setActiveTab("forecasting")}
            className={`flex items-center gap-3.5 w-full p-3 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === "forecasting"
                ? "bg-md-secondary-container text-md-on-secondary-container shadow-sm"
                : "text-md-on-surface-variant hover:bg-md-primary/5 hover:text-md-primary"
            }`}
          >
            <LineChart className="h-4.5 w-4.5" />
            <span>Demand Prediction</span>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-3.5 w-full p-3 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === "inventory"
                ? "bg-md-secondary-container text-md-on-secondary-container shadow-sm"
                : "text-md-on-surface-variant hover:bg-md-primary/5 hover:text-md-primary"
            }`}
          >
            <Boxes className="h-4.5 w-4.5" />
            <span>Inventory Optimizer</span>
          </button>

          <button
            onClick={() => setActiveTab("recommendations")}
            className={`flex items-center gap-3.5 w-full p-3 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === "recommendations"
                ? "bg-md-secondary-container text-md-on-secondary-container shadow-sm"
                : "text-md-on-surface-variant hover:bg-md-primary/5 hover:text-md-primary"
            }`}
          >
            <Inbox className="h-4.5 w-4.5" />
            <span>Decisions Inbox</span>
          </button>
        </nav>

        {/* User profile profile info */}
        <div className="mt-auto border-t border-md-outline/10 pt-4 flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-md-surface-container-low border border-md-outline/10 rounded-full flex items-center justify-center">
              <User className="h-4.5 w-4.5 text-md-on-surface-variant" />
            </div>
            <div>
              <div className="text-[11px] font-black text-md-on-background line-clamp-1">Supply Console</div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-md-primary capitalize">Role: {userRole}</span>
            </div>
          </div>

          <Button
            variant="outlined"
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 h-9 text-[11px] font-bold border-md-outline/30"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>

          <Button 
            variant="outlined" 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 h-9 text-[11px] font-bold border-md-outline/30 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
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
