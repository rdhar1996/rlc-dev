"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Lesson = {
  id: number;
  lesson_number: number;
  title: string;
  estimated_minutes: number;
  status: string;
};

type Section = {
  id: number;
  section_number: number;
  title: string;
  lessons: Lesson[];
  completed_count: number;
  total_count: number;
};

type CourseData = {
  course: {
    id: number;
    course_title: string;
    tier: string;
    short_description: string;
    estimated_hours: number;
  };
  sections: Section[];
  total_lessons: number;
  completed_lessons: number;
  progress: { progress_percent: number; progress_status: string };
};

export default function CourseOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CourseData | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/course-data?courseId=${courseId}`);
      const result = await res.json();
      if (!res.ok) {
        router.push("/resident-dashboard");
        return;
      }
      setData(result);
      setLoading(false);
    }
    load();
  }, [courseId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: "#F5F3EE" }}>
        <div className="text-lg font-semibold text-[#1e3a5f]">Loading course...</div>
      </main>
    );
  }

  if (!data) return null;

  const percent = data.progress.progress_percent || 0;

  let continueLesson: Lesson | null = null;
  for (const section of data.sections) {
    for (const lesson of section.lessons) {
      if (lesson.status !== "completed") {
        continueLesson = lesson;
        break;
      }
    }
    if (continueLesson) break;
  }

  const allComplete = data.completed_lessons >= data.total_lessons && data.total_lessons > 0;

  return (
    <main className="min-h-screen" style={{ background: "#F5F3EE" }}>
      {/* Header */}
      <header className="bg-[#1e3a5f] px-8 py-4" style={{ boxShadow: "0 4px 16px rgba(30,58,95,0.2)" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white">RLC</div>
            <div className="text-sm text-blue-100">Course Overview</div>
          </div>
          <button
            onClick={() => router.push("/resident-dashboard")}
            className="rounded-lg bg-[#378add] px-5 py-2 text-sm font-semibold text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-8 py-10">
        {/* Course hero card */}
        <div
          className="mb-6 rounded-2xl bg-[#1e3a5f] p-8"
          style={{ boxShadow: "0 8px 24px rgba(30,58,95,0.25), 0 2px 8px rgba(30,58,95,0.15)" }}
        >
          <div className="mb-2 text-xs font-medium tracking-widest text-[#FAC775]">
            {data.course.tier?.toUpperCase() || "TIER 1"} COURSE
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">{data.course.course_title}</h1>
          <p className="mb-6 text-base text-blue-200">{data.course.short_description}</p>

          <div className="mb-4 flex items-center gap-4">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
              <div
                className="h-2.5 rounded-full"
                style={{
                  width: `${percent}%`,
                  background: "linear-gradient(90deg, #FAC775, #EF9F27)",
                }}
              />
            </div>
            <span className="text-sm font-medium text-[#FAC775]">
              {data.completed_lessons} of {data.total_lessons}
            </span>
          </div>

          {allComplete ? (
            <Link
              href={`/course/${courseId}/quiz`}
              className="mt-2 inline-block rounded-xl bg-[#0f6e56] px-8 py-3.5 text-base font-bold text-white"
              style={{ boxShadow: "0 4px 12px rgba(15,110,86,0.35)" }}
            >
              Take the Quiz
            </Link>
          ) : continueLesson ? (
            <Link
              href={`/course/${courseId}/lesson/${continueLesson.id}`}
              className="mt-2 inline-block rounded-xl bg-[#BA7517] px-8 py-3.5 text-base font-bold text-white"
              style={{ boxShadow: "0 4px 12px rgba(186,117,23,0.35)" }}
            >
              {percent > 0 ? "Continue Learning" : "Start Learning"}
            </Link>
          ) : null}
        </div>

        {/* Stats strip */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          <div
            className="rounded-xl bg-white p-5 text-center"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="text-2xl font-bold text-[#BA7517]">{data.completed_lessons}</div>
            <div className="mt-1 text-xs text-[#888780]">Lessons done</div>
          </div>
          <div
            className="rounded-xl bg-white p-5 text-center"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="text-2xl font-bold text-[#0f6e56]">{percent}%</div>
            <div className="mt-1 text-xs text-[#888780]">Complete</div>
          </div>
          <div
            className="rounded-xl bg-white p-5 text-center"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="text-2xl font-bold text-[#5F5E5A]">{data.course.estimated_hours}</div>
            <div className="mt-1 text-xs text-[#888780]">Hours total</div>
          </div>
        </div>

        {/* Timeline sections */}
        <div className="relative pl-9">
          {/* Vertical line */}
          <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-[#D3D1C7]" />

          {data.sections.map((section) => {
            const isComplete = section.completed_count >= section.total_count && section.total_count > 0;
            const hasCurrentLesson = section.lessons.some((l) => l.id === continueLesson?.id);
            const isInProgress = hasCurrentLesson || (section.completed_count > 0 && !isComplete);
            const isUpcoming = !isComplete && !isInProgress;

            return (
              <div key={section.id} className="relative mb-6">
                {/* Timeline dot */}
                <div
                  className="absolute -left-9 top-1 flex h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    background: isComplete ? "#0F6E56" : isInProgress ? "#BA7517" : "#F5F3EE",
                    border: isUpcoming ? "2px solid #D3D1C7" : "none",
                    boxShadow: isComplete
                      ? "0 2px 6px rgba(15,110,86,0.3)"
                      : isInProgress
                      ? "0 2px 6px rgba(186,117,23,0.3)"
                      : "none",
                  }}
                >
                  {isComplete ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : isInProgress ? (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  ) : null}
                </div>

                {/* Section card */}
                <div
                  className={`rounded-r-2xl bg-white p-6 ${isUpcoming ? "opacity-100" : ""}`}
                  style={{
                    borderLeft: isComplete
                      ? "4px solid #0F6E56"
                      : isInProgress
                      ? "4px solid #BA7517"
                      : "none",
                    borderRadius: isUpcoming ? "16px" : "0 16px 16px 0",
                    boxShadow: isInProgress
                      ? "0 3px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)"
                      : "0 2px 8px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-[#1e3a5f]">
                        Section {section.section_number}: {section.title}
                      </h2>
                      <div className="mt-1 text-xs text-[#888780]">{section.total_count} lessons</div>
                    </div>
                    <span
                      className="rounded-full px-3.5 py-1 text-xs font-medium"
                      style={{
                        background: isComplete ? "#E1F5EE" : isInProgress ? "#FAEEDA" : "#F1EFE8",
                        color: isComplete ? "#085041" : isInProgress ? "#633806" : "#888780",
                      }}
                    >
                      {isComplete
                        ? `${section.completed_count}/${section.total_count} done`
                        : isInProgress
                        ? "In progress"
                        : "Up next"}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {section.lessons.map((lesson) => {
                      const lessonComplete = lesson.status === "completed";
                      const lessonCurrent = !lessonComplete && lesson.id === continueLesson?.id;

                      return (
                        <Link
                          key={lesson.id}
                          href={`/course/${courseId}/lesson/${lesson.id}`}
                          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition hover:brightness-95"
                          style={{
                            background: lessonComplete
                              ? "#F7FFFB"
                              : lessonCurrent
                              ? "#FFF8F0"
                              : "#FAFAF8",
                            border: lessonComplete
                              ? "0.5px solid #9FE1CB"
                              : lessonCurrent
                              ? "1.5px solid #EF9F27"
                              : "none",
                            boxShadow: lessonCurrent ? "0 1px 4px rgba(186,117,23,0.12)" : "none",
                          }}
                        >
                          <div
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                            style={{
                              background: lessonComplete ? "#0F6E56" : lessonCurrent ? "#BA7517" : "transparent",
                              border: !lessonComplete && !lessonCurrent ? "1.5px solid #D3D1C7" : "none",
                            }}
                          >
                            {lessonComplete ? (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                            ) : lessonCurrent ? (
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                            ) : null}
                          </div>

                          <span
                            className="flex-1 text-sm"
                            style={{
                              color: lessonComplete ? "#085041" : lessonCurrent ? "#633806" : "#5F5E5A",
                              fontWeight: lessonCurrent ? 500 : 400,
                            }}
                          >
                            {lesson.title}
                          </span>

                          {lessonCurrent ? (
                            <span className="rounded-full bg-[#FAEEDA] px-2.5 py-0.5 text-[11px] font-medium text-[#854F0B]">
                              Continue
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quiz section - always visible */}
        <div
          className="mt-4 rounded-2xl p-8 text-center"
          style={{
            border: allComplete ? "2px solid #0f6e56" : "2px solid #D3D1C7",
            background: allComplete ? "#F7FFFB" : "#FAFAF8",
            boxShadow: allComplete ? "0 4px 16px rgba(15,110,86,0.1)" : "0 2px 8px rgba(0,0,0,0.04)",
            opacity: allComplete ? 1 : 0.7,
          }}
        >
          <div className={`mb-2 text-2xl font-bold ${allComplete ? "text-[#0f6e56]" : "text-[#B4B2A9]"}`}>
            {allComplete ? "All lessons complete!" : "Course Quiz"}
          </div>
          <p className={`mb-6 ${allComplete ? "text-gray-600" : "text-[#B4B2A9]"}`}>
            {allComplete
              ? `You finished all ${data.total_lessons} lessons. Take the quiz to finish the course.`
              : `Complete all ${data.total_lessons} lessons to unlock the quiz. You need 7 out of 10 to pass.`}
          </p>
          {allComplete ? (
            <Link
              href={`/course/${courseId}/quiz`}
              className="inline-block rounded-xl bg-[#0f6e56] px-8 py-4 text-lg font-bold text-white"
              style={{ boxShadow: "0 4px 12px rgba(15,110,86,0.3)" }}
            >
              Take the Quiz
            </Link>
          ) : (
            <div
              className="inline-block rounded-xl px-8 py-4 text-lg font-bold text-[#B4B2A9] cursor-not-allowed"
              style={{ background: "#E8E6E0" }}
            >
              Quiz Locked — {data.total_lessons - data.completed_lessons} lessons left
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
