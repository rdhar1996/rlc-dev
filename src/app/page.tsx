"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const tier1Courses = [
  { title: "Employment Readiness", hours: 30 },
  { title: "Substance Abuse Prevention", hours: 30 },
  { title: "Prosocial Attitudes", hours: 25 },
  { title: "Housing Stability", hours: 25 },
  { title: "Mental Health & Trauma", hours: 30 },
  { title: "Legal Literacy & ID", hours: 25 },
  { title: "Financial Fundamentals", hours: 25 },
  { title: "Behavioral Health Basics", hours: 25 },
  { title: "Criminal Thinking Patterns", hours: 25 },
  { title: "Family & Parenting", hours: 25 },
];

const tier2Courses = [
  { title: "Advanced Employment", hours: 40 },
  { title: "Active Recovery", hours: 40 },
  { title: "Building Relationships", hours: 35 },
  { title: "Independent Housing", hours: 35 },
  { title: "Mental Health Daily", hours: 40 },
  { title: "Legal Matters", hours: 35 },
  { title: "Banking & Credit", hours: 35 },
  { title: "Hard Decisions", hours: 35 },
  { title: "Rebuilding Life", hours: 35 },
  { title: "Active Parenting", hours: 35 },
];

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

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7c] px-8 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#FAC775]">
            From Custody to Community
          </div>

          <h1 className="mb-4 text-5xl font-bold leading-tight">
            Your path to success starts here
          </h1>

          <p className="mx-auto mb-10 max-w-3xl text-lg text-blue-100">
            Build skills today, access resources for life.
          </p>

          {/* Centered Sign In Form */}
          <div className="mx-auto max-w-lg rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <div className="mb-3 grid gap-3 md:grid-cols-2">
              <div className="text-left">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-blue-100">
                  Federal Register #
                </label>
                <input
                  type="text"
                  placeholder="e.g., 65791-056"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-white/20 px-4 py-3 text-white placeholder:text-white/70 outline-none focus:border-white/60"
                />
              </div>

              <div className="text-left">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-blue-100">
                  PIN ID
                </label>
                <input
                  type="password"
                  placeholder="4 digits"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full rounded-lg border border-white/30 bg-white/20 px-4 py-3 text-white placeholder:text-white/70 outline-none focus:border-white/60"
                />
              </div>
            </div>

            <button
              onClick={handleResidentLogin}
              disabled={loading}
              className="w-full rounded-lg bg-[#378add] px-4 py-3 font-bold text-white hover:bg-[#2d75c4] disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="mt-3 flex items-center justify-between text-sm">
              <Link
                href="/resident-recover"
                className="font-medium text-blue-100 hover:underline"
              >
                Forgot PIN?
              </Link>
              <Link
                href="/register"
                className="font-semibold text-[#FAC775] hover:underline"
              >
                New here? Register →
              </Link>
            </div>

            {message ? (
              <div className="mt-3 rounded-md bg-red-50 px-4 py-2 text-left text-sm font-medium text-red-700">
                {message}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Stats Strip - unchanged */}
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

      {/* Learn What Matters - manual scroll columns with single arrow */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-14 text-center text-5xl font-semibold text-[#1e3a5f]">
            Learn What Matters
          </h2>

          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
            {/* Tier 1 column */}
            <div>
              <div className="mb-4 border-b-2 border-[#d85a30] pb-3 text-center text-xl font-bold tracking-wider text-[#1e3a5f]">
                TIER 1 · FOUNDATIONAL
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto pr-2" style={{ height: "480px" }}>
                {tier1Courses.map((course, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex-shrink-0"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#fff1eb]">
                      <div className="h-2 w-2 rounded-full bg-[#d85a30]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#1e3a5f]">{course.title}</div>
                      <div className="text-xs font-semibold text-[#d85a30]">{course.hours} hrs</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-center text-xs text-gray-400">
                Scroll to see all {tier1Courses.length} courses
              </div>
            </div>

            {/* Single arrow in the middle */}
            <div className="flex items-center justify-center px-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d85a30] shadow-lg">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>

            {/* Tier 2 column */}
            <div>
              <div className="mb-4 border-b-2 border-[#0f6e56] pb-3 text-center text-xl font-bold tracking-wider text-[#0f6e56]">
                TIER 2 · ADVANCED
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto pr-2" style={{ height: "480px" }}>
                {tier2Courses.map((course, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-[#7ecce5] bg-gradient-to-br from-[#c7e9f5] to-[#a8ddf1] p-4 shadow-sm flex-shrink-0"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/60">
                      <div className="h-2 w-2 rounded-full bg-[#0f6e56]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#1e3a5f]">{course.title}</div>
                      <div className="text-xs font-semibold text-[#0f6e56]">{course.hours} hrs</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-center text-xs text-gray-400">
                Scroll to see all {tier2Courses.length} courses
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing band */}
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
