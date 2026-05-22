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
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <RefreshCw className="h-8 w-8 text-md-primary animate-spin" />
        <p className="text-md-on-surface-variant font-medium">Aggregating supply chain metrics...</p>
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
          <div className="h-10 w-10 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-md-on-surface-variant mt-2">Total Sales (30d)</span>
          <span className="text-3xl font-bold text-md-on-background">{data.kpis.total_sales_30d.toLocaleString()} units</span>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-md-primary/5 rounded-full blur-xl pointer-events-none -z-10 group-hover:bg-md-primary/10 transition-colors duration-300" />
        </Card>

        <Card className="flex flex-col gap-2 relative overflow-hidden group">
          <div className="h-10 w-10 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-md-on-surface-variant mt-2">Predicted Demand (30d)</span>
          <span className="text-3xl font-bold text-md-on-background">{data.kpis.total_forecast_30d.toLocaleString()} units</span>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-md-secondary-container/10 rounded-full blur-xl pointer-events-none -z-10" />
        </Card>

        <Card className="flex flex-col gap-2 relative overflow-hidden group">
          <div className="h-10 w-10 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center">
            <CheckCircle className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-md-on-surface-variant mt-2">Inventory Fill Rate</span>
          <span className="text-3xl font-bold text-md-on-background">{data.kpis.fill_rate}%</span>
          <span className="text-xs text-green-600 font-medium">Optimal performance threshold</span>
        </Card>

        <Card className="flex flex-col gap-2 relative overflow-hidden group">
          <div className="h-10 w-10 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-md-on-surface-variant mt-2">Forecast Accuracy</span>
          <span className="text-3xl font-bold text-md-on-background">{data.kpis.forecast_accuracy}%</span>
          <span className="text-xs text-md-primary font-medium">WAPE error rate: 8.8%</span>
        </Card>
      </div>

      {/* Main Sections: Chart and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demand Trend Chart */}
        <Card className="lg:col-span-2 flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold text-md-on-background">Demand Forecasting Trend</h3>
            <p className="text-xs text-md-on-surface-variant">Combined historical sales vs next 30 days regression prediction.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" h="100%">
              <AreaChart data={data.demand_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7D5260" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7D5260" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6750A4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6750A4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E0EC" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(str) => {
                    if (!str) return "";
                    const date = new Date(str);
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                  tick={{ fill: "#49454F", fontSize: 11 }}
                  stroke="#79747E"
                />
                <YAxis tick={{ fill: "#49454F", fontSize: 11 }} stroke="#79747E" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#F3EDF7", 
                    borderRadius: "16px", 
                    border: "1px solid rgba(121, 116, 126, 0.2)",
                    color: "#1C1B1F",
                    fontSize: "12px"
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  name="Historical Sales" 
                  stroke="#7D5260" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#actualGrad)" 
                  connectNulls
                />
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  name="AI Forecast (30d)" 
                  stroke="#6750A4" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
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
              <h3 className="text-lg font-bold text-md-on-background">Stock Risk Alerts</h3>
              <p className="text-xs text-md-on-surface-variant">Active stockouts and low stock detections.</p>
            </div>
            {data.kpis.pending_recs > 0 && (
              <span className="h-6 px-2 text-[10px] font-bold bg-md-tertiary text-white rounded-full flex items-center justify-center animate-pulse">
                {data.kpis.pending_recs} recommendations
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
            {data.alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-sm font-semibold text-md-on-background">All warehouses stable</p>
                <p className="text-xs text-md-on-surface-variant">No stockouts detected.</p>
              </div>
            ) : (
              data.alerts.map((alert, i) => (
                <div 
                  key={i} 
                  className={`flex items-start justify-between p-3.5 rounded-[16px] border ${
                    alert.type === "out_of_stock"
                      ? "bg-red-50 border-red-200"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <div className="flex gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${
                      alert.type === "out_of_stock" ? "text-red-500" : "text-amber-500"
                    }`} />
                    <div>
                      <h4 className="text-xs font-bold text-md-on-background">{alert.sku}</h4>
                      <p className="text-[11px] text-md-on-surface-variant font-medium line-clamp-1">{alert.product_name}</p>
                      <p className="text-[10px] text-md-on-surface-variant/80 font-medium">Site: {alert.warehouse}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase block tracking-wider opacity-60">On Hand</span>
                    <span className={`text-sm font-black ${
                      alert.type === "out_of_stock" ? "text-red-600" : "text-amber-600"
                    }`}>{alert.on_hand}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button 
            variant="ghost" 
            onClick={() => onNavigateToTab("inventory")}
            className="w-full flex items-center justify-center gap-1.5 mt-auto pt-2 hover:translate-x-1 duration-200 text-xs"
          >
            Open Inventory Planner <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>

      {/* Quick Action Banner */}
      <Card className="flex flex-col md:flex-row justify-between items-center gap-4 bg-md-primary/10 border-md-primary/20">
        <div className="flex gap-4 items-center">
          <div className="h-12 w-12 bg-md-primary text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-md-on-background">AI Recommended Stock Balancing</h4>
            <p className="text-xs text-md-on-surface-variant">There are {data.kpis.pending_recs} pending transfer or purchase recommendations ready for authorization.</p>
          </div>
        </div>
        <Button onClick={() => onNavigateToTab("recommendations")} className="flex gap-2 text-xs">
          Open Decisions Inbox <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
}
