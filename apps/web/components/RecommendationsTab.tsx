"use client";

import React, { useEffect, useState } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { CheckCircle2, XCircle, ArrowRight, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";

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
      const res = await fetch("http://localhost:8000/api/recommendations");
      const json = await res.json();
      setRecommendations(json);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: "approved" | "rejected") => {
    try {
      setActioningId(id);
      const res = await fetch(`http://localhost:8000/api/recommendations/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      await res.json();
      
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
          label: "Procurement Restock",
          styles: "bg-purple-100 text-purple-800 border-purple-200"
        };
      case "transfer":
        return {
          label: "Warehouse Transfer",
          styles: "bg-blue-100 text-blue-800 border-blue-200"
        };
      case "hold":
        return {
          label: "Hold Purchase",
          styles: "bg-amber-100 text-amber-800 border-amber-200"
        };
      default:
        return {
          label: "AI Recommendation",
          styles: "bg-md-secondary-container text-md-on-secondary-container border-md-outline/10"
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
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw className="h-8 w-8 text-md-primary animate-spin" />
          <p className="text-sm text-md-on-surface-variant font-medium">Running recommendation scorer pipeline...</p>
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
                      ? "border-green-300 bg-green-50/20 opacity-80"
                      : rec.action_status === "rejected"
                      ? "border-red-200 bg-red-50/20 opacity-60"
                      : "border-md-outline/10 bg-md-surface-container"
                  }`}
                >
                  {/* Top line with type and confidence score */}
                  <div className="flex justify-between items-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.styles}`}>
                      {badge.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-black text-md-primary bg-md-primary/5 px-2 py-0.5 rounded-full">
                      <Sparkles className="h-3 w-3 shrink-0" /> {scorePercent}% Score
                    </span>
                  </div>

                  {/* Body text explanation */}
                  <div className="text-xs font-medium text-md-on-background leading-relaxed py-2">
                    {rec.explanation}
                  </div>

                  {/* Status / Action buttons */}
                  <div className="flex items-center justify-between border-t border-md-outline/5 pt-4 mt-auto">
                    <span className="text-[10px] text-md-on-surface-variant font-medium">
                      Scored: {new Date(rec.created_at).toLocaleDateString()}
                    </span>
                    
                    <div className="flex gap-2">
                      {rec.action_status === "pending" ? (
                        <>
                          <Button 
                            variant="outlined" 
                            disabled={actioningId !== null}
                            onClick={() => handleAction(rec.id, "rejected")}
                            className="h-9 px-4 text-xs font-bold border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                          <Button 
                            disabled={actioningId !== null}
                            onClick={() => handleAction(rec.id, "approved")}
                            className="h-9 px-4 text-xs font-bold bg-green-600 text-white hover:bg-green-700"
                          >
                            Approve
                          </Button>
                        </>
                      ) : rec.action_status === "approved" ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                          <CheckCircle2 className="h-4 w-4" /> Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                          <XCircle className="h-4 w-4" /> Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual background atmospheric detail */}
                  <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-md-primary/5 rounded-full blur-xl pointer-events-none -z-10" />
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
