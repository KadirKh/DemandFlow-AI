"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ApiClient } from "../../lib/api-client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import GlowOverlay from "../../components/ui/GlowOverlay";
import {
  Boxes,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  TrendingUp,
  Brain,
  Upload,
  User,
  LogOut,
  ChevronRight,
  Eye,
  Trash2,
  Loader2,
  Activity,
  Flame,
  Leaf,
  Sliders,
  Settings,
  ShieldAlert,
  Download,
  Search,
  HelpCircle,
  Zap,
  Sparkles,
  Compass,
  ArrowUpRight,
  FileSpreadsheet
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

interface Recommendation {
  id: number;
  user_id: number | null;
  type: string;
  entity_id: string;
  score: number;
  explanation: string;
  action_status: string;
  active: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();

  // Navigation & Core State
  const [activeTab, setActiveTab] = useState<"overview" | "predictions" | "research" | "ingest" | "tuning">("overview");
  const [theme, setTheme] = useState("light");
  const [userRole, setUserRole] = useState("Manufacturer");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [hoveredRec, setHoveredRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Tuning Constants State
  const [machineryBurn, setMachineryBurn] = useState(4.2); // gallons per day per active SKU
  const [carbonSaved, setCarbonSaved] = useState(11.4); // kg of CO2 saved per paused active SKU day
  const [safetyBuffer, setSafetyBuffer] = useState(25); // Target safety units
  
  // Interactive surge demand simulation
  const [surgeSim, setSurgeSim] = useState(0); // -50% to +50% surge

  // Modal detail state
  const [detailRec, setDetailRec] = useState<Recommendation | null>(null);

  // Active Research Sku
  const [selectedSku, setSelectedSku] = useState("SKU-999");
  
  // Glossary Active Slide
  const [glossaryActiveTab, setGlossaryActiveTab] = useState<"safety" | "rop" | "throttle" | "spatial">("safety");

  // CSV Ingestion States
  const [marketFile, setMarketFile] = useState<File | null>(null);
  const [inventoryFile, setInventoryFile] = useState<File | null>(null);
  const [marketStatus, setMarketStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [inventoryStatus, setInventoryStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [marketError, setMarketError] = useState("");
  const [inventoryError, setInventoryError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState("");
  
  const marketInputRef = useRef<HTMLInputElement>(null);
  const inventoryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ApiClient.initialize();
    if (!ApiClient.isAuthenticated()) {
      router.push("/");
      return;
    }
    
    setUserRole(ApiClient.getRole() || "Manufacturer");
    fetchRecommendations();

    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("df_theme");
      const currentTheme = savedTheme === "dark" ? "dark" : "light";
      setTheme(currentTheme);
      document.documentElement.setAttribute("data-theme", currentTheme);
    }
  }, [router]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.get<Recommendation[]>("/api/recommendations");
      setRecommendations(data);
      if (data.length > 0) {
        setSelectedRec(data[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (recId: number, action: "approved" | "rejected") => {
    try {
      await ApiClient.post(`/api/recommendations/${recId}/action`, { action });
      
      // Update local state smoothly
      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.id === recId ? { ...rec, action_status: action } : rec
        )
      );

      // Close modal if open
      if (detailRec?.id === recId) {
        setDetailRec(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit action.");
    }
  };

  const handleLogout = () => {
    ApiClient.clearAuth();
    router.push("/");
  };

  const handleClearData = async () => {
    if (confirm("Are you sure you want to clear all uploaded data and predictions? This will reset your environment.")) {
      try {
        await ApiClient.post("/api/upload/clear");
        fetchRecommendations();
        setActiveTab("ingest");
      } catch (err: any) {
        alert(err.message || "Failed to clear data.");
      }
    }
  };

  // Ingest upload handlers
  const handleMarketFileChange = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "json") {
      setMarketError("Only .csv and .json files are supported.");
      setMarketStatus("error");
      return;
    }
    setMarketFile(file);
    setMarketError("");
    setMarketStatus("uploading");
    
    try {
      await ApiClient.uploadFile("/api/upload/market-data", file);
      setMarketStatus("success");
    } catch (err: any) {
      setMarketStatus("error");
      setMarketError(err.message || "Failed to upload market data.");
    }
  };

  const handleInventoryFileChange = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "json") {
      setInventoryError("Only .csv and .json files are supported.");
      setInventoryStatus("error");
      return;
    }
    setInventoryFile(file);
    setInventoryError("");
    setInventoryStatus("uploading");
    
    try {
      await ApiClient.uploadFile("/api/upload/inventory-data", file);
      setInventoryStatus("success");
    } catch (err: any) {
      setInventoryStatus("error");
      setInventoryError(err.message || "Failed to upload inventory data.");
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    setProcessError("");
    try {
      await ApiClient.post("/api/upload/process");
      setMarketFile(null);
      setInventoryFile(null);
      setMarketStatus("idle");
      setInventoryStatus("idle");
      await fetchRecommendations();
      setActiveTab("overview");
    } catch (err: any) {
      setProcessError(err.message || "Prediction execution failed.");
    } finally {
      setProcessing(false);
    }
  };

  // Split recommendations for Kanban cols
  const getCol1 = () => recommendations.filter((r) => r.action_status === "pending");
  const getCol2 = () => recommendations.filter((r) => r.action_status === "pending_review");
  const getCol3 = () => recommendations.filter((r) => r.action_status === "approved" || r.action_status === "rejected");

  // Environmental counters
  const approvedHoldsCount = recommendations.filter(
    (r) => r.action_status === "approved" && r.explanation.toLowerCase().includes("hold")
  ).length;

  const totalFuelSaved = Math.round(approvedHoldsCount * machineryBurn * 30 * 10) / 10;
  const totalCarbonSaved = Math.round(approvedHoldsCount * carbonSaved * 30 * 10) / 10;
  const financialStorageSaved = approvedHoldsCount * 125; // mock $125 per SKU warehouse holding paused

  // Generate 30-day custom forecasting datasets for SKU-999, SKU-888, SKU-777 in Research Lab
  const getResearchChartData = (sku: string, surge: number) => {
    const days = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
    const surgeMultiplier = 1 + surge / 100;
    
    if (sku === "SKU-999") {
      // Hold Production simulation - high inventories drain down
      return days.map((day, idx) => {
        const demand = Math.round((22 + Math.sin(idx / 3) * 6) * surgeMultiplier);
        const physicalStock = Math.max(
          12,
          Math.round(210 - idx * 5.8 + (idx > 10 ? idx * 0.8 : 0))
        );
        const safetyTarget = safetyBuffer;
        const fuelConsumption = Math.max(0, Math.round(180 - idx * 4.8));
        return {
          name: day,
          "Distributor Stock": physicalStock,
          "Customer Orders": demand,
          "Holding Safety Buffer": safetyTarget,
          "Machinery Fuel Burn (Gal)": fuelConsumption
        };
      });
    } else if (sku === "SKU-888") {
      // Resume Production simulation - low inventories climb up to stability
      return days.map((day, idx) => {
        const demand = Math.round((14 + Math.cos(idx / 4) * 4) * surgeMultiplier);
        const physicalStock = Math.round(25 + idx * 4.2 - Math.sin(idx / 2) * 5);
        const safetyTarget = safetyBuffer;
        const fuelConsumption = Math.min(220, Math.round(45 + idx * 5.5));
        return {
          name: day,
          "Distributor Stock": physicalStock,
          "Customer Orders": demand,
          "Holding Safety Buffer": safetyTarget,
          "Machinery Fuel Burn (Gal)": fuelConsumption
        };
      });
    } else {
      // SKU-777: Defect / Low sales anomaly
      return days.map((day, idx) => {
        const demand = Math.max(1, Math.round((4 + Math.sin(idx / 2) * 2) * surgeMultiplier));
        const physicalStock = Math.max(2, Math.round(40 - idx * 0.9));
        const safetyTarget = safetyBuffer;
        const fuelConsumption = Math.round(15 + Math.sin(idx) * 3);
        return {
          name: day,
          "Distributor Stock": physicalStock,
          "Customer Orders": demand,
          "Holding Safety Buffer": safetyTarget,
          "Machinery Fuel Burn (Gal)": fuelConsumption
        };
      });
    }
  };

  const researchChartData = getResearchChartData(selectedSku, surgeSim);

  return (
    <main className="min-h-screen flex relative w-full overflow-hidden bg-md-background">
      <GlowOverlay />

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-md-surface-container/70 border-r border-md-outline/10 flex flex-col p-6 shrink-0 relative z-10 backdrop-blur-md">
        <div className="flex items-center gap-3 select-none mb-10">
          <div className="h-10 w-10 bg-md-primary text-white rounded-xl flex items-center justify-center shadow-lg transform rotate-2">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-md-on-background tracking-tight">DemandFlow AI</h1>
            <span className="text-[9px] uppercase font-bold tracking-wider text-md-primary">Control Console</span>
          </div>
        </div>

        {/* Tab Buttons */}
        <nav className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-3.5 w-full p-3 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === "overview"
                ? "bg-md-primary text-white shadow-md scale-[1.02]"
                : "text-md-on-surface-variant hover:bg-md-primary/5 hover:text-md-primary"
            }`}
          >
            <Compass className="h-4.5 w-4.5" />
            <span>Overview Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("predictions")}
            className={`flex items-center gap-3.5 w-full p-3 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === "predictions"
                ? "bg-md-primary text-white shadow-md scale-[1.02]"
                : "text-md-on-surface-variant hover:bg-md-primary/5 hover:text-md-primary"
            }`}
          >
            <Brain className="h-4.5 w-4.5" />
            <span>Predictions Inbox</span>
            {getCol1().length > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-[9px] font-black h-4 px-1.5 rounded-full flex items-center justify-center animate-pulse">
                {getCol1().length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("research")}
            className={`flex items-center gap-3.5 w-full p-3 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === "research"
                ? "bg-md-primary text-white shadow-md scale-[1.02]"
                : "text-md-on-surface-variant hover:bg-md-primary/5 hover:text-md-primary"
            }`}
          >
            <TrendingUp className="h-4.5 w-4.5" />
            <span>Research Lab</span>
          </button>

          <button
            onClick={() => setActiveTab("ingest")}
            className={`flex items-center gap-3.5 w-full p-3 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === "ingest"
                ? "bg-md-primary text-white shadow-md scale-[1.02]"
                : "text-md-on-surface-variant hover:bg-md-primary/5 hover:text-md-primary"
            }`}
          >
            <Upload className="h-4.5 w-4.5" />
            <span>Ingest Studio</span>
          </button>

          <button
            onClick={() => setActiveTab("tuning")}
            className={`flex items-center gap-3.5 w-full p-3 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === "tuning"
                ? "bg-md-primary text-white shadow-md scale-[1.02]"
                : "text-md-on-surface-variant hover:bg-md-primary/5 hover:text-md-primary"
            }`}
          >
            <Sliders className="h-4.5 w-4.5" />
            <span>Tuning Settings</span>
          </button>
        </nav>

        {/* Profile and Settings */}
        <div className="mt-auto border-t border-md-outline/10 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-md-surface-container-low p-2 rounded-xl border border-md-outline/5">
            <div className="h-8 w-8 bg-md-primary/10 border border-md-primary/20 rounded-full flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-md-primary" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] font-black text-md-on-background truncate">Operations Hub</div>
              <span className="text-[8px] uppercase font-bold tracking-wider text-md-primary capitalize">Role: {userRole}</span>
            </div>
          </div>

          <Button
            variant="outlined"
            onClick={handleClearData}
            className="w-full flex items-center justify-center gap-2 h-8 text-[10px] font-bold border-red-200/25 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" /> Reset Environment
          </Button>

          <Button 
            variant="outlined" 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 h-8 text-[10px] font-bold border-md-outline/25 hover:bg-red-50 hover:border-red-100 hover:text-red-600"
          >
            <LogOut className="h-3 w-3" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Consolidated Portal Section */}
      <section className="flex-1 flex flex-col overflow-y-auto p-8 relative z-10">
        
        {/* ============================================================== */}
        {/* 1. OVERVIEW TAB WORKSPACE                                      */}
        {/* ============================================================== */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header banner */}
            <div className="flex justify-between items-center bg-md-surface-container-low border border-md-outline/5 rounded-[24px] p-6 shadow-sm">
              <div>
                <h1 className="text-xl font-black text-md-on-background tracking-tight">Overview Telemetry Control</h1>
                <p className="text-xs text-md-on-surface-variant">Central coordination matrix between active distributor levels and factory holding parameters.</p>
              </div>
              <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full flex gap-1.5 items-center">
                <CheckCircle className="h-3.5 w-3.5 text-green-500 animate-pulse" /> Live Telemetry Safe
              </span>
            </div>

            {/* Green Resource Savings Counters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <Card className="flex flex-col gap-1 relative overflow-hidden group border-md-primary/10">
                <div className="h-9 w-9 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
                  <Leaf className="h-4.5 w-4.5 text-green-600" />
                </div>
                <span className="text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider">CO2 Saved (Est. 30d)</span>
                <span className="text-2xl font-black text-md-on-background mt-0.5">{totalCarbonSaved} kg</span>
                <p className="text-[9px] text-green-600 font-bold mt-1">Based on paused factory hours</p>
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
              </Card>

              <Card className="flex flex-col gap-1 relative overflow-hidden group">
                <div className="h-9 w-9 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
                  <Flame className="h-4.5 w-4.5 text-red-600" />
                </div>
                <span className="text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider">Fuel Burn Saved (30d)</span>
                <span className="text-2xl font-black text-md-on-background mt-0.5">{totalFuelSaved} Gal</span>
                <p className="text-[9px] text-red-500 font-bold mt-1">Pausing overproduction loops</p>
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
              </Card>

              <Card className="flex flex-col gap-1 relative overflow-hidden group">
                <div className="h-9 w-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
                  <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <span className="text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider">Storage Cost Savings</span>
                <span className="text-2xl font-black text-md-on-background mt-0.5">${financialStorageSaved.toLocaleString()}</span>
                <p className="text-[9px] text-blue-600 font-bold mt-1">Reduced distributor stock burdens</p>
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
              </Card>

              <Card className="flex flex-col gap-1 relative overflow-hidden group">
                <div className="h-9 w-9 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
                  <Activity className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <span className="text-[10px] font-bold text-md-on-surface-variant uppercase tracking-wider">OEE Load Efficiency</span>
                <span className="text-2xl font-black text-md-on-background mt-0.5">94.2%</span>
                <p className="text-[9px] text-amber-500 font-bold mt-1">Optimal manufacturing output</p>
                <div className="absolute right-0 bottom-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              </Card>
            </div>

            {/* Simulated Live Demand Surge & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Telemetry Progress Bars (Distributor vs Manufacturer Stock) */}
              <Card className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex justify-between items-center pb-2 border-b border-md-outline/5">
                  <h3 className="text-xs font-black uppercase text-md-on-surface-variant tracking-wider">Live Inventory Discrepancy Map</h3>
                  <span className="text-[10px] font-bold text-md-primary">3 Warehouses Active</span>
                </div>
                
                <div className="flex flex-col gap-5 py-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[11px] font-bold text-md-on-background">
                      <span>SKU-999 (Laptop Charger) - Distributor Stockout Danger</span>
                      <span className="text-red-500">90 / 100 Capacity (Surplus Hold)</span>
                    </div>
                    <div className="w-full h-3 bg-md-surface-container-low rounded-full overflow-hidden border border-md-outline/5">
                      <div className="bg-red-500 h-full rounded-full transition-all duration-300" style={{ width: "90%" }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-md-on-surface-variant">
                      <span>Manufacturer stock: 120 units (Plenty)</span>
                      <span>Action status: Pausing Manufacturing lines</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[11px] font-bold text-md-on-background">
                      <span>SKU-888 (Mechanical Keyboard) - Stock Deficit Trigger</span>
                      <span className="text-green-600">25 / 100 Capacity (Resuming Active)</span>
                    </div>
                    <div className="w-full h-3 bg-md-surface-container-low rounded-full overflow-hidden border border-md-outline/5">
                      <div className="bg-green-500 h-full rounded-full transition-all duration-300" style={{ width: "25%" }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-md-on-surface-variant">
                      <span>Manufacturer stock: 150 units</span>
                      <span>Action status: Manufacturing active at 100% load</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[11px] font-bold text-md-on-background">
                      <span>SKU-777 (Cargo Pants) - Structural Defect Warning</span>
                      <span className="text-amber-500">5 / 100 Capacity (Review Needed)</span>
                    </div>
                    <div className="w-full h-3 bg-md-surface-container-low rounded-full overflow-hidden border border-md-outline/5">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: "5%" }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-md-on-surface-variant">
                      <span>Manufacturer stock: 40 units</span>
                      <span>Action status: Flagged for high defect ratios</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Dynamic Surge Simulator */}
              <Card className="flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-md-on-surface-variant tracking-wider flex gap-1.5 items-center">
                    <Sliders className="h-4 w-4 text-md-primary" /> Demand Surge Simulator
                  </h3>
                  <p className="text-[11px] text-md-on-surface-variant mt-2 leading-relaxed">
                    Adjust current market customer order velocity simulator to stress-test distributor inventory holding capacities in real time.
                  </p>
                </div>

                <div className="my-6">
                  <div className="flex justify-between text-[11px] font-bold mb-2">
                    <span>Market Demand Modifier</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      surgeSim > 0 ? "bg-green-100 text-green-700" : surgeSim < 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {surgeSim > 0 ? `+${surgeSim}% Surge` : `${surgeSim}% Slowdown`}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="-50" 
                    max="50" 
                    value={surgeSim}
                    onChange={(e) => setSurgeSim(Number(e.target.value))}
                    className="w-full h-1.5 bg-md-surface-container-low rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-md-on-surface-variant mt-1.5">
                    <span>-50% Slowdown</span>
                    <span>No Surge (0%)</span>
                    <span>+50% Spike</span>
                  </div>
                </div>

                <div className="text-[10px] text-md-primary bg-md-primary/5 rounded-[12px] p-3 border border-md-primary/10 leading-relaxed font-semibold">
                  <strong>Simulated Impact:</strong> {
                    surgeSim > 20 
                      ? "Critical Alert: Demand surge spikes distributor depleted lines! Safety stock exhausted for mechanical keyboards (SKU-888)."
                      : surgeSim < -20
                      ? "Caution: Severe slowdown increases overstocked holdings. Charger lines (SKU-999) must extend hold duration to avoid excess fuel burn."
                      : "Standard operating buffers fully absorb simulated volatility safely."
                  }
                </div>
              </Card>

            </div>

            {/* Quick action triggers */}
            <Card className="flex flex-col md:flex-row justify-between items-center gap-4 bg-md-primary/10 border-md-primary/20">
              <div className="flex gap-4 items-center">
                <div className="h-11 w-11 bg-md-primary text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
                  <Brain className="h-5.5 w-5.5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-md-on-background uppercase tracking-wider">Unchecked AI Decisions Pending Action</h4>
                  <p className="text-[11px] text-md-on-surface-variant mt-0.5">There are {getCol1().length} pending production hold and flow directives waiting in your queue.</p>
                </div>
              </div>
              <Button onClick={() => setActiveTab("predictions")} className="flex gap-2 text-xs font-bold rounded-full">
                Open Predictions Board <ArrowRight className="h-4 w-4" />
              </Button>
            </Card>

          </div>
        )}

        {/* ============================================================== */}
        {/* 2. PREDICTIONS TAB WORKSPACE (Kanban)                          */}
        {/* ============================================================== */}
        {activeTab === "predictions" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-1">
              <div>
                <h1 className="text-xl font-black text-md-on-background tracking-tight">Interactive AI Dashboard</h1>
                <p className="text-xs text-md-on-surface-variant">Real-time evaluations mapped by the embedded ML rules engine.</p>
              </div>
              <Button onClick={() => setActiveTab("ingest")} variant="outlined" className="h-9 px-4 text-xs font-bold flex gap-1.5 items-center">
                <Upload className="h-4 w-4" /> Upload New Files
              </Button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-md-primary animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-[18px] text-red-700 text-xs font-bold">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[60vh] items-start">
                
                {/* Column 1: New Predictions */}
                <div className="bg-md-surface-container-low/40 rounded-[24px] p-4 border border-md-outline/5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-black uppercase text-md-on-surface-variant tracking-wider">
                      New Predictions ({getCol1().length})
                    </span>
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  </div>
                  
                  <div className="flex flex-col gap-3.5">
                    {getCol1().length === 0 ? (
                      <div className="p-6 text-center text-xs text-md-on-surface-variant/60 border border-dashed border-md-outline/10 rounded-[18px]">
                        No new predictions.
                      </div>
                    ) : (
                      getCol1().map((rec) => (
                        <KanbanCard 
                          key={rec.id} 
                          rec={rec}
                          isSelected={selectedRec?.id === rec.id}
                          isHovered={hoveredRec?.id === rec.id}
                          onClick={() => setSelectedRec(rec)}
                          onMouseEnter={() => setHoveredRec(rec)}
                          onMouseLeave={() => setHoveredRec(null)}
                          actions={
                            <Button 
                              onClick={(e) => { e.stopPropagation(); handleAction(rec.id, "approved"); }}
                              className="w-full h-8 text-[10px] font-bold rounded-full bg-md-primary text-white hover:opacity-90"
                            >
                              Approve
                            </Button>
                          }
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Column 2: Pending Approval */}
                <div className="bg-md-surface-container-low/40 rounded-[24px] p-4 border border-md-outline/5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-black uppercase text-md-on-surface-variant tracking-wider">
                      Under Review ({getCol2().length})
                    </span>
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                  </div>
                  
                  <div className="flex flex-col gap-3.5">
                    {getCol2().length === 0 ? (
                      <div className="p-6 text-center text-xs text-md-on-surface-variant/60 border border-dashed border-md-outline/10 rounded-[18px]">
                        No items in structural review.
                      </div>
                    ) : (
                      getCol2().map((rec) => (
                        <KanbanCard 
                          key={rec.id} 
                          rec={rec}
                          isSelected={selectedRec?.id === rec.id}
                          isHovered={hoveredRec?.id === rec.id}
                          onClick={() => setSelectedRec(rec)}
                          onMouseEnter={() => setHoveredRec(rec)}
                          onMouseLeave={() => setHoveredRec(null)}
                          actions={
                            <Button 
                              variant="outlined"
                              onClick={(e) => { e.stopPropagation(); setDetailRec(rec); }}
                              className="w-full h-8 text-[10px] font-bold rounded-full border-md-outline/30 flex gap-1 items-center justify-center"
                            >
                              <Eye className="h-3 w-3" /> View Details
                            </Button>
                          }
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Column 3: Executed Actions */}
                <div className="bg-md-surface-container-low/40 rounded-[24px] p-4 border border-md-outline/5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-black uppercase text-md-on-surface-variant tracking-wider">
                      Executed Actions ({getCol3().length})
                    </span>
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  </div>
                  
                  <div className="flex flex-col gap-3.5">
                    {getCol3().length === 0 ? (
                      <div className="p-6 text-center text-xs text-md-on-surface-variant/60 border border-dashed border-md-outline/10 rounded-[18px]">
                        No historical audits found.
                      </div>
                    ) : (
                      getCol3().map((rec) => (
                        <KanbanCard 
                          key={rec.id} 
                          rec={rec}
                          isSelected={selectedRec?.id === rec.id}
                          isHovered={hoveredRec?.id === rec.id}
                          onClick={() => setSelectedRec(rec)}
                          onMouseEnter={() => setHoveredRec(rec)}
                          onMouseLeave={() => setHoveredRec(null)}
                          actions={
                            <div className="flex items-center gap-1.5 mt-1.5">
                              {rec.action_status === "approved" ? (
                                <span className="text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex gap-1 items-center">
                                  <CheckCircle className="h-3 w-3" /> Approved
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex gap-1 items-center">
                                  <XCircle className="h-3 w-3" /> Rejected
                                </span>
                              )}
                            </div>
                          }
                        />
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. RESEARCH LAB TAB WORKSPACE (Long Graph & Conceptual Guide)   */}
        {/* ============================================================== */}
        {activeTab === "research" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header info */}
            <div className="flex justify-between items-center bg-md-surface-container-low border border-md-outline/5 rounded-[24px] p-6 shadow-sm">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-xl font-black text-md-on-background tracking-tight">Supply Chain Research Center</h1>
                <p className="text-xs text-md-on-surface-variant">Time-series forecasting, energy burn correlation vectors, and safety stocking intervals.</p>
              </div>

              {/* SKU Selection Tab Dropdown */}
              <div className="flex gap-2">
                {["SKU-999", "SKU-888", "SKU-777"].map((sku) => (
                  <button
                    key={sku}
                    onClick={() => setSelectedSku(sku)}
                    className={`px-4 py-2 rounded-full text-xs font-black border transition-all duration-200 ${
                      selectedSku === sku
                        ? "bg-md-primary border-md-primary text-white shadow-sm"
                        : "bg-white border-md-outline/10 text-md-on-surface-variant hover:bg-md-primary/5"
                    }`}
                  >
                    {sku === "SKU-999" ? "SKU-999 (Hold Model)" : sku === "SKU-888" ? "SKU-888 (Resume Model)" : "SKU-777 (Quality Model)"}
                  </button>
                ))}
              </div>
            </div>

            {/* THE LONG GRAPH - Full-Width Interactive Chart */}
            <Card className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black text-md-on-background uppercase tracking-tight">30-Day Long-Range Simulation Timeline</h3>
                  <p className="text-xs text-md-on-surface-variant mt-0.5">
                    Continuous evaluation of Distributor Unsold Stock versus Safety Buffers and machinery energy footprint metrics.
                  </p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold text-md-on-surface-variant">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span> Distributor Stock</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span> Customer Demand</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400"></span> Fuel Burn (Gal)</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-dashed border border-amber-600"></span> Safety stock Buffer</span>
                </div>
              </div>

              {/* Responsive Container for Recharts */}
              <div className="h-[360px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={researchChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E0EC" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: "#49454F", fontSize: 10 }}
                      stroke="#79747E"
                    />
                    <YAxis 
                      yAxisId="stock"
                      tick={{ fill: "#49454F", fontSize: 10 }} 
                      stroke="#79747E" 
                      label={{ value: 'Units Count', angle: -90, position: 'insideLeft', style: {fontSize: '9px', fill: '#49454F'} }}
                    />
                    <YAxis 
                      yAxisId="fuel"
                      orientation="right"
                      tick={{ fill: "#b91c1c", fontSize: 10 }} 
                      stroke="#ef4444" 
                      label={{ value: 'Fuel Burn (Gallons)', angle: 90, position: 'insideRight', style: {fontSize: '9px', fill: '#b91c1c'} }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#F3EDF7", 
                        borderRadius: "16px", 
                        border: "1px solid rgba(121, 116, 126, 0.2)",
                        color: "#1C1B1F",
                        fontSize: "11px"
                      }}
                    />
                    
                    {/* Area for Distributor Stock levels */}
                    <Area 
                      yAxisId="stock"
                      name="Distributor Stock"
                      type="monotone"
                      dataKey="Distributor Stock"
                      fill="#e0f2fe"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      fillOpacity={0.6}
                    />

                    {/* Customer demand curve */}
                    <Line 
                      yAxisId="stock"
                      name="Customer Orders"
                      type="monotone"
                      dataKey="Customer Orders"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />

                    {/* Fuel Consumption curve */}
                    <Line 
                      yAxisId="fuel"
                      name="Machinery Fuel Burn (Gal)"
                      type="monotone"
                      dataKey="Machinery Fuel Burn (Gal)"
                      stroke="#f87171"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />

                    {/* Target Safety Stock line */}
                    <Line 
                      yAxisId="stock"
                      name="Holding Safety Buffer"
                      type="monotone"
                      dataKey="Holding Safety Buffer"
                      stroke="#d97706"
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* CONCEPT EXPLORER & GLOSSARY */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Glossary navigation list */}
              <Card className="lg:col-span-1 flex flex-col gap-2 p-4">
                <span className="text-[10px] font-black text-md-on-surface-variant uppercase tracking-wider px-2 py-1">Conceptual Explorer</span>
                
                <button
                  onClick={() => setGlossaryActiveTab("safety")}
                  className={`p-3 text-left rounded-xl text-xs font-bold transition-all ${
                    glossaryActiveTab === "safety" 
                      ? "bg-md-primary/10 text-md-primary border-l-4 border-md-primary font-black" 
                      : "text-md-on-surface-variant hover:bg-md-surface-container-low"
                  }`}
                >
                  1. Safety Stock Buffer
                </button>

                <button
                  onClick={() => setGlossaryActiveTab("rop")}
                  className={`p-3 text-left rounded-xl text-xs font-bold transition-all ${
                    glossaryActiveTab === "rop" 
                      ? "bg-md-primary/10 text-md-primary border-l-4 border-md-primary font-black" 
                      : "text-md-on-surface-variant hover:bg-md-surface-container-low"
                  }`}
                >
                  2. Reorder Point (ROP)
                </button>

                <button
                  onClick={() => setGlossaryActiveTab("throttle")}
                  className={`p-3 text-left rounded-xl text-xs font-bold transition-all ${
                    glossaryActiveTab === "throttle" 
                      ? "bg-md-primary/10 text-md-primary border-l-4 border-md-primary font-black" 
                      : "text-md-on-surface-variant hover:bg-md-surface-container-low"
                  }`}
                >
                  3. Gas Burn Throttling
                </button>

                <button
                  onClick={() => setGlossaryActiveTab("spatial")}
                  className={`p-3 text-left rounded-xl text-xs font-bold transition-all ${
                    glossaryActiveTab === "spatial" 
                      ? "bg-md-primary/10 text-md-primary border-l-4 border-md-primary font-black" 
                      : "text-md-on-surface-variant hover:bg-md-surface-container-low"
                  }`}
                >
                  4. Spatial Transfers
                </button>
              </Card>

              {/* Glossary detailed explanation viewport */}
              <Card className="lg:col-span-3 flex flex-col justify-between p-6">
                {glossaryActiveTab === "safety" && (
                  <div className="flex flex-col gap-3 animate-fade-in">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full self-start">Safety stock buffer</span>
                    <h3 className="text-base font-black text-md-on-background">What is Safety Stock & Safety Stock Buffers?</h3>
                    <p className="text-xs text-md-on-surface-variant leading-relaxed">
                      Safety Stock is a level of extra stock that is kept to mitigate risk of stockouts (running out of raw components or completed products) due to uncertainties in supply and demand. 
                    </p>
                    <p className="text-xs text-md-on-surface-variant leading-relaxed">
                      In the chart above, you see a safety buffer threshold line. DemandFlow monitors distributor levels: if unsold distributor inventories drop below the safety buffer (e.g. 25-30 units), a <strong>RESUME PRODUCTION</strong> alert triggers instantly, instructing the factory to restart machinery to sustain stock.
                    </p>
                  </div>
                )}

                {glossaryActiveTab === "rop" && (
                  <div className="flex flex-col gap-3 animate-fade-in">
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full self-start">Reorder point (ROP)</span>
                    <h3 className="text-base font-black text-md-on-background">Understanding the Reorder Point (ROP) Metric</h3>
                    <p className="text-xs text-md-on-surface-variant leading-relaxed">
                      The Reorder Point (ROP) is the specific level of inventory which triggers action to replenish that product SKU. It is calculated by multiplying lead-time demand by target buffers.
                    </p>
                    <p className="text-xs text-md-on-surface-variant leading-relaxed">
                      Formula: ROP = (Average Daily Sales x Supplier Lead Time in Days) + Safety Stock Buffer. When physical levels cross below ROP, the model issues warnings to prevent delivery failures.
                    </p>
                  </div>
                )}

                {glossaryActiveTab === "throttle" && (
                  <div className="flex flex-col gap-3 animate-fade-in">
                    <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full self-start">Gas burn throttling</span>
                    <h3 className="text-base font-black text-md-on-background">Science of Gas Burn Throttling & Environmental Impact</h3>
                    <p className="text-xs text-md-on-surface-variant leading-relaxed">
                      Heavy factory machinery (compressors, gas vulcanizers) consumes extensive fuel (represented as Red Dashed line in chart) when active. Holding stock causes excessive warehouses storage fees and gas waste.
                    </p>
                    <p className="text-xs text-md-on-surface-variant leading-relaxed">
                      When distributor stock is high (&ge;80% unsold), DemandFlow AI automatically flags a **HOLD PRODUCTION** recommendation. Approving it pauses factory assembly, instantly dropping fuel consumption and carbon footprint burden as shown on Day 1-10 on the SKU-999 chart!
                    </p>
                  </div>
                )}

                {glossaryActiveTab === "spatial" && (
                  <div className="flex flex-col gap-3 animate-fade-in">
                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full self-start">Spatial rebalancing</span>
                    <h3 className="text-base font-black text-md-on-background">Spatial Discrepancy Transfers vs. Machinery Restarts</h3>
                    <p className="text-xs text-md-on-surface-variant leading-relaxed">
                      Occasionally, inventory is imbalanced: a distributor warehouse in Region A is empty, while a warehouse in Region B has a massive surplus of the same SKU.
                    </p>
                    <p className="text-xs text-md-on-surface-variant leading-relaxed">
                      Restarting factory machinery is incredibly fuel-heavy and slow. Rather than manufacturing new units, DemandFlow identifies this spatial anomaly and suggests a **REGIONAL TRANSFER** (Column 2 recommendation). Moving existing units avoids spinning up production lines, conserving massive carbon offsets.
                    </p>
                  </div>
                )}

                <div className="border-t border-md-outline/5 pt-3 mt-4 text-[10px] text-md-on-surface-variant/80 italic">
                  Tip: Use the parameters slider in Tuning Settings to change calculations and stress-test target ROP triggers.
                </div>
              </Card>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* 4. INGEST STUDIO TAB WORKSPACE                                 */}
        {/* ============================================================== */}
        {activeTab === "ingest" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header Title */}
            <div className="flex justify-between items-center bg-md-surface-container-low border border-md-outline/5 rounded-[24px] p-6 shadow-sm">
              <div>
                <h1 className="text-xl font-black text-md-on-background tracking-tight">CSV Ingestion Studio</h1>
                <p className="text-xs text-md-on-surface-variant">Import production worksheets and warehouse stock logs to re-calculate supply predictions.</p>
              </div>
            </div>

            {/* Drag Zone Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Sales Demand Ingestion Zone */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-black text-md-on-background">1. Sales & Demand Data Worksheet</label>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleMarketFileChange(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => marketInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[24px] p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] ${
                    marketStatus === "success" 
                      ? "border-green-400 bg-green-50/5" 
                      : marketStatus === "error" 
                        ? "border-red-400 bg-red-50/5" 
                        : "border-md-outline/20 hover:border-md-primary bg-md-surface-container-low/40 hover:bg-md-surface-container-low"
                  }`}
                >
                  <input 
                    type="file" 
                    ref={marketInputRef}
                    className="hidden" 
                    accept=".csv,.json"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleMarketFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  
                  {marketStatus === "idle" && (
                    <>
                      <TrendingUp className="h-9 w-9 text-md-primary mb-3" />
                      <p className="text-xs font-black text-md-on-background">Drag & Drop or Click to Browse</p>
                      <p className="text-[10px] text-md-on-surface-variant mt-1.5 max-w-[200px] leading-normal">
                        Sales logs containing Product SKU, Current Factory Production, and Retail Sales.
                      </p>
                    </>
                  )}

                  {marketStatus === "uploading" && (
                    <>
                      <Loader2 className="h-8 w-8 text-md-primary animate-spin mb-3" />
                      <p className="text-xs font-bold text-md-on-background">Reading sales & demand metrics...</p>
                    </>
                  )}

                  {marketStatus === "success" && (
                    <div className="flex flex-col items-center">
                      <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                      <p className="text-xs font-black text-green-600 line-clamp-1">{marketFile?.name}</p>
                      <p className="text-[10px] text-md-on-surface-variant mt-1 font-semibold">Sales data validated successfully</p>
                    </div>
                  )}

                  {marketStatus === "error" && (
                    <div className="flex flex-col items-center px-4">
                      <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
                      <p className="text-xs font-bold text-red-600">Failed to Ingest</p>
                      <p className="text-[10px] text-md-on-surface-variant mt-1 leading-normal text-center">{marketError}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Warehouse Inventory Counts Ingestion Zone */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-black text-md-on-background">2. Warehouse Stock Levels Log</label>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleInventoryFileChange(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => inventoryInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[24px] p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] ${
                    inventoryStatus === "success" 
                      ? "border-green-400 bg-green-50/5" 
                      : inventoryStatus === "error" 
                        ? "border-red-400 bg-red-50/5" 
                        : "border-md-outline/20 hover:border-md-primary bg-md-surface-container-low/40 hover:bg-md-surface-container-low"
                  }`}
                >
                  <input 
                    type="file" 
                    ref={inventoryInputRef}
                    className="hidden" 
                    accept=".csv,.json"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleInventoryFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  
                  {inventoryStatus === "idle" && (
                    <>
                      <Boxes className="h-9 w-9 text-md-primary mb-3" />
                      <p className="text-xs font-black text-md-on-background">Drag & Drop or Click to Browse</p>
                      <p className="text-[10px] text-md-on-surface-variant mt-1.5 max-w-[200px] leading-normal">
                        Logs containing Product SKU, Warehouse Location, and Current Stock Counts.
                      </p>
                    </>
                  )}

                  {inventoryStatus === "uploading" && (
                    <>
                      <Loader2 className="h-8 w-8 text-md-primary animate-spin mb-3" />
                      <p className="text-xs font-bold text-md-on-background">Reading physical inventory counts...</p>
                    </>
                  )}

                  {inventoryStatus === "success" && (
                    <div className="flex flex-col items-center">
                      <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                      <p className="text-xs font-black text-green-600 line-clamp-1">{inventoryFile?.name}</p>
                      <p className="text-[10px] text-md-on-surface-variant mt-1 font-semibold">Inventory logs validated</p>
                    </div>
                  )}

                  {inventoryStatus === "error" && (
                    <div className="flex flex-col items-center px-4">
                      <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
                      <p className="text-xs font-bold text-red-600">Failed to Ingest</p>
                      <p className="text-[10px] text-md-on-surface-variant mt-1 leading-normal text-center">{inventoryError}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Live Demo Datasets download */}
            <div className="border border-md-outline/10 bg-md-surface-container-low rounded-[24px] p-6 flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-md-primary flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-md-primary" /> Live Demo Resource
                </span>
                <h3 className="text-xs font-extrabold text-md-on-background">Test with Full-Fledged 1,000 Product Datasheets</h3>
                <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                  Generate premium, high-fidelity sample supply chain datasheets representing 1,000 distinct product SKUs.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 shrink-0">
                <a 
                  href="/demo_datasheets/sales_demand_1000.csv" 
                  download="sales_demand_1000.csv" 
                  className="inline-flex items-center gap-2 bg-white text-md-primary font-bold text-[11px] px-4 py-2.5 rounded-full border border-md-outline/10 shadow-sm hover:shadow hover:bg-md-primary/5 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-md-primary" /> Sales Data (1,000 SKUs)
                </a>
                <a 
                  href="/demo_datasheets/stock_inventory_1000.csv" 
                  download="stock_inventory_1000.csv" 
                  className="inline-flex items-center gap-2 bg-white text-md-primary font-bold text-[11px] px-4 py-2.5 rounded-full border border-md-outline/10 shadow-sm hover:shadow hover:bg-md-primary/5 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-md-primary" /> Stock Levels (2,000 Rows)
                </a>
              </div>
            </div>

            {/* Run Button */}
            <div className="flex flex-col items-center gap-3 border-t border-md-outline/10 pt-6 mt-2">
              {processError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold flex gap-2 items-center">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{processError}</span>
                </div>
              )}

              <Button 
                onClick={handleProcess} 
                disabled={marketStatus !== "success" || inventoryStatus !== "success" || processing}
                className="h-11 px-10 text-xs font-bold tracking-wider uppercase rounded-full shadow-lg w-full md:w-auto"
              >
                {processing ? (
                  <span className="flex gap-2 items-center">
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing AI Rules Engine...
                  </span>
                ) : (
                  <span className="flex gap-2 items-center">
                    Step 3: Align Stock & Predict Recommendations <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
              <span className="text-[10px] text-md-on-surface-variant font-medium text-center">
                Once clicked, the model matches both tables, flags spatial anomalies, and builds hold/resume recommendations cards.
              </span>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* 5. TUNING SETTINGS TAB WORKSPACE                              */}
        {/* ============================================================== */}
        {activeTab === "tuning" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header title */}
            <div className="flex justify-between items-center bg-md-surface-container-low border border-md-outline/5 rounded-[24px] p-6 shadow-sm">
              <div>
                <h1 className="text-xl font-black text-md-on-background tracking-tight">Environmental Constants Configuration</h1>
                <p className="text-xs text-md-on-surface-variant">Configure physical machinery burn outputs and carbon emission equations to tune telemetry metrics.</p>
              </div>
            </div>

            {/* Constant Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Slider 1: Machinery Fuel Burn */}
              <Card className="flex flex-col justify-between p-6 h-56">
                <div>
                  <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Machinery fuel burn rate</span>
                  <h3 className="text-xs font-black text-md-on-background mt-2">Active Machinery Fuel Consumption</h3>
                  <p className="text-[11px] text-md-on-surface-variant mt-1.5 leading-relaxed">
                    Gallons of gas/fuel consumed per day by active factory manufacturing assembly lines per SKU.
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-bold mb-2">
                    <span>Rate (Gal/Day/SKU)</span>
                    <span className="text-md-primary font-black">{machineryBurn} Gallons</span>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="10.0" 
                    step="0.1"
                    value={machineryBurn}
                    onChange={(e) => setMachineryBurn(Number(e.target.value))}
                    className="w-full h-1.5 bg-md-surface-container-low rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-md-on-surface-variant mt-1">
                    <span>1.0 Gal</span>
                    <span>10.0 Gal</span>
                  </div>
                </div>
              </Card>

              {/* Slider 2: Carbon saved coefficient */}
              <Card className="flex flex-col justify-between p-6 h-56">
                <div>
                  <span className="text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">CO2 avoidance factor</span>
                  <h3 className="text-xs font-black text-md-on-background mt-2">Factory Carbon Output Coefficient</h3>
                  <p className="text-[11px] text-md-on-surface-variant mt-1.5 leading-relaxed">
                    Kilograms of carbon dioxide output prevented per day when an overproduced SKU line is held.
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-bold mb-2">
                    <span>Carbon Saved (kg/Day)</span>
                    <span className="text-md-primary font-black">{carbonSaved} kg CO2</span>
                  </div>
                  <input 
                    type="range" 
                    min="2.0" 
                    max="25.0" 
                    step="0.1"
                    value={carbonSaved}
                    onChange={(e) => setCarbonSaved(Number(e.target.value))}
                    className="w-full h-1.5 bg-md-surface-container-low rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-md-on-surface-variant mt-1">
                    <span>2.0 kg</span>
                    <span>25.0 kg</span>
                  </div>
                </div>
              </Card>

              {/* Slider 3: Safety stock buffer target */}
              <Card className="flex flex-col justify-between p-6 h-56">
                <div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Safety buffer limit</span>
                  <h3 className="text-xs font-black text-md-on-background mt-2">Global Target Safety Buffer</h3>
                  <p className="text-[11px] text-md-on-surface-variant mt-1.5 leading-relaxed">
                    Target baseline units buffer held in distributor warehouses to absorb market volatility.
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-bold mb-2">
                    <span>Target Buffer Size</span>
                    <span className="text-md-primary font-black">{safetyBuffer} Units</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="1"
                    value={safetyBuffer}
                    onChange={(e) => setSafetyBuffer(Number(e.target.value))}
                    className="w-full h-1.5 bg-md-surface-container-low rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-md-on-surface-variant mt-1">
                    <span>5 Units</span>
                    <span>50 Units</span>
                  </div>
                </div>
              </Card>

            </div>

            {/* Explanation box */}
            <Card className="p-5 bg-md-primary/5 border border-md-primary/10 rounded-[20px] text-xs text-md-on-background leading-relaxed">
              <strong>Interactive Telemetry Note:</strong> Modifying these constant parameters dynamically updates all green counters on your **Overview Dashboard** and safety threshold baselines on your **Research Lab charts** in real time! Try adjusting active machinery burn rates and navigate back to view updated CO2 / Fuel Burn metrics.
            </Card>

          </div>
        )}

      </section>

      {/* Kanban Board Side Detail Dialog Panel */}
      {selectedRec && activeTab === "predictions" && (
        <aside className="w-80 border-l border-md-outline/10 bg-md-surface-container/30 flex flex-col p-6 overflow-y-auto shrink-0 z-10 relative">
          
          <div className="mb-6 pb-4 border-b border-md-outline/10">
            <h2 className="text-xs font-black uppercase tracking-wider text-md-on-surface-variant mb-1 flex gap-1.5 items-center">
              <TrendingUp className="h-4.5 w-4.5 text-md-primary" />
              Impact projection
            </h2>
            <p className="text-[10px] text-md-on-surface-variant">Selected recommendation impact projection model.</p>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Header card snippet */}
            <div className="p-4 bg-md-surface-container-low border border-md-outline/10 rounded-[18px] flex flex-col gap-2 shadow-sm">
              <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full self-start bg-md-primary/10 text-md-primary">
                SKU: {selectedRec.entity_id}
              </span>
              <p className="text-[11px] font-bold text-md-on-background leading-relaxed">
                {selectedRec.explanation}
              </p>
            </div>

            {/* Micro Simulation chart */}
            <div className="h-56 w-full bg-md-surface-container-low border border-md-outline/10 rounded-[18px] p-3 flex flex-col justify-between shadow-sm">
              <h3 className="text-[10px] font-bold text-center text-md-on-surface-variant">Projected Stock Level (7 Days)</h3>
              
              <div className="h-40 w-full text-[9px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={
                      selectedRec.type.includes("hold") || selectedRec.explanation.toLowerCase().includes("hold")
                        ? [
                            { name: "Day 1", Approved: 90, Rejected: 90 },
                            { name: "Day 2", Approved: 84, Rejected: 95 },
                            { name: "Day 3", Approved: 78, Rejected: 102 },
                            { name: "Day 4", Approved: 72, Rejected: 110 },
                            { name: "Day 5", Approved: 66, Rejected: 118 },
                            { name: "Day 6", Approved: 60, Rejected: 126 },
                            { name: "Day 7", Approved: 54, Rejected: 134 }
                          ]
                        : [
                            { name: "Day 1", Approved: 25, Rejected: 25 },
                            { name: "Day 2", Approved: 32, Rejected: 20 },
                            { name: "Day 3", Approved: 40, Rejected: 15 },
                            { name: "Day 4", Approved: 48, Rejected: 10 },
                            { name: "Day 5", Approved: 56, Rejected: 6 },
                            { name: "Day 6", Approved: 64, Rejected: 2 },
                            { name: "Day 7", Approved: 72, Rejected: 0 }
                          ]
                    } 
                    margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#666" tickLine={false} />
                    <YAxis stroke="#666" tickLine={false} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={24} iconSize={8} />
                    <Area 
                      type="monotone" 
                      dataKey="Approved" 
                      stroke="#10b981" 
                      fill="#d1fae5"
                      fillOpacity={0.4}
                      strokeWidth={2} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Rejected" 
                      stroke="#ef4444" 
                      fill="#fee2e2"
                      fillOpacity={0.4}
                      strokeWidth={2} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Explanatory text */}
            <div className="text-[10px] text-md-on-surface-variant leading-relaxed p-3 bg-md-primary/5 rounded-[12px] border border-md-primary/10">
              <strong>ML Projection:</strong> Approved actions (Green) maintain stable distributor levels (30%-80% target buffers). Rejections (Red) risk stockouts or extreme overstocks.
            </div>

          </div>
        </aside>
      )}

      {/* Structural Review Details Modal */}
      {detailRec && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-md-surface-container-low max-w-lg w-full rounded-[24px] border border-md-outline/10 p-6 shadow-2xl flex flex-col gap-5">
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Under Structural Review
                </span>
                <h3 className="text-sm font-black text-md-on-background mt-2">
                  Recommendation ID #{detailRec.id} (SKU: {detailRec.entity_id})
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setDetailRec(null)} 
                className="text-md-on-surface-variant/70 hover:text-md-on-background font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-md-surface-container/40 rounded-[18px] border border-md-outline/5 text-xs text-md-on-background leading-relaxed">
              {detailRec.explanation}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <Button 
                onClick={() => handleAction(detailRec.id, "approved")}
                className="h-10 text-xs font-bold rounded-full bg-green-600 hover:bg-green-700 text-white"
              >
                Approve Action
              </Button>
              <Button 
                onClick={() => handleAction(detailRec.id, "rejected")}
                variant="outlined"
                className="h-10 text-xs font-bold rounded-full border-red-200 text-red-600 hover:bg-red-50"
              >
                Reject Action
              </Button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}

// Sub-component for Kanban Card
interface KanbanCardProps {
  rec: Recommendation;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  actions: React.ReactNode;
}

function KanbanCard({ 
  rec, 
  isSelected, 
  isHovered, 
  onClick, 
  onMouseEnter, 
  onMouseLeave, 
  actions 
}: KanbanCardProps) {
  const getBadgeStyles = (type: string, explanation: string) => {
    const expLower = explanation.toLowerCase();
    if (expLower.includes("hold")) {
      return {
        title: "Hold Production",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Flame className="h-3 w-3 text-amber-600" />
      };
    } else if (expLower.includes("resume") || expLower.includes("deficit")) {
      return {
        title: "Resume Production",
        bg: "bg-green-50 text-green-700 border-green-200",
        icon: <CheckCircle className="h-3 w-3 text-green-600" />
      };
    } else if (expLower.includes("transfer") || expLower.includes("rebalance")) {
      return {
        title: "Regional Transfer",
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <ArrowRight className="h-3 w-3 text-blue-600" />
      };
    } else {
      return {
        title: "Quality Review",
        bg: "bg-red-50 text-red-700 border-red-200",
        icon: <ShieldAlert className="h-3 w-3 text-red-600" />
      };
    }
  };

  const badge = getBadgeStyles(rec.type, rec.explanation);

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-4 rounded-[20px] bg-md-surface-container border transition-all duration-200 cursor-pointer flex flex-col gap-3 ${
        isSelected 
          ? "border-md-primary ring-1 ring-md-primary shadow-md scale-[1.01]" 
          : isHovered 
            ? "border-md-primary/45 shadow-sm scale-[1.005]" 
            : "border-md-outline/10 hover:border-md-outline/25"
      }`}
    >
      <div className="flex justify-between items-center">
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badge.bg} flex gap-1 items-center`}>
          {badge.icon}
          {badge.title}
        </span>
        <span className="text-[10px] font-extrabold text-md-on-surface-variant flex items-center gap-0.5">
          <Sparkles className="h-3 w-3 text-md-primary" /> {Math.round(rec.score * 100)}%
        </span>
      </div>

      <div className="text-[11px] text-md-on-surface-variant leading-relaxed line-clamp-3 font-semibold">
        {rec.explanation}
      </div>

      <div className="flex justify-between items-center mt-1 border-t border-md-outline/5 pt-2">
        <span className="text-[9px] font-black text-md-primary">SKU: {rec.entity_id}</span>
        {actions}
      </div>
    </div>
  );
}
