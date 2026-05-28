"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f5f7] px-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"
      >
        <h1 className="text-3xl font-black text-[#1f5f8b]">Admin Login</h1>

        <p className="mt-2 text-slate-600">
          Login to manage your business website.
        </p>

        <div className="mt-8 space-y-4">
          <input
            required
            type="email"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            required
            type="password"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <button className="w-full rounded-full bg-[#f2a900] px-6 py-3 font-bold text-[#101820]">
            Login
          </button>
        </div>
      </form>
    </main>
  );
}