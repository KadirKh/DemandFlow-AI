"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiClient } from "../../lib/api-client";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
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
  Loader2
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
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

  // State
  const [theme, setTheme] = useState("light");
  const [userRole, setUserRole] = useState("Manufacturer");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [hoveredRec, setHoveredRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal detail state
  const [detailRec, setDetailRec] = useState<Recommendation | null>(null);

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
        router.push("/upload");
      } catch (err: any) {
        alert(err.message || "Failed to clear data.");
      }
    }
  };

  // Split recommendations into Kanban columns
  const getCol1 = () =>
    recommendations.filter(
      (r) => r.action_status === "pending"
    );
  const getCol2 = () =>
    recommendations.filter(
      (r) => r.action_status === "pending_review"
    );
  const getCol3 = () =>
    recommendations.filter(
      (r) => r.action_status === "approved" || r.action_status === "rejected"
    );

  // Generate Recharts series based on active/hovered recommendation
  const generateChartData = (rec: Recommendation | null) => {
    if (!rec) return [];
    
    // Default horizons
    const days = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
    
    if (rec.type === "production_deficit") {
      return days.map((day, idx) => ({
        name: day,
        Approved: 15 + idx * 8,
        Rejected: Math.max(0, 15 - idx * 2.5),
      }));
    } else if (rec.type === "balanced_stock") {
      return days.map((day, idx) => ({
        name: day,
        Approved: 75 - idx * 1.2, // Holds stock at balanced levels
        Rejected: 75 + idx * 12,  // Excessive overstock
      }));
    } else if (rec.type === "regional_mismatch") {
      return days.map((day, idx) => ({
        name: day,
        Approved: 5 + idx * 6.5,  // Rebalances low stock to safe levels
        Rejected: Math.max(0, 5 - idx * 1), // Runs out completely
      }));
    }
    
    // Fallback default simulation
    return days.map((day, idx) => ({
      name: day,
      Approved: 40 + idx * 4,
      Rejected: 40 - idx * 4,
    }));
  };

  const activeChartRec = hoveredRec || selectedRec;
  const chartData = generateChartData(activeChartRec);

  return (
    <main className="min-h-screen flex relative w-full overflow-hidden">
      <GlowOverlay />

      {/* Sidebar Navigation */}
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

        <nav className="flex flex-col gap-2">
          <button
            onClick={() => fetchRecommendations()}
            className="flex items-center gap-3.5 w-full p-3 rounded-full text-xs font-bold bg-md-secondary-container text-md-on-secondary-container shadow-sm transition-all duration-200"
          >
            <Brain className="h-4.5 w-4.5 text-md-primary" />
            <span>AI Predictions Inbox</span>
          </button>

          <button
            onClick={() => router.push("/upload")}
            className="flex items-center gap-3.5 w-full p-3 rounded-full text-xs font-bold text-md-on-surface-variant hover:bg-md-primary/5 hover:text-md-primary transition-all duration-200"
          >
            <Upload className="h-4.5 w-4.5" />
            <span>Ingest Datasets</span>
          </button>
        </nav>

        {/* Profile and Logout */}
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
            onClick={handleClearData}
            className="w-full flex items-center justify-center gap-2 h-9 text-[11px] font-bold border-md-outline/30 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Reset Environment
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

      {/* Main Dashboard Grid */}
      <section className="flex-1 flex overflow-hidden">
        
        {/* Kanban Board Container */}
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-black text-md-on-background tracking-tight">Interactive AI Dashboard</h1>
              <p className="text-xs text-md-on-surface-variant">Real-time evaluations mapped by the embedded ML rules engine.</p>
            </div>
            <Button onClick={() => router.push("/upload")} variant="outlined" className="h-9 px-4 text-xs font-bold flex gap-1.5 items-center">
              <Upload className="h-4 w-4" /> Upload New Files
            </Button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-md-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-[18px] text-red-700 text-xs font-bold">
              {error}
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-3 gap-5 items-start min-h-0">
              
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
                    Pending Approval ({getCol2().length})
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

        {/* Right Sidebar Chart Panel */}
        <aside className="w-80 border-l border-md-outline/10 bg-md-surface-container/30 flex flex-col p-6 overflow-y-auto">
          
          <div className="mb-6 pb-4 border-b border-md-outline/10">
            <h2 className="text-xs font-black uppercase tracking-wider text-md-on-surface-variant mb-1 flex gap-1.5 items-center">
              <TrendingUp className="h-4.5 w-4.5 text-md-primary" />
              Impact of Approval
            </h2>
            <p className="text-[10px] text-md-on-surface-variant">Selected recommendation impact projection model.</p>
          </div>

          {activeChartRec ? (
            <div className="flex flex-col gap-6">
              
              {/* Header card snippet */}
              <div className="p-4 bg-md-surface-container-low border border-md-outline/10 rounded-[18px] flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full self-start bg-md-primary/10 text-md-primary">
                  SKU: {activeChartRec.entity_id}
                </span>
                <p className="text-[11px] font-medium text-md-on-background leading-relaxed line-clamp-3">
                  {activeChartRec.explanation}
                </p>
              </div>

              {/* Simulation chart */}
              <div className="h-56 w-full bg-md-surface-container-low border border-md-outline/10 rounded-[18px] p-3 flex flex-col justify-between">
                <h3 className="text-[10px] font-bold text-center text-md-on-surface-variant">Projected Stock Level (7 Days)</h3>
                
                <div className="h-40 w-full text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="name" stroke="#666" tickLine={false} />
                      <YAxis stroke="#666" tickLine={false} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={24} iconSize={8} />
                      <Line 
                        type="monotone" 
                        dataKey="Approved" 
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Rejected" 
                        stroke="#ef4444" 
                        strokeWidth={2.5} 
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Explanatory text */}
              <div className="text-[10px] text-md-on-surface-variant leading-relaxed p-3 bg-md-primary/5 rounded-[12px] border border-md-primary/10">
                <strong>ML Projection:</strong> The green line projects safe, balanced stock ranges when the recommendation is executed. The red line represents the risk of stock depletion or costly overstocked holding loops when action is rejected.
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-md-on-surface-variant/50 p-6">
              <Info className="h-8 w-8 text-md-on-surface-variant/30 mb-3" />
              Hover or select a card to run the time-series impact simulator.
            </div>
          )}

        </aside>

      </section>

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
  // Define colors based on type
  const getBadgeStyles = (type: string) => {
    switch (type) {
      case "production_deficit":
        return {
          title: "Production Deficit",
          bg: "bg-red-50 text-red-600 border-red-200",
          icon: <AlertTriangle className="h-3 w-3 text-red-500" />
        };
      case "balanced_stock":
        return {
          title: "Balanced Stock",
          bg: "bg-green-50 text-green-600 border-green-200",
          icon: <CheckCircle className="h-3 w-3 text-green-500" />
        };
      case "regional_mismatch":
        return {
          title: "Regional Mismatch",
          bg: "bg-amber-50 text-amber-600 border-amber-200",
          icon: <AlertTriangle className="h-3 w-3 text-amber-500" />
        };
      default:
        return {
          title: "General recommendation",
          bg: "bg-gray-50 text-gray-600 border-gray-200",
          icon: <Info className="h-3 w-3 text-gray-500" />
        };
    }
  };

  const badge = getBadgeStyles(rec.type);

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-4 rounded-[20px] bg-md-surface-container border transition-all duration-200 cursor-pointer flex flex-col gap-3 ${
        isSelected 
          ? "border-md-primary ring-1 ring-md-primary shadow-md" 
          : isHovered 
            ? "border-md-primary/45 shadow-sm" 
            : "border-md-outline/10 hover:border-md-outline/25"
      }`}
    >
      <div className="flex justify-between items-center">
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badge.bg} flex gap-1 items-center`}>
          {badge.icon}
          {badge.title}
        </span>
        <span className="text-[10px] font-extrabold text-md-on-surface-variant">
          Conf: {intScore(rec.score)}%
        </span>
      </div>

      <div className="text-[11px] text-md-on-surface-variant leading-relaxed line-clamp-3">
        {rec.explanation}
      </div>

      <div className="flex justify-between items-center mt-1 border-t border-md-outline/5 pt-2">
        <span className="text-[9px] font-black text-md-primary">SKU: {rec.entity_id}</span>
        {actions}
      </div>
    </div>
  );
}

function intScore(score: number): number {
  if (score <= 1.0) {
    return Math.round(score * 100);
  }
  return Math.round(score);
}

interface Loader2Props extends React.SVGProps<SVGSVGElement> {}
