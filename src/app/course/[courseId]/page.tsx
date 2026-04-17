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
      <main className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="text-lg font-semibold text-[#1e3a5f]">Loading course...</div>
      </main>
    );
  }

  if (!data) return null;

  const percent = data.progress.progress_percent || 0;

  // Find the first incomplete lesson for "Continue" button
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
    <main className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#1e3a5f] px-8 py-4 shadow-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white">RLC</div>
            <div className="text-sm text-blue-100">Course Overview</div>
          </div>
          <button
            onClick={() => router.push("/resident-dashboard")}
            className="rounded-md bg-[#378add] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-8 py-10">
        {/* Course header */}
        <div className="mb-2 text-sm font-medium text-[#BA7517]">{data.course.tier}</div>
        <h1 className="mb-3 text-4xl font-bold text-[#1e3a5f]">{data.course.course_title}</h1>
        <p className="mb-6 text-lg text-gray-600">{data.course.short_description}</p>

        <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
          <span>{data.completed_lessons} of {data.total_lessons} lessons done</span>
          <span>{percent}%</span>
        </div>
        <div className="mb-8 h-3 rounded-full bg-gray-200">
          <div
            className="h-3 rounded-full bg-[#BA7517] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Continue / Start / Quiz button */}
        <div className="mb-10">
          {allComplete ? (
            <Link
              href={`/course/${courseId}/quiz`}
              className="inline-block rounded-md bg-[#0f6e56] px-8 py-4 text-lg font-bold text-white"
            >
              Take the Quiz
            </Link>
          ) : continueLesson ? (
            <Link
              href={`/course/${courseId}/lesson/${continueLesson.id}`}
              className="inline-block rounded-md bg-[#BA7517] px-8 py-4 text-lg font-bold text-white"
            >
              {percent > 0 ? "Continue Learning" : "Start Learning"}
            </Link>
          ) : null}
        </div>

        {/* Sections and lessons */}
        <div className="space-y-6">
          {data.sections.map((section) => (
            <div key={section.id} className="rounded-xl bg-white p-6 shadow">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#1e3a5f]">
                  Section {section.section_number}: {section.title}
                </h2>
                <span className="text-sm text-gray-500">
                  {section.completed_count}/{section.total_count}
                </span>
              </div>

              <div className="mb-4 h-1.5 rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-[#0f6e56]"
                  style={{
                    width: section.total_count > 0
                      ? `${(section.completed_count / section.total_count) * 100}%`
                      : "0%",
                  }}
                />
              </div>

              <div className="space-y-2">
                {section.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/course/${courseId}/lesson/${lesson.id}`}
                    className="flex items-center gap-4 rounded-lg border border-gray-100 px-4 py-3 transition hover:bg-gray-50"
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {lesson.status === "completed" ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f6e56] text-white text-sm">
                          ✓
                        </div>
                      ) : lesson.status === "in_progress" ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#BA7517] text-sm text-[#BA7517]">
                          ●
                        </div>
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-300 text-sm text-gray-300">
                          ○
                        </div>
                      )}
                    </div>

                    {/* Lesson info */}
                    <div className="flex-1">
                      <div className="font-medium text-[#1e3a5f]">
                        Lesson {lesson.lesson_number}: {lesson.title}
                      </div>
                      <div className="text-sm text-gray-400">
                        About {lesson.estimated_minutes} min
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="text-gray-300">→</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quiz section at bottom */}
        {allComplete ? (
          <div className="mt-8 rounded-xl border-2 border-[#0f6e56] bg-[#f7fffb] p-8 text-center">
            <div className="mb-2 text-2xl font-bold text-[#0f6e56]">
              All lessons complete!
            </div>
            <p className="mb-6 text-gray-600">
              You finished all {data.total_lessons} lessons. Take the quiz to finish the course.
            </p>
            <Link
              href={`/course/${courseId}/quiz`}
              className="inline-block rounded-md bg-[#0f6e56] px-8 py-4 text-lg font-bold text-white"
            >
              Take the Quiz
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
