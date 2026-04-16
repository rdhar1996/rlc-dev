"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResidentLoginPage() {
  const router = useRouter();

  const [registerNumber, setRegisterNumber] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setMessage("");

    if (!registerNumber || !pin) {
      setMessage("Please enter your register number and PIN.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/resident-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        register_number: registerNumber,
        pin,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setMessage(result.error || "Invalid register number or PIN.");
      setLoading(false);
      return;
    }

    router.push("/resident-dashboard");
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#1e3a5f] px-8 py-4 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="text-2xl font-extrabold text-white">RLC</div>
          <div className="text-sm font-medium text-blue-100">
            Resident Login
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-xl bg-white p-10 shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-[#1e3a5f]">
            Resident Sign In
          </h1>

          <p className="mb-8 text-gray-500">
            Sign in with your register number and PIN.
          </p>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                Register Number
              </label>
              <input
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                placeholder="Register Number"
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-black placeholder-gray-400 outline-none focus:border-[#378add]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                4-digit PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-black placeholder-gray-400 outline-none focus:border-[#378add]"
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
              onClick={() => router.push("/resident-recover")}
              className="w-full rounded-md border border-gray-300 px-4 py-3 font-semibold text-[#1e3a5f]"
            >
              Forgot PIN?
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