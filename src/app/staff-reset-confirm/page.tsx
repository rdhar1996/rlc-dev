"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StaffResetConfirmPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setMessage("");
    setMessageType("");

    if (!password || !confirmPassword) {
      setMessage("Please complete both password fields.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message || "Unable to update password.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setMessage("Password updated successfully.");
    setMessageType("success");
    setLoading(false);

    setTimeout(() => {
      router.push("/staff-login");
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-6 py-16">
      <div className="mx-auto max-w-xl rounded-xl bg-white p-10 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-[#1e3a5f]">
          Set New Password
        </h1>

        <p className="mb-8 text-gray-500">
          Enter and confirm your new password.
        </p>

        <div className="space-y-5">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-black"
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-black"
          />

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full rounded-md bg-[#378add] px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
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