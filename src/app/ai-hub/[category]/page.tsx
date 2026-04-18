"use client";

import Link from "next/link";

import { useRouter, useParams } from "next/navigation";

type Tool = {
  slug: string;
  name: string;
  description: string;
  icon: React.ReactNode;
};

type Category = {
  slug: string;
  name: string;
  description: string;
  icon_bg: string;
  icon_stroke: string;
  icon: React.ReactNode;
  tools: Tool[];
};

const categories: Record<string, Category> = {
  "job-career": {
    slug: "job-career",
    name: "Job & career",
    description: "Tools to help you land and prepare for work.",
    icon_bg: "#FAEEDA",
    icon_stroke: "#854F0B",
    icon: (
      <>
        <path d="M20 7h-3V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </>
    ),
    tools: [
      {
        slug: "resume",
        name: "Resume builder",
        description: "Turn your experience into a clean resume.",
        icon: (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="14" y2="17" />
          </>
        ),
      },
      {
        slug: "cover-letter",
        name: "Cover letter",
        description: "Write a letter for any job you apply to.",
        icon: (
          <>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22 6 12 13 2 6" />
          </>
        ),
      },
      {
        slug: "mock-interview",
        name: "Mock interview",
        description: "Practice answering real interview questions.",
        icon: (
          <>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </>
        ),
      },
      {
        slug: "job-decoder",
        name: "Job posting decoder",
        description: "Know what a job posting is really asking for.",
        icon: (
          <>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </>
        ),
      },
    ],
  },
  "money-benefits": {
    slug: "money-benefits",
    name: "Money & benefits",
    description: "Tools to help you manage money.",
    icon_bg: "#E1F5EE",
    icon_stroke: "#085041",
    icon: (
      <>
        <rect x="2" y="6" width="20" height="13" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </>
    ),
    tools: [
      {
        slug: "budget",
        name: "Budget helper",
        description: "Make a budget that works for you.",
        icon: (
          <>
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </>
        ),
      },
      {
        slug: "paystub-explainer",
        name: "Paystub explainer",
        description: "Understand your paystub or tax forms.",
        icon: (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </>
        ),
      },
    ],
  },
  "housing": {
    slug: "housing",
    name: "Housing",
    description: "Tools to help you find and keep a place to live.",
    icon_bg: "#EEEDFE",
    icon_stroke: "#3C3489",
    icon: (
      <>
        <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
    tools: [
      {
        slug: "housing-plan",
        name: "Housing plan builder",
        description: "Plan for where you&rsquo;ll live after.",
        icon: (
          <>
            <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </>
        ),
      },
      {
        slug: "lease-explainer",
        name: "Lease explainer",
        description: "Understand any lease or rental document.",
        icon: (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </>
        ),
      },
    ],
  },
  "life-navigation": {
    slug: "life-navigation",
    name: "Life navigation",
    description: "Everyday tools for everyday challenges.",
    icon_bg: "#FAECE7",
    icon_stroke: "#712B13",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </>
    ),
    tools: [
      {
        slug: "hard-conversations",
        name: "Hard conversation practice",
        description: "Practice tough talks before you have them.",
        icon: (
          <>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </>
        ),
      },
      {
        slug: "explain-document",
        name: "Explain this document",
        description: "Paste any document and we&rsquo;ll explain it.",
        icon: (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </>
        ),
      },
      {
        slug: "find-help",
        name: "Find help near me",
        description: "Find resources in your zip code.",
        icon: (
          <>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </>
        ),
      },
      {
        slug: "id-helper",
        name: "ID & documents helper",
        description: "Learn how to get your ID in any state.",
        icon: (
          <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="9" cy="10" r="2" />
            <line x1="14" y1="10" x2="18" y2="10" />
          </>
        ),
      },
      {
        slug: "translate",
        name: "Translate document",
        description: "Translate any document into any language.",
        icon: (
          <>
            <path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
          </>
        ),
      },
    ],
  },
};

export default function AIHubCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categorySlug = params.category as string;

  const category = categories[categorySlug];

  if (!category) {
    if (typeof window !== "undefined") router.push("/ai-hub");
    return null;
  }

  const handleToolClick = (toolName: string) => {
    alert(`"${toolName}" is coming soon! We're building this tool now.`);
  };

  return (
    <main className="min-h-screen" style={{ background: "#F5F3EE" }}>
      <header className="bg-[#1e3a5f] px-8 py-4" style={{ boxShadow: "0 4px 16px rgba(30,58,95,0.2)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <Link href="/resident-dashboard" className="cursor-pointer hover:opacity-80 transition-opacity"><div className="text-2xl font-extrabold text-white">RLC</div></Link>
            <div className="text-sm text-blue-100">AI Hub Center</div>
          </div>
          <button
            onClick={() => router.push("/ai-hub")}
            className="rounded-lg bg-[#378add] px-5 py-2 text-sm font-semibold text-white"
          >
            Back to AI Hub
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-2 text-xs text-[#888780]">
          <button onClick={() => router.push("/resident-dashboard")} className="text-[#BA7517] hover:underline">
            Dashboard
          </button>
          {" \u203a "}
          <button onClick={() => router.push("/ai-hub")} className="text-[#BA7517] hover:underline">
            AI Hub Center
          </button>
          {" \u203a "}
          {category.name}
        </div>

        <div className="mb-2 flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: category.icon_bg }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={category.icon_stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {category.icon}
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1e3a5f]">{category.name}</h1>
            <p className="text-sm text-[#888780]">{category.description}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {category.tools.map((tool) => (
            <button
              key={tool.slug}
              onClick={() => handleToolClick(tool.name)}
              className="rounded-2xl bg-white p-5 text-left"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "0.5px solid #EAE7E0" }}
            >
              <div className="mb-3 flex gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: category.icon_bg }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={category.icon_stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    {tool.icon}
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#1e3a5f]">{tool.name}</div>
                  <div className="mt-0.5 text-xs text-[#888780]">{tool.description}</div>
                </div>
              </div>
              <div className="inline-block rounded-lg bg-[#F1EFE8] px-2 py-1 text-[10px] font-medium text-[#888780]">
                Coming soon
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
