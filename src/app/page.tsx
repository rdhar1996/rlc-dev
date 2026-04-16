"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();

  const [registerNumber, setRegisterNumber] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResidentLogin = async () => {
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
    <main className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a]">
      <header className="bg-[#1e3a5f] px-8 py-4 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-extrabold text-white">RLC</div>
            <div className="text-sm font-medium text-blue-100">
              Reentry Learning Center
            </div>
          </div>

          <Link
            href="/staff-login"
            className="rounded-md bg-[#0f6e56] px-5 py-2 text-sm font-semibold text-white"
          >
            Staff Sign In
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7c] px-8 py-20 text-white">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="mb-4 text-5xl font-bold leading-tight">
            Your Path to Success Starts Here
          </h1>

          <p className="mx-auto mb-10 max-w-3xl text-lg text-blue-100">
            Build skills today, access resources for life.
          </p>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[2fr_1fr]">
            <div className="rounded-xl bg-white/15 p-6 backdrop-blur">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-left">
                  <label className="mb-1 block text-sm font-semibold text-white">
                    Federal Register #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 65791-056"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    className="w-full rounded-md border border-white/30 bg-white/20 px-4 py-3 text-white placeholder:text-white/70"
                  />
                </div>

                <div className="text-left">
                  <label className="mb-1 block text-sm font-semibold text-white">
                    PIN ID
                  </label>
                  <input
                    type="password"
                    placeholder="4 digits"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full rounded-md border border-white/30 bg-white/20 px-4 py-3 text-white placeholder:text-white/70"
                  />
                </div>
              </div>

              <button
                onClick={handleResidentLogin}
                disabled={loading}
                className="mt-4 w-full rounded-md bg-[#378add] px-4 py-3 font-bold text-white disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

              <Link
                href="/resident-recover"
                className="mt-3 block text-left text-sm font-medium text-blue-100 hover:underline"
              >
                Forgot PIN?
              </Link>

              {message ? (
                <div className="mt-3 rounded-md bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700">
                  {message}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-center">
              <Link
                href="/register"
                className="rounded-xl bg-[#0f6e56] px-10 py-4 text-lg font-bold text-white shadow-lg"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 grid max-w-6xl gap-6 rounded-xl bg-white p-8 shadow-lg md:grid-cols-4">
        <div className="rounded-lg border-l-4 border-[#1e3a5f] bg-gray-50 p-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">
            Learning Path
          </div>
          <div className="text-4xl font-bold text-[#1e3a5f]">20+</div>
          <div className="text-sm text-gray-500">Modules</div>
        </div>

        <div className="rounded-lg border-l-4 border-[#1e3a5f] bg-gray-50 p-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">
            Total Content
          </div>
          <div className="text-4xl font-bold text-[#1e3a5f]">575+</div>
          <div className="text-sm text-gray-500">Hours of structured learning</div>
        </div>

        <div className="rounded-lg border-l-4 border-[#0f6e56] bg-gray-50 p-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">
            Continuous Support
          </div>
          <div className="text-4xl font-bold text-[#1e3a5f]">ALWAYS</div>
          <div className="text-sm text-gray-500">Learning through reentry</div>
        </div>

        <div className="rounded-lg border-l-4 border-[#d85a30] bg-gray-50 p-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">
            After Release
          </div>
          <div className="text-4xl font-bold text-[#1e3a5f]">FOREVER</div>
          <div className="text-sm text-gray-500">Lifetime access</div>
        </div>
      </section>

      <section className="px-8 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-14 text-center text-5xl font-semibold text-[#1e3a5f]">
            Learn What Matters
          </h2>

          <div className="mb-10 grid gap-8 md:grid-cols-[1fr_auto_1fr]">
            <div className="border-b-2 border-[#d85a30] pb-4 text-2xl font-bold text-[#1e3a5f]">
              TIER 1 - FOUNDATIONAL
            </div>
            <div />
            <div className="border-b-2 border-[#0f6e56] pb-4 text-2xl font-bold text-[#0f6e56]">
              TIER 2 - ADVANCED
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
              <FeatureCard
                title="Employment Readiness"
                hours="40 hrs"
                description="Resume writing, interviews, job search strategies, and skills assessment."
              />
              <ArrowCard />
              <FeatureCard
                title="Advanced Employment"
                hours="60 hrs"
                description="Barrier removal, job specialization, and career development pathways."
                advanced
              />
            </div>

            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
              <FeatureCard
                title="Financial Fundamentals"
                hours="35 hrs"
                description="Budgeting, credit building, and consumer protection essentials."
              />
              <ArrowCard />
              <FeatureCard
                title="Advanced Financial"
                hours="55 hrs"
                description="Credit independence, homeownership preparation, and wealth building."
                advanced
              />
            </div>

            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
              <FeatureCard
                title="Behavioral Health Basics"
                hours="40 hrs"
                description="Mental health awareness, coping skills, and help-seeking resources."
              />
              <ArrowCard />
              <FeatureCard
                title="Advanced Mental Health"
                hours="65 hrs"
                description="Co-occurring disorders, ongoing treatment, and long-term wellness."
                advanced
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7c] px-8 py-16 text-center text-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold">
            One platform. One continuum. Zero Gaps.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-blue-100">
            From enrollment to employment, tracked and supported — for life.
          </p>
        </div>
      </section>

      <footer className="border-t-4 border-[#d85a30] bg-[#1a1a1a] px-8 py-8 text-center text-sm text-[#888780]">
        <div>RLC, Reentry Learning System, LLC.</div>
        <div className="mt-2">© 2026 All rights reserved.</div>
      </footer>
    </main>
  );
}

function FeatureCard({
  title,
  hours,
  description,
  advanced = false,
}: {
  title: string;
  hours: string;
  description: string;
  advanced?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-10 text-center shadow-sm transition ${
        advanced
          ? "border-[#7ecce5] bg-gradient-to-br from-[#c7e9f5] to-[#a8ddf1]"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f6e56] to-[#378add] text-3xl text-white shadow-md">
        {title.toLowerCase().includes("employment")
          ? "💼"
          : title.toLowerCase().includes("financial")
          ? "💰"
          : "🧠"}
      </div>

      <h3 className="mb-3 text-2xl font-bold text-[#1e3a5f]">{title}</h3>
      <div className="mb-3 text-sm font-bold text-[#d85a30]">{hours}</div>
      <p className="text-base leading-7 text-[#888780]">{description}</p>
    </div>
  );
}

function ArrowCard() {
  return (
    <div className="flex h-28 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-[#d85a30] to-[#ff8a50] text-4xl font-bold text-white shadow-md">
      →
    </div>
  );
}