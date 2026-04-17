"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

type Block = {
  id: number;
  block_type: string;
  content: string;
  prompt: string | null;
  display_order: number;
  saved_response: string | null;
};

type LessonData = {
  lesson: { id: number; lesson_number: number; title: string; estimated_minutes: number };
  section: { id: number; course_id: number; section_number: number; title: string };
  course: { id: number; course_title: string };
  blocks: Block[];
  total_lessons: number;
  current_index: number;
  prev_lesson: { id: number; title: string } | null;
  next_lesson: { id: number; title: string } | null;
  status: string;
};

export default function LessonViewerPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LessonData | null>(null);
  const [worksheetValues, setWorksheetValues] = useState<Record<number, string>>({});
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saveTimers, setSaveTimers] = useState<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/lesson-data?lessonId=${lessonId}`);
      const result = await res.json();
      if (!res.ok) {
        router.push(`/course/${courseId}`);
        return;
      }
      setData(result);
      setCompleted(result.status === "completed");

      // Load saved worksheet responses
      const saved: Record<number, string> = {};
      result.blocks.forEach((block: Block) => {
        if (block.block_type === "worksheet" && block.saved_response) {
          saved[block.id] = block.saved_response;
        }
      });
      setWorksheetValues(saved);
      setLoading(false);
      window.scrollTo(0, 0);
    }
    load();
  }, [lessonId, courseId, router]);

  const saveWorksheet = useCallback(
    (blockId: number, value: string) => {
      // Clear existing timer
      if (saveTimers[blockId]) clearTimeout(saveTimers[blockId]);

      // Set new timer for auto-save after 1 second of no typing
      const timer = setTimeout(async () => {
        await fetch("/api/worksheet-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lesson_block_id: blockId, response_text: value }),
        });
      }, 1000);

      setSaveTimers((prev) => ({ ...prev, [blockId]: timer }));
    },
    [saveTimers]
  );

  const handleWorksheetChange = (blockId: number, value: string) => {
    setWorksheetValues((prev) => ({ ...prev, [blockId]: value }));
    saveWorksheet(blockId, value);
  };

  const handleComplete = async () => {
    if (!data) return;
    setCompleting(true);

    await fetch("/api/lesson-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lesson_id: data.lesson.id,
        course_id: data.section.course_id,
      }),
    });

    setCompleted(true);
    setCompleting(false);

    // Auto-navigate to next lesson after a brief pause
    if (data.next_lesson) {
      setTimeout(() => {
        router.push(`/course/${courseId}/lesson/${data.next_lesson!.id}`);
      }, 1200);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="text-lg font-semibold text-[#1e3a5f]">Loading lesson...</div>
      </main>
    );
  }

  if (!data) return null;

  const progressPercent = data.total_lessons > 0
    ? Math.round(((data.current_index + (completed ? 1 : 0)) / data.total_lessons) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#1e3a5f] px-8 py-4 shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white">RLC</div>
          </div>
          <button
            onClick={() => router.push(`/course/${courseId}`)}
            className="rounded-md bg-[#378add] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Course
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <span>{data.course.course_title}</span>
          <span className="text-gray-300">›</span>
          <span>Section {data.section.section_number}</span>
          <span className="text-gray-300">›</span>
          <span className="font-medium text-[#1e3a5f]">
            Lesson {data.current_index + 1} of {data.total_lessons}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-1.5 rounded-full bg-gray-200">
          <div
            className="h-1.5 rounded-full bg-[#BA7517] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Lesson title */}
        <h1 className="mb-2 text-3xl font-bold text-[#1e3a5f]">
          {data.lesson.title}
        </h1>
        <p className="mb-8 text-sm text-gray-400">
          About {data.lesson.estimated_minutes} minutes
        </p>

        {/* Lesson blocks */}
        <div className="space-y-5">
          {data.blocks.map((block) => (
            <LessonBlock
              key={block.id}
              block={block}
              worksheetValue={worksheetValues[block.id] || ""}
              onWorksheetChange={handleWorksheetChange}
            />
          ))}
        </div>

        {/* Mark Complete + Navigation */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          {!completed ? (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="mb-8 w-full rounded-md bg-[#BA7517] py-4 text-lg font-bold text-white disabled:opacity-60"
            >
              {completing ? "Saving..." : "Mark Complete"}
            </button>
          ) : (
            <div className="mb-8 rounded-lg bg-[#ecfdf5] px-6 py-4 text-center text-lg font-bold text-[#0f6e56]">
              ✓ Lesson Complete
            </div>
          )}

          <div className="flex items-center justify-between">
            {data.prev_lesson ? (
              <button
                onClick={() => router.push(`/course/${courseId}/lesson/${data.prev_lesson!.id}`)}
                className="flex items-center gap-2 rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-[#1e3a5f]"
              >
                ← Previous
              </button>
            ) : (
              <div />
            )}

            <span className="text-sm text-gray-400">
              Lesson {data.current_index + 1} of {data.total_lessons}
            </span>

            {data.next_lesson ? (
              <button
                onClick={() => router.push(`/course/${courseId}/lesson/${data.next_lesson!.id}`)}
                className="flex items-center gap-2 rounded-md bg-[#BA7517] px-5 py-3 text-sm font-bold text-white"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => router.push(`/course/${courseId}`)}
                className="flex items-center gap-2 rounded-md bg-[#0f6e56] px-5 py-3 text-sm font-bold text-white"
              >
                Back to Course
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function LessonBlock({
  block,
  worksheetValue,
  onWorksheetChange,
}: {
  block: Block;
  worksheetValue: string;
  onWorksheetChange: (blockId: number, value: string) => void;
}) {
  switch (block.block_type) {
    case "paragraph":
      return (
        <p className="text-lg leading-8 text-gray-800">{block.content}</p>
      );

    case "heading":
      return (
        <h3 className="mt-4 text-xl font-bold text-[#1e3a5f]">{block.content}</h3>
      );

    case "key_point":
      return (
        <div className="rounded-none border-l-4 border-[#BA7517] bg-[#FAEEDA] px-6 py-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#633806]">
            Key Point
          </div>
          <p className="text-base leading-7 text-[#412402]">{block.content}</p>
        </div>
      );

    case "did_you_know":
      return (
        <div className="rounded-lg bg-[#E6F1FB] px-6 py-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0C447C]">
            Did You Know?
          </div>
          <p className="text-base leading-7 text-[#042C53]">{block.content}</p>
        </div>
      );

    case "story":
      return (
        <div className="rounded-lg bg-gray-50 px-6 py-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            A Story
          </div>
          {block.content.split("\n\n").map((paragraph, i) => (
            <p key={i} className={`text-base leading-7 text-gray-700 ${i > 0 ? "mt-3" : ""}`}>
              {paragraph}
            </p>
          ))}
        </div>
      );

    case "think_about_it":
      return (
        <div className="rounded-lg bg-[#EEEDFE] px-6 py-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#3C3489]">
            Think About It
          </div>
          <p className="text-base leading-7 text-[#26215C]">{block.content}</p>
        </div>
      );

    case "worksheet":
      return (
        <div className="rounded-lg border-2 border-[#EF9F27] bg-white px-6 py-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAEEDA] text-sm text-[#854F0B]">
              ✎
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#854F0B]">
              Worksheet Activity
            </div>
          </div>
          <p className="mb-2 text-base font-medium text-[#1e3a5f]">{block.content}</p>
          {block.prompt ? (
            block.prompt.split("\n").map((promptLine, i) => (
              <p key={i} className="mb-1 text-sm text-gray-500">{promptLine}</p>
            ))
          ) : null}
          <textarea
            value={worksheetValue}
            onChange={(e) => onWorksheetChange(block.id, e.target.value)}
            placeholder="Type your answer here..."
            className="mt-3 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 placeholder-gray-400 outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]"
            rows={4}
          />
          <p className="mt-2 text-xs text-gray-400">Your answer saves automatically</p>
        </div>
      );

    case "quick_check":
      return (
        <div className="rounded-lg bg-[#E1F5EE] px-6 py-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#085041]">
            Quick Check
          </div>
          {block.content.split("\n").map((line, i) => (
            <p key={i} className="text-base leading-7 text-[#04342C]">{line}</p>
          ))}
        </div>
      );

    default:
      return (
        <p className="text-lg leading-8 text-gray-800">{block.content}</p>
      );
  }
}
