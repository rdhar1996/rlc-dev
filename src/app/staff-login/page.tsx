"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StaffLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message || "Unable to sign in.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#1e3a5f] px-8 py-4 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="text-2xl font-extrabold text-white">RLC</div>
          <div className="text-sm font-medium text-blue-100">
            Staff Login
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-xl bg-white p-10 shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-[#1e3a5f]">
            Staff Sign In
          </h1>

          <p className="mb-8 text-gray-500">
            Sign in with your email and password.
          </p>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-black"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-md bg-[#378add] px-4 py-3 font-bold text-white disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <button
              onClick={() => router.push("/staff-reset")}
              className="w-full rounded-md border border-gray-300 px-4 py-3 font-semibold text-[#1e3a5f]"
            >
              Forgot Password?
            </button>

            {message ? (
              <p className="text-sm font-medium text-red-500">{message}</p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}