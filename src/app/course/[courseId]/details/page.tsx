"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Section = {
  section_number: number;
  title: string;
  lesson_count: number;
};

type CourseDetails = {
  course: {
    id: number;
    course_title: string;
    tier: string;
    short_description: string;
    estimated_hours: number;
  };
  sections: Section[];
  total_lessons: number;
  enrollment_status: "completed" | "in_progress" | "enrolled" | "not_enrolled";
};

export default function CourseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CourseDetails | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/course-details?courseId=${courseId}`);
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

  const handleEnroll = async () => {
    if (!data) return;
    setEnrolling(true);
    const res = await fetch("/api/resident-enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: data.course.id }),
    });
    if (res.ok) {
      router.push(`/course/${data.course.id}`);
    }
    setEnrolling(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: "#F5F3EE" }}>
        <div className="text-lg font-semibold text-[#1e3a5f]">Loading course...</div>
      </main>
    );
  }

  if (!data) return null;

  const { course, sections, total_lessons, enrollment_status } = data;

  let primaryButtonText = "Enroll in this course";
  let primaryAction: () => void = handleEnroll;
  if (enrollment_status === "in_progress") {
    primaryButtonText = "Continue";
    primaryAction = () => router.push(`/course/${course.id}`);
  } else if (enrollment_status === "enrolled") {
    primaryButtonText = "Start learning";
    primaryAction = () => router.push(`/course/${course.id}`);
  } else if (enrollment_status === "completed") {
    primaryButtonText = "Review course";
    primaryAction = () => router.push(`/course/${course.id}`);
  }

  return (
    <main className="min-h-screen" style={{ background: "#F5F3EE" }}>
      <header className="bg-[#1e3a5f] px-8 py-4" style={{ boxShadow: "0 4px 16px rgba(30,58,95,0.2)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white">RLC</div>
            <div className="text-sm text-blue-100">Course Details</div>
          </div>
          <button
            onClick={() => router.push("/resident-dashboard")}
            className="rounded-lg bg-[#378add] px-5 py-2 text-sm font-semibold text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-8 py-10">
        <div
          className="rounded-2xl bg-white overflow-hidden"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
        >
          <div className="bg-[#1e3a5f] px-10 py-8">
            <div className="mb-2 text-xs font-medium tracking-widest text-[#FAC775]">
              {course.tier.toUpperCase()} COURSE
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">{course.course_title}</h1>
            <p className="text-base text-blue-200">{course.short_description}</p>
          </div>

          <div className="px-10 py-8">
            <div className="mb-6 grid grid-cols-4 gap-3">
              <div className="rounded-xl bg-[#FAFAF8] p-4">
                <div className="text-2xl font-bold text-[#1e3a5f]">{course.estimated_hours}</div>
                <div className="mt-1 text-xs text-[#888780]">Hours</div>
              </div>
              <div className="rounded-xl bg-[#FAFAF8] p-4">
                <div className="text-2xl font-bold text-[#1e3a5f]">{total_lessons}</div>
                <div className="mt-1 text-xs text-[#888780]">Lessons</div>
              </div>
              <div className="rounded-xl bg-[#FAFAF8] p-4">
                <div className="text-2xl font-bold text-[#1e3a5f]">{sections.length}</div>
                <div className="mt-1 text-xs text-[#888780]">Sections</div>
              </div>
              <div className="rounded-xl bg-[#FAFAF8] p-4">
                <div className="text-2xl font-bold text-[#1e3a5f]">Yes</div>
                <div className="mt-1 text-xs text-[#888780]">Certificate</div>
              </div>
            </div>

            <h2 className="mb-4 text-lg font-bold text-[#1e3a5f]">What you&rsquo;ll learn</h2>
            <div className="mb-8 space-y-3">
              {sections.map((s) => (
                <div key={s.section_number} className="flex items-start gap-3">
                  <span className="mt-0.5 text-base font-bold text-[#BA7517]">{s.section_number}.</span>
                  <div>
                    <div className="text-base font-medium text-[#1e3a5f]">{s.title}</div>
                    <div className="text-xs text-[#888780]">{s.lesson_count} lessons</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={primaryAction}
              disabled={enrolling}
              className="w-full rounded-xl py-4 text-lg font-bold text-white disabled:opacity-60"
              style={{ background: "#BA7517", boxShadow: "0 4px 12px rgba(186,117,23,0.3)" }}
            >
              {enrolling ? "Enrolling..." : primaryButtonText}
            </button>

            <div className="mt-3 text-center text-xs text-[#B4B2A9]">
              Free &middot; Start and stop anytime &middot; Go at your own pace
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
