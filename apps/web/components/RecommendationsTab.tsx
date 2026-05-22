"use client";

import React, { useEffect, useState } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { CheckCircle2, XCircle, ArrowRight, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { ApiClient } from "../lib/api-client";

interface Recommendation {
  id: number;
  type: string;
  entity_id: string;
  score: number;
  explanation: string;
  action_status: string;
  created_at: string;
}

export default function RecommendationsTab() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.get<Recommendation[]>("/api/recommendations");
      setRecommendations(data);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: "approved" | "rejected") => {
    try {
      setActioningId(id);
      await ApiClient.post(`/api/recommendations/${id}/action`, { action });
      
      // Update recommendation status locally
      setRecommendations(prev =>
        prev.map(r => r.id === id ? { ...r, action_status: action } : r)
      );
    } catch (err) {
      console.error("Error processing recommendation action:", err);
    } finally {
      setActioningId(null);
    }
  };

  const getBadgeDetails = (type: string) => {
    switch (type) {
      case "restock":
        return {
          label: "PROCUREMENT RESTOCK",
          styles: "border-[#6b46c1]/40 bg-[#6b46c1]/5 text-[#6b46c1] dark:text-purple-300 font-mono"
        };
      case "transfer":
        return {
          label: "WAREHOUSE TRANSFER",
          styles: "border-[#3182ce]/40 bg-[#3182ce]/5 text-[#3182ce] dark:text-blue-300 font-mono"
        };
      case "hold":
        return {
          label: "HOLD PURCHASE PROTOCOL",
          styles: "border-[#dd6b20]/40 bg-[#dd6b20]/5 text-[#dd6b20] dark:text-orange-300 font-mono"
        };
      default:
        return {
          label: "AI OPTIMIZATION SIGNAL",
          styles: "border-md-outline/25 bg-black/5 text-md-on-surface-variant font-mono"
        };
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-md-on-background">AI Recommendation Inbox</h2>
          <p className="text-sm text-md-on-surface-variant">Ranked decision recommendations from forecasting signals and network logs.</p>
        </div>
        <Button variant="tonal" onClick={fetchRecommendations} className="flex gap-2 text-xs">
          <RefreshCw className="h-4 w-4" /> Refresh Queue
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 font-mono text-xs">
          <div className="relative flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-md-primary animate-spin" />
            <span className="absolute w-2 h-2 rounded-full bg-md-primary animate-ping" />
          </div>
          <p className="text-md-on-surface-variant font-bold uppercase tracking-widest animate-pulse">SYSTEM: SCORING INBOX PIPELINE...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.length === 0 ? (
            <Card className="col-span-2 flex flex-col items-center justify-center py-24">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
              <p className="text-sm font-bold text-md-on-background">Queue Clear</p>
              <p className="text-xs text-md-on-surface-variant">No active optimization recommendations.</p>
            </Card>
          ) : (
            recommendations.map((rec) => {
              const badge = getBadgeDetails(rec.type);
              const scorePercent = Math.round(rec.score * 100);
              
              return (
                <Card 
                  key={rec.id} 
                  className={`flex flex-col gap-4 relative overflow-hidden transition-all duration-300 border ${
                    rec.action_status === "approved"
                      ? "border-emerald-300 bg-[#eef8f4] dark:bg-[#162720] opacity-90 shadow-md"
                      : rec.action_status === "rejected"
                      ? "border-red-200 bg-[#faf2f2] dark:bg-[#281b1b] opacity-80 shadow-md"
                      : "border-[#d1cbbd] dark:border-[#2d2926] bg-[#faf6ee] dark:bg-[#1b1917] shadow-[2px_4px_10px_rgba(0,0,0,0.06)]"
                  }`}
                >
                  {/* Torn edge mechanical paper line */}
                  <div className="w-full border-t border-dashed border-[#babecc] dark:border-[#4a453f] opacity-50 -mt-1" />

                  {/* Top line with type and confidence score */}
                  <div className="flex justify-between items-center z-10">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${badge.styles}`}>
                      {badge.label}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-black text-md-primary bg-md-primary/5 px-2 py-0.5 rounded border border-md-primary/10 font-mono">
                      <Sparkles className="h-3 w-3 shrink-0" /> {scorePercent}% CONFIDENCE
                    </span>
                  </div>

                  {/* Body text explanation */}
                  <div className="text-xs font-mono text-[#4a453f] dark:text-[#d1cbbd] leading-relaxed py-2 pl-2 border-l-2 border-[#babecc] dark:border-[#4a453f] z-10 bg-black/5 p-2 rounded">
                    {rec.explanation}
                  </div>

                  {/* Mechanical Approved/Rejected overlay ink stamps */}
                  {rec.action_status === "approved" && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-double border-emerald-600/60 text-emerald-600/60 font-mono text-2xl font-black px-4 py-1 rounded tracking-widest pointer-events-none select-none z-20 uppercase animate-scale-in">
                      APPROVED
                    </div>
                  )}
                  {rec.action_status === "rejected" && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-double border-red-600/60 text-red-600/60 font-mono text-2xl font-black px-4 py-1 rounded tracking-widest pointer-events-none select-none z-20 uppercase animate-scale-in">
                      REJECTED
                    </div>
                  )}

                  {/* Status / Action buttons */}
                  <div className="flex items-center justify-between border-t border-dashed border-[#babecc] dark:border-[#4a453f] pt-4 mt-auto z-10">
                    <span className="text-[9px] text-[#4a453f]/75 dark:text-[#d1cbbd]/70 font-mono">
                      RECORDED: {new Date(rec.created_at).toLocaleDateString()}
                    </span>
                    
                    <div className="flex gap-2">
                      {rec.action_status === "pending" ? (
                        <>
                          <Button 
                            variant="outlined" 
                            disabled={actioningId !== null}
                            onClick={() => handleAction(rec.id, "rejected")}
                            className="h-8 px-3.5 text-[10px] font-mono font-bold border-red-400 text-red-600 hover:bg-red-50"
                          >
                            REJECT
                          </Button>
                          <Button 
                            disabled={actioningId !== null}
                            onClick={() => handleAction(rec.id, "approved")}
                            className="h-8 px-3.5 text-[10px] font-mono font-bold bg-green-600 text-white hover:bg-green-700"
                          >
                            APPROVE
                          </Button>
                        </>
                      ) : rec.action_status === "approved" ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> VERIFIED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-red-600 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          <XCircle className="h-3 w-3" /> REJECTED
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
