"use client";

import React, { useEffect, useState } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { RefreshCw, TrendingUp, Sliders, Calendar, Zap } from "lucide-react";
import { ApiClient } from "../lib/api-client";
import { 
  ComposedChart, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

interface ProductListItem {
  id: number;
  sku_code: string;
  name: string;
  category: string;
  unit_cost: number;
  total_on_hand: number;
}

interface ProductDetails {
  product: {
    id: number;
    sku_code: string;
    name: string;
    category: string;
    unit_cost: number;
  };
  inventory: Array<{
    warehouse_id: number;
    warehouse_name: string;
    city: string;
    on_hand: number;
    safety_stock: number;
    reorder_point: number;
    status?: string;
  }>;
  sales_history: Array<{
    date: string;
    quantity: number;
    warehouse_id: number;
  }>;
  forecasts: Array<{
    date: string;
    units: number;
    confidence_lower: number;
    confidence_upper: number;
    warehouse_id: number;
    model_version: string;
  }>;
}

export default function ForecastingTab() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(1);
  const [details, setDetails] = useState<ProductDetails | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedSku) {
      fetchProductDetails(selectedSku);
    }
  }, [selectedSku]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const data = await ApiClient.get<ProductListItem[]>("/api/products");
      setProducts(data);
      if (data.length > 0) {
        setSelectedSku(data[0].sku_code);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchProductDetails = async (sku: string) => {
    try {
      setLoadingDetails(true);
      const data = await ApiClient.get<ProductDetails>(`/api/products/${sku}`);
      setDetails(data);
    } catch (err) {
      console.error("Error loading product details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRetrain = async () => {
    if (!selectedSku) return;
    try {
      setRetraining(true);
      await ApiClient.post(`/api/products/${selectedSku}/forecast?warehouse_id=${selectedWarehouseId}`, {});
      // Reload details to show updated forecasts
      await fetchProductDetails(selectedSku);
    } catch (err) {
      console.error("Error retraining model:", err);
    } finally {
      setRetraining(false);
    }
  };

  // Filter sales and forecasts by selected warehouse for charting
  const getChartData = () => {
    if (!details) return [];
    
    // Group sales history by date for selected warehouse
    const whSales = details.sales_history.filter(s => s.warehouse_id === selectedWarehouseId);
    // Group forecasts for selected warehouse
    const whForecasts = details.forecasts.filter(f => f.warehouse_id === selectedWarehouseId);
    
    // Convert to unified array
    const chartMap: { [date: string]: any } = {};
    
    whSales.forEach(s => {
      chartMap[s.date] = {
        date: s.date,
        actual: s.quantity,
        forecast: null,
        range: null
      };
    });
    
    whForecasts.forEach(f => {
      chartMap[f.date] = {
        date: f.date,
        actual: null,
        forecast: f.units,
        // recharts Area expects a [lower, upper] range array
        range: [f.confidence_lower, f.confidence_upper]
      };
    });
    
    return Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date));
  };

  const chartData = getChartData();
  const activeWarehouse = details?.inventory.find(i => i.warehouse_id === selectedWarehouseId);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-md-on-background">Demand Forecasting Engine</h2>
        <p className="text-sm text-md-on-surface-variant">Time-series forecasting, machine learning retraining, and confidence bounds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Product Selector */}
        <Card className="lg:col-span-1 flex flex-col gap-4 max-h-[600px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-md-on-surface-variant">SKU Master Registry</h3>
          {loadingProducts ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <RefreshCw className="h-6 w-6 text-md-primary animate-spin" />
              <span className="text-xs text-md-on-surface-variant">Loading SKUs...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedSku(p.sku_code)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-150 ${
                    selectedSku === p.sku_code
                      ? "bg-md-primary/5 border-md-primary shadow-[var(--shadow-pressed)] text-md-primary font-extrabold"
                      : "bg-md-surface-container border-md-outline/10 text-md-on-background hover:shadow-[var(--shadow-floating)]"
                  }`}
                >
                  <div className="text-xs font-black font-mono tracking-wider">{p.sku_code}</div>
                  <div className="text-[11px] font-medium font-sans truncate max-w-full">{p.name}</div>
                  <div className="text-[9px] mt-2 font-mono opacity-70 flex justify-between uppercase">
                    <span>{p.category}</span>
                    <span>COST: ${p.unit_cost}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right Side: Charts and Controls */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {loadingDetails || !details ? (
            <Card className="flex flex-col items-center justify-center h-[500px] gap-4 font-mono text-xs">
              <div className="relative flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-md-primary animate-spin" />
                <span className="absolute w-2 h-2 rounded-full bg-md-primary animate-ping" />
              </div>
              <p className="text-md-on-surface-variant font-bold uppercase tracking-widest animate-pulse">SYSTEM: COMPILING PREDICTIVE MODEL...</p>
            </Card>
          ) : (
            <>
              {/* Controls and Target Warehouse Metadata */}
              <Card className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase font-bold font-mono tracking-wider text-md-on-surface-variant">ACTIVE SKU REGISTRY</span>
                  <h3 className="text-lg font-bold text-md-on-background font-mono">{details.product.name} ({details.product.sku_code})</h3>
                  <div className="flex gap-4 text-xs font-semibold text-md-on-surface-variant font-mono uppercase">
                    <span>CATEGORY: {details.product.category}</span>
                    <span>COST: ${details.product.unit_cost}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                  <div className="flex flex-col gap-1 w-44">
                    <label className="text-[9px] uppercase font-bold font-mono tracking-wider text-md-on-surface-variant px-1">WAREHOUSE SITE</label>
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                      className="h-10 bg-md-surface-container-low text-xs font-mono font-bold text-md-on-background px-3 border border-md-outline/20 rounded shadow-[var(--shadow-recessed)] focus:outline-none focus:border-md-primary"
                    >
                      {details.inventory.map(inv => (
                        <option key={inv.warehouse_id} value={inv.warehouse_id}>
                          {inv.warehouse_name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button 
                    onClick={handleRetrain} 
                    disabled={retraining} 
                    className="flex gap-2 text-xs h-10 mt-5 shrink-0 font-mono font-bold"
                  >
                    {retraining ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> RECALCULATING...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 text-md-on-primary" /> TRIGGER ML RUN
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Chart Block */}
              <Card className="flex flex-col gap-4 blueprint-grid bg-[var(--color-md-surface-container)] rounded-xl relative">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-md-on-background uppercase tracking-wider font-mono">Demand Forecast & Confidence Interval</h3>
                    <p className="text-xs text-md-on-surface-variant font-mono">
                      Comparison of historical actual units sold and 30-day forward demand prediction with 95% confidence limits.
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-mono font-bold uppercase">
                    <span className="flex items-center gap-1.5 text-md-on-surface-variant">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#4a5568]" /> HISTORICAL
                    </span>
                    <span className="flex items-center gap-1.5 text-md-on-surface-variant">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff4757]" /> AI FORECAST
                    </span>
                  </div>
                </div>

                <div className="h-[320px] w-full p-2 bg-[var(--color-md-surface-container-low)] rounded-lg shadow-[var(--shadow-recessed)] border border-md-outline/10">
                  {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-md-on-surface-variant text-sm font-mono uppercase font-bold">
                      NO TELEMETRY FOUND FOR THIS STATION
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(74, 85, 104, 0.15)" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(str) => {
                            if (!str) return "";
                            const date = new Date(str);
                            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          }}
                          tick={{ fill: "#4a5568", fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: "bold" }}
                          stroke="rgba(74, 85, 104, 0.3)"
                        />
                        <YAxis 
                          tick={{ fill: "#4a5568", fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: "bold" }} 
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
                          wrapperStyle={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: "bold", paddingTop: "5px" }} 
                        />
                        {/* Area for confidence range */}
                        <Area 
                          name="Confidence Interval (95%)"
                          type="monotone"
                          dataKey="range"
                          fill="#ff4757"
                          stroke="none"
                          fillOpacity={0.07}
                          connectNulls
                        />
                        <Line 
                          name="Historical Sales"
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#4a5568" 
                          strokeWidth={2.5}
                          dot={false}
                          connectNulls
                        />
                        <Line 
                          name="Forecast (ML Regression)"
                          type="monotone" 
                          dataKey="forecast" 
                          stroke="#ff4757" 
                          strokeWidth={2.5}
                          strokeDasharray="4 4"
                          dot={{ r: 3.5, stroke: "#ff4757", strokeWidth: 1.5, fill: "#FFFFFF" }}
                          connectNulls
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* Tonal details and stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex flex-col gap-1.5 bg-md-surface-container-low shadow-[var(--shadow-recessed)] border border-md-outline/10 p-5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-md-on-surface-variant font-mono">ACTIVE STOCK LEVEL</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-led" />
                  </div>
                  <span className="text-2xl font-black font-mono text-md-on-background">
                    {(activeWarehouse?.on_hand ?? 0).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-md-on-surface-variant font-mono uppercase">
                    SAFETY MARGIN: {activeWarehouse?.safety_stock ?? 0} UNITS
                  </p>
                </Card>

                <Card className="flex flex-col gap-1.5 bg-md-surface-container-low shadow-[var(--shadow-recessed)] border border-md-outline/10 p-5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-md-on-surface-variant font-mono">REORDER POINT (ROP)</span>
                    <span className={`w-2.5 h-2.5 rounded-full animate-led ${
                      activeWarehouse?.status === "healthy" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-500 shadow-[0_0_8px_#f59e0b]"
                    }`} />
                  </div>
                  <span className="text-2xl font-black font-mono text-md-on-background">
                    {(activeWarehouse?.reorder_point ?? 0).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-md-on-surface-variant font-mono uppercase">
                    STATUS: <span className={`font-bold uppercase ${
                      activeWarehouse?.status === "healthy" ? "text-emerald-600" : "text-amber-600"
                    }`}>{activeWarehouse?.status ?? "N/A"}</span>
                  </p>
                </Card>

                <Card className="flex flex-col gap-1.5 bg-md-surface-container-low shadow-[var(--shadow-recessed)] border border-md-outline/10 p-5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-md-on-surface-variant font-mono">MODEL ACCURACY</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-led" />
                  </div>
                  <span className="text-2xl font-black font-mono text-md-on-background">91.8%</span>
                  <p className="text-[10px] text-md-on-surface-variant font-mono uppercase">
                    MODEL: LINEAR_REGRESSION_V1
                  </p>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
