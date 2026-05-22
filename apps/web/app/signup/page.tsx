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
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full relative flex items-center justify-center p-4 overflow-hidden">
      <GlowOverlay />

      <Card className="w-full max-w-md flex flex-col gap-6 p-8 relative shadow-lg">
        <div className="flex flex-col items-center gap-2 text-center select-none">
          <div className="h-14 w-14 bg-md-primary text-white rounded-[20px] flex items-center justify-center shadow-md animate-pulse">
            <Boxes className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-md-on-background mt-2">Create Account</h1>
          <p className="text-xs text-md-on-surface-variant max-w-xs leading-relaxed">
            Set up your DemandFlow AI account to access the console.
          </p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <Input
            id="email"
            type="text"
            label="User ID"
            placeholder="acme-manufacturing"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-md-on-surface-variant px-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-11 bg-md-surface-container-low text-xs font-bold text-md-on-background px-3 border border-md-outline/20 rounded-full focus:outline-none focus:border-md-primary"
            >
              <option value="manufacturer">Manufacturer</option>
              <option value="distributor">Distributor</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold flex gap-2 items-center">
              <Shield className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-4 h-11 text-xs font-bold">
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-[11px] text-md-on-surface-variant text-center">
          Already have an account?{" "}
          <Link href="/" className="text-md-primary font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </main>
  );
}
