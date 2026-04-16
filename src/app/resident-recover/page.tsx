"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResidentRecoverPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    register_number: "",
    new_pin: "",
    confirm_pin: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);

  const handleRecover = async () => {
    setMessage("");
    setMessageType("");

    if (
      !form.first_name ||
      !form.last_name ||
      !form.register_number ||
      !form.new_pin ||
      !form.confirm_pin
    ) {
      setMessage("Please complete all fields.");
      setMessageType("error");
      return;
    }

    if (form.new_pin !== form.confirm_pin) {
      setMessage("PINs do not match.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/resident-recover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: form.first_name,
        last_name: form.last_name,
        register_number: form.register_number,
        new_pin: form.new_pin,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setMessage(result.error || "Unable to reset PIN.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setMessage("PIN updated successfully. You can now sign in.");
    setMessageType("success");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#1e3a5f] px-8 py-4 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="text-2xl font-extrabold text-white">RLC</div>
          <div className="text-sm font-medium text-blue-100">
            Resident PIN Recovery
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-xl bg-white p-10 shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-[#1e3a5f]">
            Reset PIN
          </h1>

          <p className="mb-8 text-gray-500">
            Enter your information and choose a new PIN.
          </p>

          <div className="space-y-5">
            <input
              placeholder="First Name"
              value={form.first_name}
              onChange={(e) =>
                setForm({ ...form, first_name: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-black"
            />

            <input
              placeholder="Last Name"
              value={form.last_name}
              onChange={(e) =>
                setForm({ ...form, last_name: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-black"
            />

            <input
              placeholder="Register Number"
              value={form.register_number}
              onChange={(e) =>
                setForm({ ...form, register_number: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-black"
            />

            <input
              type="password"
              placeholder="New PIN"
              value={form.new_pin}
              onChange={(e) =>
                setForm({ ...form, new_pin: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-black"
            />

            <input
              type="password"
              placeholder="Confirm New PIN"
              value={form.confirm_pin}
              onChange={(e) =>
                setForm({ ...form, confirm_pin: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-black"
            />

            <button
              onClick={handleRecover}
              disabled={loading}
              className="w-full rounded-md bg-[#378add] px-4 py-3 font-bold text-white disabled:opacity-60"
            >
              {loading ? "Updating..." : "Reset PIN"}
            </button>

            <button
              onClick={() => router.push("/")}
              className="w-full rounded-md border border-gray-300 px-4 py-3 font-semibold text-[#1e3a5f]"
            >
              Back to Home
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
      </div>
    </main>
  );
}