"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StaffResetPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setMessage("");
    setMessageType("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/staff-reset-confirm`,
    });

    if (error) {
      setMessage(error.message || "Unable to send reset email.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setMessage("Password reset email sent.");
    setMessageType("success");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-6 py-16">
      <div className="mx-auto max-w-xl rounded-xl bg-white p-10 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-[#1e3a5f]">
          Reset Staff Password
        </h1>

        <p className="mb-8 text-gray-500">
          Enter your email to receive a reset link.
        </p>

        <div className="space-y-5">
          <input
            type="email"
            placeholder="Staff Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-black"
          />

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full rounded-md bg-[#378add] px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Email"}
          </button>

          {message ? (
            <div
              className={`rounded-lg px-4 py-3 text-sm font-medium ${
                messageType === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}