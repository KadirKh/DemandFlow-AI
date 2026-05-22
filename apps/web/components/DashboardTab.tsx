"use client";

import React, { useEffect, useState } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { ApiClient } from "../lib/api-client";
import { 
  TrendingUp, 
  AlertTriangle, 
  Layers, 
  CheckCircle, 
  ArrowRight, 
  ChevronRight, 
  RefreshCw 
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

interface DashboardData {
  kpis: {
    total_sales_30d: number;
    total_forecast_30d: number;
    fill_rate: number;
    forecast_accuracy: number;
    pending_recs: number;
    stockout_count: number;
    low_stock_count: number;
  };
  alerts: Array<{
    type: string;
    sku: string;
    product_name: string;
    warehouse: string;
    on_hand: number;
    reorder_point: number;
    severity: string;
  }>;
  demand_trend: Array<{
    date: string;
    actual: number | null;
    forecast: number | null;
  }>;
}

export default function DashboardTab({ onNavigateToTab }: { onNavigateToTab: (tab: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const json = await ApiClient.get<DashboardData>("/api/dashboard");
      setData(json);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 font-mono text-xs">
        <div className="relative flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-md-primary animate-spin" />
          <span className="absolute w-2 h-2 rounded-full bg-md-primary animate-ping" />
        </div>
        <p className="text-md-on-surface-variant font-bold uppercase tracking-widest animate-pulse">SYSTEM: AGGREGATING TELEMETRY...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Welcome Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-md-on-background">Overview</h2>
          <p className="text-sm text-md-on-surface-variant">Real-time supply chain health and inventory risks.</p>
        </div>
        <Button variant="tonal" onClick={fetchDashboardData} className="flex gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center shadow-[var(--shadow-recessed)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5 bg-black/5 px-2 py-0.5 rounded border border-md-outline/10 text-[9px] font-mono font-bold uppercase text-md-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-led" />
              ONLINE
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant mt-2 font-mono">TOTAL SALES (30D)</span>
          <span className="text-3xl font-black font-mono tracking-tight text-md-on-background">{data.kpis.total_sales_30d.toLocaleString()}</span>
          <div className="text-[10px] text-md-on-surface-variant font-mono opacity-80 mt-1">units registered</div>
        </Card>

        <Card className="flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center shadow-[var(--shadow-recessed)]">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5 bg-black/5 px-2 py-0.5 rounded border border-md-outline/10 text-[9px] font-mono font-bold uppercase text-md-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-led" />
              CALC
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant mt-2 font-mono">PREDICTED DEMAND</span>
          <span className="text-3xl font-black font-mono tracking-tight text-md-on-background">{data.kpis.total_forecast_30d.toLocaleString()}</span>
          <div className="text-[10px] text-md-on-surface-variant font-mono opacity-80 mt-1">units projected</div>
        </Card>

        <Card className="flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center shadow-[var(--shadow-recessed)]">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5 bg-black/5 px-2 py-0.5 rounded border border-md-outline/10 text-[9px] font-mono font-bold uppercase text-md-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-led" />
              OPTIMAL
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant mt-2 font-mono">INVENTORY FILL RATE</span>
          <span className="text-3xl font-black font-mono tracking-tight text-md-on-background">{data.kpis.fill_rate}%</span>
          <div className="text-[10px] text-emerald-600 font-mono font-semibold mt-1">Optimal performance threshold</div>
        </Card>

        <Card className="flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="h-10 w-10 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center shadow-[var(--shadow-recessed)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5 bg-black/5 px-2 py-0.5 rounded border border-md-outline/10 text-[9px] font-mono font-bold uppercase text-md-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-led" />
              STABLE
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant mt-2 font-mono">FORECAST ACCURACY</span>
          <span className="text-3xl font-black font-mono tracking-tight text-md-on-background">{data.kpis.forecast_accuracy}%</span>
          <div className="text-[10px] text-md-primary font-mono font-semibold mt-1">WAPE error rate: 8.8%</div>
        </Card>
      </div>

      {/* Main Sections: Chart and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demand Trend Chart */}
        <Card className="lg:col-span-2 flex flex-col gap-4 blueprint-grid bg-[var(--color-md-surface-container)] rounded-xl relative">
          <div>
            <h3 className="text-lg font-bold text-md-on-background uppercase tracking-wider font-mono">Demand Forecasting Trend</h3>
            <p className="text-xs text-md-on-surface-variant font-mono">Combined historical sales vs next 30 days regression prediction.</p>
          </div>
          <div className="h-[300px] w-full p-2 bg-[var(--color-md-surface-container-low)] rounded-lg shadow-[var(--shadow-recessed)] border border-md-outline/10 animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.demand_trend} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a5568" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#4a5568" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4757" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#ff4757" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(74, 85, 104, 0.15)" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(str) => {
                    if (!str) return "";
                    const date = new Date(str);
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                  tick={{ fill: "#4a5568", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: "bold" }}
                  stroke="rgba(74, 85, 104, 0.3)"
                />
                <YAxis 
                  tick={{ fill: "#4a5568", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: "bold" }} 
                  stroke="rgba(74, 85, 104, 0.3)" 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--color-md-surface-container)", 
                    borderRadius: "8px", 
                    border: "2px solid var(--color-md-outline)",
                    color: "var(--color-md-on-background)",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    boxShadow: "var(--shadow-card)"
                  }} 
                />
                <Legend 
                  iconType="rect" 
                  wrapperStyle={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: "bold", paddingTop: "10px" }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  name="Historical Sales" 
                  stroke="#4a5568" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#actualGrad)" 
                  connectNulls
                />
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  name="AI Forecast (30d)" 
                  stroke="#ff4757" 
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#forecastGrad)" 
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Inventory Risk Alerts */}
        <Card className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-md-on-background uppercase tracking-wider font-mono">Stock Risk Alerts</h3>
              <p className="text-xs text-md-on-surface-variant font-mono">Active stockouts and low stock detections.</p>
            </div>
            {data.kpis.pending_recs > 0 && (
              <span className="h-6 px-2.5 text-[9px] font-mono font-bold bg-md-primary text-white rounded border border-red-400 flex items-center justify-center animate-pulse animate-led">
                {data.kpis.pending_recs} RECS PENDING
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
            {data.alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-sm font-semibold text-md-on-background uppercase font-mono">All Warehouses Stable</p>
                <p className="text-xs text-md-on-surface-variant font-mono">No stockouts detected.</p>
              </div>
            ) : (
              data.alerts.map((alert, i) => (
                <div 
                  key={i} 
                  className={`flex items-start justify-between p-3.5 rounded-lg border ${
                    alert.type === "out_of_stock"
                      ? "bg-red-500/5 border-red-500/40 text-red-700 dark:text-red-400"
                      : "bg-amber-500/5 border-amber-500/40 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1 relative flex h-3 w-3 shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        alert.type === "out_of_stock" ? "bg-red-500" : "bg-amber-500"
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${
                        alert.type === "out_of_stock" ? "bg-red-500" : "bg-amber-500"
                      }`}></span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black font-mono tracking-wider">{alert.sku}</h4>
                      <p className="text-[11px] font-medium font-sans line-clamp-1 opacity-90">{alert.product_name}</p>
                      <p className="text-[10px] font-mono opacity-75 mt-0.5">SITE: {alert.warehouse.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[9px] font-mono font-bold uppercase block tracking-wider opacity-60">ON HAND</span>
                    <span className={`text-sm font-mono font-black ${
                      alert.type === "out_of_stock" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                    }`}>{alert.on_hand}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button 
            variant="ghost" 
            onClick={() => onNavigateToTab("inventory")}
            className="w-full flex items-center justify-center gap-1.5 mt-auto pt-2 hover:translate-x-1 duration-200 text-xs font-mono font-bold"
          >
            OPEN INVENTORY PLANNER <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>

      {/* Quick Action Banner */}
      <Card className="flex flex-col md:flex-row justify-between items-center gap-4 bg-md-primary/5 border border-md-primary/30 relative overflow-hidden">
        {/* Zebra caution pattern side accent */}
        <div className="absolute left-0 top-0 bottom-0 w-2 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--color-md-primary) 0, var(--color-md-primary) 8px, transparent 8px, transparent 16px)' }} />
        <div className="flex gap-4 items-center pl-3">
          <div className="h-10 w-10 bg-md-primary text-white rounded-lg flex items-center justify-center shrink-0 shadow-[var(--shadow-card)]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-md-on-background uppercase tracking-wider font-mono">AI Recommended Stock Balancing</h4>
            <p className="text-xs text-md-on-surface-variant font-mono">There are <span className="font-bold text-md-primary">{data.kpis.pending_recs} pending</span> transfer or purchase recommendations ready for authorization.</p>
          </div>
        </div>
        <Button onClick={() => onNavigateToTab("recommendations")} className="flex gap-2 text-xs font-mono font-bold">
          OPEN DECISIONS INBOX <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
}
