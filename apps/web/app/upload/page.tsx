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
  Trash2
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
    <main className="min-h-screen w-full relative flex items-center justify-center p-6 overflow-y-auto">
      <GlowOverlay />

      <Card className="w-full max-w-4xl flex flex-col gap-8 p-8 relative shadow-xl my-8">
        
        {/* Header Action Bar */}
        <div className="flex justify-between items-center border-b border-md-outline/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-md-primary text-white rounded-xl flex items-center justify-center shadow-md">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-md-on-background tracking-tight">DemandFlow Ingestion</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider text-md-primary">Setup & Data Alignment</span>
            </div>
          </div>
          <Button variant="outlined" onClick={handleLogout} className="h-9 px-3 text-xs font-bold border-md-outline/30 flex gap-2 items-center hover:bg-red-50 hover:border-red-200 hover:text-red-600">
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-md-primary/5 border border-md-primary/10 rounded-[18px] p-5">
          <h2 className="text-sm font-bold text-md-primary mb-1.5 flex gap-2 items-center">
            <Brain className="h-4.5 w-4.5 animate-pulse" />
            AI Prediction Engine Ingestion Requirements
          </h2>
          <p className="text-xs text-md-on-surface-variant leading-relaxed">
            Welcome! To generate real-time replenishment, production deficit, and regional mismatch recommendations, we require two datasets. Once both files are uploaded and validated, our embedded ML predictor model will evaluate stock balances immediately.
          </p>
        </div>

        {/* Dual Drag & Drop Zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Market Data */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-md-on-background px-1">
              1. Market Demand Dataset (CSV or JSON)
            </label>
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
              className={`border-2 border-dashed rounded-[20px] p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] ${
                marketStatus === "success" 
                  ? "border-green-400 bg-green-50/10" 
                  : marketStatus === "error" 
                    ? "border-red-400 bg-red-50/10" 
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
                  <Upload className="h-10 w-10 text-md-on-surface-variant/40 mb-3" />
                  <p className="text-xs font-bold text-md-on-background">Drag & Drop or Click to Browse</p>
                  <p className="text-[10px] text-md-on-surface-variant mt-1.5 max-w-[220px] leading-normal">
                    Must contain Product ID, Factory Production Metrics, Local Retail Sales, and Pending Shopkeeper Orders.
                  </p>
                </>
              )}

              {marketStatus === "uploading" && (
                <>
                  <Loader2 className="h-10 w-10 text-md-primary animate-spin mb-3" />
                  <p className="text-xs font-bold text-md-on-background">Uploading and parsing file...</p>
                </>
              )}

              {marketStatus === "success" && (
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-xs font-black text-green-600 line-clamp-1">{marketFile?.name}</p>
                  <p className="text-[10px] text-md-on-surface-variant mt-1">Successfully ingested and saved</p>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); clearMarket(); }}
                    className="mt-4 flex gap-1 items-center text-[10px] text-red-500 hover:text-red-700 font-bold"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove File
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

          {/* Card 2: Inventory Data */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-md-on-background px-1">
              2. Inventory Levels Dataset (CSV or JSON)
            </label>
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
              className={`border-2 border-dashed rounded-[20px] p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] ${
                inventoryStatus === "success" 
                  ? "border-green-400 bg-green-50/10" 
                  : inventoryStatus === "error" 
                    ? "border-red-400 bg-red-50/10" 
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
                  <Upload className="h-10 w-10 text-md-on-surface-variant/40 mb-3" />
                  <p className="text-xs font-bold text-md-on-background">Drag & Drop or Click to Browse</p>
                  <p className="text-[10px] text-md-on-surface-variant mt-1.5 max-w-[220px] leading-normal">
                    Must contain Product ID, Warehouse Locations, and Current Inventory Counts.
                  </p>
                </>
              )}

              {inventoryStatus === "uploading" && (
                <>
                  <Loader2 className="h-10 w-10 text-md-primary animate-spin mb-3" />
                  <p className="text-xs font-bold text-md-on-background">Uploading and parsing file...</p>
                </>
              )}

              {inventoryStatus === "success" && (
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-xs font-black text-green-600 line-clamp-1">{inventoryFile?.name}</p>
                  <p className="text-[10px] text-md-on-surface-variant mt-1">Successfully ingested and saved</p>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); clearInventory(); }}
                    className="mt-4 flex gap-1 items-center text-[10px] text-red-500 hover:text-red-700 font-bold"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove File
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
              "Process & Analyze Datasets"
            )}
          </Button>
          <span className="text-[10px] text-md-on-surface-variant">
            Process & Analyze compiles both tables, applies formulas, and outputs predictive recommendations.
          </span>
        </div>

      </Card>
    </main>
  );
}
