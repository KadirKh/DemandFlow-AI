"use client";

import React, { useState, useEffect } from "react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import GlowOverlay from "../components/ui/GlowOverlay";
import DashboardTab from "../components/DashboardTab";
import ForecastingTab from "../components/ForecastingTab";
import InventoryTab from "../components/InventoryTab";
import RecommendationsTab from "../components/RecommendationsTab";
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
  Building2 
} from "lucide-react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, forecasting, inventory, recommendations
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("demandflow_token");
    const role = localStorage.getItem("demandflow_role");
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role || "Planner");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      if (!res.ok) {
        throw new Error("Invalid username or password");
      }
      
      const data = await res.json();
      localStorage.setItem("demandflow_token", data.token);
      localStorage.setItem("demandflow_role", data.user.role);
      setUserRole(data.user.role);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend api.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("demandflow_token");
    localStorage.removeItem("demandflow_role");
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
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

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="relative">
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="planner@demandflow.ai"
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
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold flex gap-2 items-center">
                <Shield className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-4 h-11 text-xs font-bold">
              {loading ? "Authorizing..." : "Sign In to Console"}
            </Button>
          </form>

          {/* Quick instructions details */}
          <div className="bg-md-surface-container-low border border-md-outline/10 p-3.5 rounded-2xl flex flex-col gap-1 text-[11px] text-md-on-surface-variant leading-relaxed">
            <span className="font-bold text-md-on-background uppercase tracking-wider text-[9px]">Demo Access Credentials:</span>
            <span>Planner: <code className="bg-white/50 px-1 py-0.5 rounded font-black text-md-primary">planner@demandflow.ai</code> / password: <code className="bg-white/50 px-1 py-0.5 rounded font-black text-md-primary">plannerpassword</code></span>
            <span>Manager: <code className="bg-white/50 px-1 py-0.5 rounded font-black text-md-primary">ops@demandflow.ai</code> / password: <code className="bg-white/50 px-1 py-0.5 rounded font-black text-md-primary">opspassword</code></span>
          </div>
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
              <div className="text-[11px] font-black text-md-on-background line-clamp-1">Planner Console</div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-md-primary capitalize">Role: {userRole}</span>
            </div>
          </div>

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
