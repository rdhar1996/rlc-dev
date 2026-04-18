"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const categories = [
  {
    slug: "job-career",
    name: "Job & career",
    description: "Resume, cover letter, interview practice, and job posting help.",
    tool_count: 4,
    icon_bg: "#FAEEDA",
    icon_stroke: "#854F0B",
    badge_color: "#BA7517",
    icon: (
      <>
        <path d="M20 7h-3V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="16" x2="13" y2="16" />
      </>
    ),
  },
  {
    slug: "money-benefits",
    name: "Money & benefits",
    description: "Build a budget and understand paystubs or tax forms.",
    tool_count: 2,
    icon_bg: "#E1F5EE",
    icon_stroke: "#085041",
    badge_color: "#0F6E56",
    icon: (
      <>
        <rect x="2" y="6" width="20" height="13" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <circle cx="18" cy="15" r="1.5" />
      </>
    ),
  },
  {
    slug: "housing",
    name: "Housing",
    description: "Plan for a place to live and understand your lease.",
    tool_count: 2,
    icon_bg: "#EEEDFE",
    icon_stroke: "#3C3489",
    badge_color: "#3C3489",
    icon: (
      <>
        <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
  },
  {
    slug: "life-navigation",
    name: "Life navigation",
    description: "Translate documents, practice hard talks, find resources.",
    tool_count: 5,
    icon_bg: "#FAECE7",
    icon_stroke: "#712B13",
    badge_color: "#712B13",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
  },
];

export default function AIHubPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const res = await fetch("/api/resident-dashboard");
      const data = await res.json();
      if (!res.ok || data.is_inmate) {
        router.push("/resident-dashboard");
        return;
      }
      setChecking(false);
    }
    checkAccess();
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: "#F5F3EE" }}>
        <div className="text-lg font-semibold text-[#1e3a5f]">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "#F5F3EE" }}>
      <header className="bg-[#1e3a5f] px-8 py-4" style={{ boxShadow: "0 4px 16px rgba(30,58,95,0.2)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <Link href="/resident-dashboard" className="cursor-pointer hover:opacity-80 transition-opacity"><div className="text-2xl font-extrabold text-white">RLC</div></Link>
            <div className="text-sm text-blue-100">AI Hub Center</div>
          </div>
          <button
            onClick={() => router.push("/resident-dashboard")}
            className="rounded-lg bg-[#378add] px-5 py-2 text-sm font-semibold text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#1e3a5f]">AI Hub Center</h1>
          <div className="rounded-full bg-[#FAEEDA] px-4 py-1.5 text-sm font-medium text-[#854F0B]">
            0 of 20 used today
          </div>
        </div>
        <p className="mb-8 text-base text-[#888780]">
          Tools to help you with real life tasks. Pick a category to start.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => router.push(`/ai-hub/${cat.slug}`)}
              className="rounded-2xl bg-white p-6 text-left"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "0.5px solid #EAE7E0" }}
            >
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: cat.icon_bg }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={cat.icon_stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  {cat.icon}
                </svg>
              </div>
              <div className="mb-1 text-lg font-bold text-[#1e3a5f]">{cat.name}</div>
              <div className="mb-3 text-sm text-[#888780]">{cat.description}</div>
              <div className="text-xs font-medium" style={{ color: cat.badge_color }}>
                {cat.tool_count} tools &rarr;
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
