"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import GlowOverlay from "../../components/ui/GlowOverlay";
import { ApiClient } from "../../lib/api-client";
import { Boxes, Shield } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("manufacturer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ApiClient.initialize();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await ApiClient.register(email, password, role);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full relative flex items-center justify-center p-6 bg-[var(--color-md-background)]">
      <GlowOverlay />

      <Card hasScrews={true} hasVents={true} className="w-full max-w-md flex flex-col gap-6 p-8 shadow-[var(--shadow-floating)]">
        {/* Logo and Header info */}
        <div className="flex flex-col items-center gap-2 text-center select-none mt-2">
          <div className="h-12 w-12 bg-[var(--color-md-primary)] text-white rounded-lg flex items-center justify-center shadow-[4px_4px_8px_rgba(255,71,87,0.3)] border border-[rgba(255,255,255,0.2)]">
            <Boxes className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-md-on-background)] mt-2 font-sans uppercase">Create Operator Account</h1>
          <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-md-on-surface-variant)]/60 font-mono">
            OPERATOR LICENSE REGISTRATION
          </p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <Input
            id="email"
            type="text"
            label="OPERATOR USER ID"
            placeholder="acme-manufacturing"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            type="password"
            label="CHASSIS PASSWORD"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            id="confirmPassword"
            type="password"
            label="CONFIRM PASSWORD"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {/* Custom Styled Role Selector Switch */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-[var(--color-md-on-surface-variant)] px-1 select-none font-mono">
              OPERATION ROLE SELECT
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[var(--color-md-background)] p-1 rounded-md shadow-[var(--shadow-recessed)] select-none">
              <button
                type="button"
                onClick={() => setRole("manufacturer")}
                className={`py-2 text-[10px] font-mono font-bold uppercase rounded transition-all duration-150 cursor-pointer ${
                  role === "manufacturer"
                    ? "bg-[var(--color-md-surface-container)] text-[var(--color-md-on-background)] shadow-[var(--shadow-card)]"
                    : "text-[var(--color-md-on-surface-variant)]/60 hover:text-[var(--color-md-on-background)]"
                }`}
              >
                MANUFACTURER
              </button>
              <button
                type="button"
                onClick={() => setRole("distributor")}
                className={`py-2 text-[10px] font-mono font-bold uppercase rounded transition-all duration-150 cursor-pointer ${
                  role === "distributor"
                    ? "bg-[var(--color-md-surface-container)] text-[var(--color-md-on-background)] shadow-[var(--shadow-card)]"
                    : "text-[var(--color-md-on-surface-variant)]/60 hover:text-[var(--color-md-on-background)]"
                }`}
              >
                DISTRIBUTOR
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-[10px] rounded font-mono font-bold flex gap-2 items-center">
              <Shield className="h-4 w-4 shrink-0" />
              <span className="uppercase">{error}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-2 h-12 text-xs font-mono tracking-widest uppercase">
            {loading ? "REGISTERATIONAL SECURING..." : "ENGAGE ACCOUNT"}
          </Button>
        </form>

        <div className="text-[10px] font-mono text-[var(--color-md-on-surface-variant)]/60 text-center select-none mb-2">
          OPERATOR LICENSE ALREADY REGISTERED?{" "}
          <Link href="/" className="text-[var(--color-md-primary)] font-bold hover:underline ml-1">
            SIGN IN DECK
          </Link>
        </div>
      </Card>
    </main>
  );
}

