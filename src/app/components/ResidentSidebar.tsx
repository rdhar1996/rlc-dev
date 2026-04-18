"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SidebarCourse = {
  id: number;
  course_title: string;
  tier: string;
  status: "completed" | "in_progress" | "enrolled" | "not_enrolled";
};

export default function ResidentSidebar() {
  const [courses, setCourses] = useState<SidebarCourse[]>([]);
  const [tier1Open, setTier1Open] = useState(true);
  const [tier2Open, setTier2Open] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/sidebar-courses");
      const data = await res.json();
      if (res.ok) setCourses(data.courses || []);
    }
    load();
  }, []);

  const tier1 = courses.filter((c) => c.tier === "Tier 1");
  const tier2 = courses.filter((c) => c.tier === "Tier 2");

  return (
    <div className="w-[220px] flex-shrink-0 rounded-2xl bg-white p-3 shadow-sm h-fit">
      <div className="px-2 mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        Courses
      </div>

      <button
        onClick={() => setTier1Open(!tier1Open)}
        className="flex w-full items-center gap-2 rounded-r-lg border-l-[3px] border-[#BA7517] bg-[#FFF8F0] px-3 py-2 text-left"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="3" style={{ transform: tier1Open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span className="flex-1 text-[13px] font-medium text-[#633806]">Tier 1</span>
        <span className="text-[10px] text-gray-500">{tier1.length}</span>
      </button>

      {tier1Open ? (
        <div className="mt-1 mb-3 pl-3 grid gap-0.5">
          {tier1.map((c) => {
            const isCompleted = c.status === "completed";
            const isInProgress = c.status === "in_progress";
            return (
              <Link
                key={c.id}
                href={`/course/${c.id}/details`}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] ${
                  isCompleted ? "bg-[#E1F5EE] text-[#085041]" :
                  isInProgress ? "bg-[#FAEEDA] text-[#633806]" :
                  "text-[#5F5E5A] hover:bg-gray-50"
                }`}
              >
                {isCompleted ? <span>&#10003;</span> : isInProgress ? <span>&bull;</span> : null}
                <span className="truncate">{c.course_title}</span>
              </Link>
            );
          })}
        </div>
      ) : null}

      <button
        onClick={() => setTier2Open(!tier2Open)}
        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-gray-50"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888780" strokeWidth="3" style={{ transform: tier2Open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span className="flex-1 text-[13px] text-[#5F5E5A]">Tier 2</span>
        <span className="text-[10px] text-[#B4B2A9]">Soon</span>
      </button>

      {tier2Open ? (
        <div className="mt-1 pl-3 text-[11px] text-[#B4B2A9] px-2">
          Coming soon
        </div>
      ) : null}

      <div className="mt-4 px-2 pb-1 text-[10px] text-[#B4B2A9] leading-relaxed">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[#0F6E56]">&#10003;</span>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#BA7517]">&bull;</span>
          <span>In progress</span>
        </div>
      </div>
    </div>
  );
}
