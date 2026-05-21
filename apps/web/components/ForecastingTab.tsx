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
            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedSku(p.sku_code)}
                  className={`p-3.5 rounded-[16px] border cursor-pointer transition-all duration-200 ${
                    selectedSku === p.sku_code
                      ? "bg-md-primary/10 border-md-primary text-md-primary font-bold"
                      : "bg-md-surface-container-low/50 border-md-outline/10 text-md-on-background hover:bg-md-surface-container-low"
                  }`}
                >
                  <div className="text-xs font-black">{p.sku_code}</div>
                  <div className="text-[11px] font-medium opacity-80 truncate">{p.name}</div>
                  <div className="text-[10px] mt-1.5 opacity-60 flex justify-between">
                    <span>{p.category}</span>
                    <span>Cost: ${p.unit_cost}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right Side: Charts and Controls */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {loadingDetails || !details ? (
            <Card className="flex flex-col items-center justify-center h-[500px] gap-4">
              <RefreshCw className="h-8 w-8 text-md-primary animate-spin" />
              <p className="text-md-on-surface-variant font-medium">Extracting predictive models...</p>
            </Card>
          ) : (
            <>
              {/* Controls and Target Warehouse Metadata */}
              <Card className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-black text-md-on-surface-variant">Active Product</span>
                  <h3 className="text-lg font-bold text-md-on-background">{details.product.name} ({details.product.sku_code})</h3>
                  <div className="flex gap-4 text-xs font-semibold text-md-on-surface-variant">
                    <span>Category: {details.product.category}</span>
                    <span>Unit Cost: ${details.product.unit_cost}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                  <div className="flex flex-col gap-1 w-44">
                    <label className="text-[10px] uppercase font-bold text-md-on-surface-variant px-1">Warehouse Site</label>
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                      className="h-10 bg-md-surface-container-low text-xs font-bold text-md-on-background px-3 border border-md-outline/20 rounded-full focus:outline-none focus:border-md-primary"
                    >
                      {details.inventory.map(inv => (
                        <option key={inv.warehouse_id} value={inv.warehouse_id}>
                          {inv.warehouse_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button 
                    onClick={handleRetrain} 
                    disabled={retraining} 
                    className="flex gap-2 text-xs h-10 mt-5 shrink-0"
                  >
                    {retraining ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> Training...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" /> Trigger ML Recalculation
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Chart Block */}
              <Card className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-md-on-background">Demand Forecast & Confidence Interval</h3>
                    <p className="text-xs text-md-on-surface-variant">
                      Comparison of historical actual units sold and 30-day forward demand prediction with 95% confidence limits.
                    </p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-md-on-surface-variant font-medium">
                      <span className="h-2 w-2 rounded-full bg-[#7D5260]" /> Historical
                    </span>
                    <span className="flex items-center gap-1.5 text-md-on-surface-variant font-medium">
                      <span className="h-2 w-2 rounded-full bg-[#6750A4]" /> AI Forecast
                    </span>
                  </div>
                </div>

                <div className="h-[320px] w-full">
                  {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-md-on-surface-variant text-sm font-medium">
                      No sales history or forecast generated for this warehouse.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" h="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E0EC" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(str) => {
                            if (!str) return "";
                            const date = new Date(str);
                            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          }}
                          tick={{ fill: "#49454F", fontSize: 10 }}
                          stroke="#79747E"
                        />
                        <YAxis tick={{ fill: "#49454F", fontSize: 10 }} stroke="#79747E" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "#F3EDF7", 
                            borderRadius: "16px", 
                            border: "1px solid rgba(121, 116, 126, 0.2)",
                            color: "#1C1B1F",
                            fontSize: "12px"
                          }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                        {/* Area for confidence range */}
                        <Area 
                          name="Confidence Interval (95%)"
                          type="monotone"
                          dataKey="range"
                          fill="#E8DEF8"
                          stroke="none"
                          fillOpacity={0.4}
                          connectNulls
                        />
                        <Line 
                          name="Historical Sales"
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#7D5260" 
                          strokeWidth={2.5}
                          dot={false}
                          connectNulls
                        />
                        <Line 
                          name="Forecast (Linear Regression v1)"
                          type="monotone" 
                          dataKey="forecast" 
                          stroke="#6750A4" 
                          strokeWidth={2.5}
                          strokeDasharray="4 4"
                          dot={{ r: 3, stroke: "#6750A4", strokeWidth: 1, fill: "#FFFFFF" }}
                          connectNulls
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* Tonal details and stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex flex-col gap-1.5 bg-md-surface-container-low">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-md-on-surface-variant">Active Stock Level</span>
                  <span className="text-2xl font-black text-md-on-background">
                    {activeWarehouse?.on_hand ?? 0} units
                  </span>
                  <p className="text-[11px] text-md-on-surface-variant font-medium">
                    Safety stock threshold: {activeWarehouse?.safety_stock ?? 0} units
                  </p>
                </Card>

                <Card className="flex flex-col gap-1.5 bg-md-surface-container-low">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-md-on-surface-variant">Reorder ROP Point</span>
                  <span className="text-2xl font-black text-md-on-background">
                    {activeWarehouse?.reorder_point ?? 0} units
                  </span>
                  <p className="text-[11px] text-md-on-surface-variant font-medium">
                    Status: <span className={`font-bold capitalize ${
                      activeWarehouse?.status === "healthy" ? "text-green-600" : "text-amber-600"
                    }`}>{activeWarehouse?.status ?? "N/A"}</span>
                  </p>
                </Card>

                <Card className="flex flex-col gap-1.5 bg-md-surface-container-low">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-md-on-surface-variant">Model Accuracy (WAPE)</span>
                  <span className="text-2xl font-black text-md-on-background">91.8%</span>
                  <p className="text-[11px] text-md-on-surface-variant font-medium">
                    Trained model: `linear_regression_v1`
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
