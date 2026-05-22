"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ApiClient } from "../../lib/api-client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import GlowOverlay from "../../components/ui/GlowOverlay";
import { 
  Upload, 
  FileSpreadsheet, 
  FileJson, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  LogOut,
  Brain,
  Trash2,
  Download,
  ArrowRight,
  TrendingUp,
  Activity,
  Package
} from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  
  // Theme state
  const [theme, setTheme] = useState("light");

  // File states
  const [marketFile, setMarketFile] = useState<File | null>(null);
  const [inventoryFile, setInventoryFile] = useState<File | null>(null);

  // Ingestion status
  const [marketStatus, setMarketStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [inventoryStatus, setInventoryStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  
  const [marketError, setMarketError] = useState("");
  const [inventoryError, setInventoryError] = useState("");
  
  // Process prediction state
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState("");

  // Refs for file inputs
  const marketInputRef = useRef<HTMLInputElement>(null);
  const inventoryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ApiClient.initialize();
    if (!ApiClient.isAuthenticated()) {
      router.push("/");
      return;
    }

    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("df_theme");
      const currentTheme = savedTheme === "dark" ? "dark" : "light";
      setTheme(currentTheme);
      document.documentElement.setAttribute("data-theme", currentTheme);
    }
  }, [router]);

  const handleLogout = () => {
    ApiClient.clearAuth();
    router.push("/");
  };

  // Upload handlers
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
      router.push("/dashboard");
    } catch (err: any) {
      setProcessError(err.message || "Prediction execution failed.");
      setProcessing(false);
    }
  };

  const clearMarket = async () => {
    setMarketFile(null);
    setMarketStatus("idle");
    setMarketError("");
  };

  const clearInventory = async () => {
    setInventoryFile(null);
    setInventoryStatus("idle");
    setInventoryError("");
  };

  // Drag and drop events
  const preventDefault = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <main className="min-h-screen w-full relative flex items-center justify-center p-6 overflow-y-auto bg-md-background">
      <GlowOverlay />

      <Card className="w-full max-w-5xl flex flex-col gap-8 p-8 relative shadow-2xl my-8 bg-md-surface/90 backdrop-blur-md">
        
        {/* Top Header Action Bar */}
        <div className="flex justify-between items-center border-b border-md-outline/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-md-primary text-white rounded-[16px] flex items-center justify-center shadow-lg animate-pulse">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-md-on-background tracking-tight">DemandFlow Prediction Studio</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider text-md-primary">Smart Inventory & Production Alignment</span>
            </div>
          </div>
          <Button variant="outlined" onClick={handleLogout} className="h-9 px-3 text-xs font-bold border-md-outline/30 flex gap-2 items-center hover:bg-red-50 hover:border-red-200 hover:text-red-600">
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </Button>
        </div>

        {/* Visual Guide: How DemandFlow AI Works */}
        <div className="bg-md-primary/5 border border-md-primary/10 rounded-[20px] p-6">
          <h2 className="text-sm font-extrabold text-md-primary mb-3 flex gap-2 items-center">
            <Brain className="h-4.5 w-4.5" />
            How DemandFlow AI Predicts and Aligns Your Supply Chain
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="bg-md-surface-container-low p-4 rounded-xl border border-md-outline/5 flex flex-col gap-1.5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-red-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500"></span> Pausing Overproduction
              </span>
              <h3 className="text-xs font-black text-md-on-background">Hold Production Recommendation</h3>
              <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                If a distributor has high stock levels (<strong>&ge;80% unsold</strong>), we halt production to prevent extra storage fees and save fuel.
              </p>
            </div>

            <div className="bg-md-surface-container-low p-4 rounded-xl border border-md-outline/5 flex flex-col gap-1.5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-green-600 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-600"></span> Sustaining Stock
              </span>
              <h3 className="text-xs font-black text-md-on-background">Resume Production Alert</h3>
              <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                If distributor inventory runs low (<strong>&le;30% capacity</strong>), the system commands immediate factory startup to keep products flowing.
              </p>
            </div>

            <div className="bg-md-surface-container-low p-4 rounded-xl border border-md-outline/5 flex flex-col gap-1.5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-md-primary flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-md-primary"></span> Smart Balancing
              </span>
              <h3 className="text-xs font-black text-md-on-background">Regional Stock Transfers</h3>
              <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                If one region is empty and another is full, DemandFlow recommends a quick transfer instead of starting expensive manufacturing lines.
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Upload Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Sales & Demand Data */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-md-primary">Step 1</span>
              <label className="text-xs font-black text-md-on-background">
                Upload Sales & Customer Demand Data
              </label>
            </div>
            <div 
              onDragOver={preventDefault}
              onDragEnter={preventDefault}
              onDrop={(e) => {
                preventDefault(e);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleMarketFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => marketInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[24px] p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] shadow-sm hover:shadow-md ${
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
                  <div className="h-12 w-12 bg-md-primary/10 text-md-primary rounded-2xl flex items-center justify-center mb-3">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-black text-md-on-background">Drag & Drop or Click to Browse</p>
                  <p className="text-[10px] text-md-on-surface-variant mt-2 max-w-[240px] leading-normal">
                    CSV file containing Product SKU, Current Factory Production, Retail Sales, and Customer Orders.
                  </p>
                </>
              )}

              {marketStatus === "uploading" && (
                <>
                  <Loader2 className="h-10 w-10 text-md-primary animate-spin mb-3" />
                  <p className="text-xs font-bold text-md-on-background">Reading sales & demand metrics...</p>
                </>
              )}

              {marketStatus === "success" && (
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-xs font-black text-green-600 line-clamp-1">{marketFile?.name}</p>
                  <p className="text-[10px] text-md-on-surface-variant mt-1 font-semibold">Sales data loaded and validated</p>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); clearMarket(); }}
                    className="mt-4 flex gap-1.5 items-center text-[10px] text-red-500 hover:text-red-700 font-bold border border-red-200/20 px-3 py-1.5 rounded-full hover:bg-red-50 bg-white shadow-sm transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              )}

              {marketStatus === "error" && (
                <div className="flex flex-col items-center px-4">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                  <p className="text-xs font-bold text-red-600">Failed to Ingest</p>
                  <p className="text-[10px] text-md-on-surface-variant mt-1 text-center leading-normal">{marketError}</p>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); clearMarket(); }}
                    className="mt-4 text-[10px] text-md-primary hover:underline font-bold"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Warehouse Stock Levels */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-md-primary">Step 2</span>
              <label className="text-xs font-black text-md-on-background">
                Upload Warehouse Stock Levels
              </label>
            </div>
            <div 
              onDragOver={preventDefault}
              onDragEnter={preventDefault}
              onDrop={(e) => {
                preventDefault(e);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleInventoryFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => inventoryInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[24px] p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] shadow-sm hover:shadow-md ${
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
                  <div className="h-12 w-12 bg-md-primary/10 text-md-primary rounded-2xl flex items-center justify-center mb-3">
                    <Package className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-black text-md-on-background">Drag & Drop or Click to Browse</p>
                  <p className="text-[10px] text-md-on-surface-variant mt-2 max-w-[240px] leading-normal">
                    CSV file containing Product SKU, Warehouse Location, and Current Stock Counts.
                  </p>
                </>
              )}

              {inventoryStatus === "uploading" && (
                <>
                  <Loader2 className="h-10 w-10 text-md-primary animate-spin mb-3" />
                  <p className="text-xs font-bold text-md-on-background">Reading physical inventory counts...</p>
                </>
              )}

              {inventoryStatus === "success" && (
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-xs font-black text-green-600 line-clamp-1">{inventoryFile?.name}</p>
                  <p className="text-[10px] text-md-on-surface-variant mt-1 font-semibold">Inventory data loaded and validated</p>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); clearInventory(); }}
                    className="mt-4 flex gap-1.5 items-center text-[10px] text-red-500 hover:text-red-700 font-bold border border-red-200/20 px-3 py-1.5 rounded-full hover:bg-red-50 bg-white shadow-sm transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              )}

              {inventoryStatus === "error" && (
                <div className="flex flex-col items-center px-4">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                  <p className="text-xs font-bold text-red-600">Failed to Ingest</p>
                  <p className="text-[10px] text-md-on-surface-variant mt-1 text-center leading-normal">{inventoryError}</p>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); clearInventory(); }}
                    className="mt-4 text-[10px] text-md-primary hover:underline font-bold"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Dynamic Demo Datasheets Download Card */}
        <div className="border border-md-outline/10 bg-md-surface-container-low rounded-[24px] p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-md-primary flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-md-primary" /> Live Demo Resource
            </span>
            <h3 className="text-xs font-extrabold text-md-on-background">Test with Full-Fledged 1,000 Product Datasheets</h3>
            <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
              We generated premium, high-fidelity sample supply chain datasheets representing 1,000 distinct product SKUs. Perfect for showing off overstocked distributors and smart factory feedback loops instantly.
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

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-4 border-t border-md-outline/10 pt-6">
          {processError && (
            <div className="w-full p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold flex gap-2 items-center justify-center">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{processError}</span>
            </div>
          )}

          <Button 
            onClick={handleProcess} 
            disabled={marketStatus !== "success" || inventoryStatus !== "success" || processing}
            className="h-12 px-10 text-xs font-bold tracking-wider uppercase rounded-full shadow-lg hover:shadow-xl w-full md:w-auto"
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

      </Card>
    </main>
  );
}
