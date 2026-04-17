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
  const [quickCheckAnswers, setQuickCheckAnswers] = useState<Record<string, string>>({});
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

      const saved: Record<number, string> = {};
      result.blocks.forEach((block: Block) => {
        if (block.block_type === "worksheet" && block.saved_response) {
          saved[block.id] = block.saved_response;
        }
      });
      setWorksheetValues(saved);
      setQuickCheckAnswers({});
      setLoading(false);
      window.scrollTo(0, 0);
    }
    load();
  }, [lessonId, courseId, router]);

  const saveWorksheet = useCallback(
    (blockId: number, value: string) => {
      if (saveTimers[blockId]) clearTimeout(saveTimers[blockId]);
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
      body: JSON.stringify({ lesson_id: data.lesson.id, course_id: data.section.course_id }),
    });
    setCompleted(true);
    setCompleting(false);
    if (data.next_lesson) {
      setTimeout(() => {
        router.push(`/course/${courseId}/lesson/${data.next_lesson!.id}`);
      }, 1200);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: "#F5F3EE" }}>
        <div className="text-lg font-semibold text-[#1e3a5f]">Loading lesson...</div>
      </main>
    );
  }

  if (!data) return null;

  const progressPercent = data.total_lessons > 0
    ? Math.round(((data.current_index + (completed ? 1 : 0)) / data.total_lessons) * 100)
    : 0;

  const worksheetBlocks = data.blocks.filter((b) => b.block_type === "worksheet");
  const allWorksheetsFilled = worksheetBlocks.every(
    (b) => (worksheetValues[b.id] || "").trim().length > 0
  );
  const hasWorksheets = worksheetBlocks.length > 0;
  const canComplete = !hasWorksheets || allWorksheetsFilled;

  return (
    <main className="min-h-screen" style={{ background: "#F5F3EE" }}>
      <header className="bg-[#1e3a5f] px-8 py-4" style={{ boxShadow: "0 4px 16px rgba(30,58,95,0.2)" }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-blue-200">
            <span className="font-medium text-[#FAC775]">{data.course.course_title}</span>
            <span className="text-blue-300/50">&rsaquo;</span>
            <span>Section {data.section.section_number}</span>
            <span className="text-blue-300/50">&rsaquo;</span>
            <span className="font-medium text-white">Lesson {data.current_index + 1} of {data.total_lessons}</span>
          </div>
          <button
            onClick={() => router.push(`/course/${courseId}`)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            Back to Course
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-8 py-8">
        <div
          className="rounded-2xl bg-white p-8 md:p-10"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03)" }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EAE7E0]">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${progressPercent}%`, background: "linear-gradient(90deg, #FAC775, #EF9F27)" }}
              />
            </div>
            <span className="text-xs text-[#888780]">{progressPercent}%</span>
          </div>

          <h1 className="mb-1.5 text-3xl font-bold text-[#1e3a5f]">{data.lesson.title}</h1>
          <p className="mb-8 text-sm text-[#B4B2A9]">About {data.lesson.estimated_minutes} minutes</p>

          <div className="space-y-5">
            {data.blocks.map((block) => (
              <LessonBlock
                key={block.id}
                block={block}
                worksheetValue={worksheetValues[block.id] || ""}
                onWorksheetChange={handleWorksheetChange}
                quickCheckAnswers={quickCheckAnswers}
                onQuickCheckAnswer={(qKey, val) =>
                  setQuickCheckAnswers((prev) => ({ ...prev, [qKey]: val }))
                }
              />
            ))}
          </div>

          <div className="mt-10 border-t border-[#EAE7E0] pt-8">
            {!completed ? (
              <>
                {hasWorksheets && !allWorksheetsFilled ? (
                  <div
                    className="mb-3 rounded-lg px-4 py-3 text-center text-sm font-medium text-[#854F0B]"
                    style={{ background: "#FAEEDA" }}
                  >
                    Fill in all the worksheet boxes before marking this lesson complete.
                  </div>
                ) : null}
                <button
                  onClick={handleComplete}
                  disabled={completing || !canComplete}
                  className="mb-6 w-full rounded-xl py-4 text-lg font-bold text-white disabled:cursor-not-allowed"
                  style={{
                    background: canComplete ? "#BA7517" : "#B4B2A9",
                    boxShadow: canComplete ? "0 4px 12px rgba(186,117,23,0.3)" : "none",
                    opacity: canComplete ? 1 : 0.6,
                  }}
                >
                  {completing ? "Saving..." : "Mark Complete"}
                </button>
              </>
            ) : (
              <div
                className="mb-6 rounded-xl px-6 py-4 text-center text-lg font-bold text-[#0f6e56]"
                style={{ background: "#E1F5EE", boxShadow: "0 2px 8px rgba(15,110,86,0.08)" }}
              >
                Lesson Complete
              </div>
            )}

            <div className="flex items-center justify-between">
              {data.prev_lesson ? (
                <button
                  onClick={() => router.push(`/course/${courseId}/lesson/${data.prev_lesson!.id}`)}
                  className="rounded-xl border border-[#D3D1C7] bg-white px-5 py-3 text-sm font-medium text-[#1e3a5f]"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  Previous
                </button>
              ) : (
                <div />
              )}
              <span className="text-sm text-[#B4B2A9]">
                Lesson {data.current_index + 1} of {data.total_lessons}
              </span>
              {data.next_lesson ? (
                <button
                  onClick={() => router.push(`/course/${courseId}/lesson/${data.next_lesson!.id}`)}
                  className="rounded-xl px-6 py-3 text-sm font-bold text-white"
                  style={{ background: "#BA7517", boxShadow: "0 2px 8px rgba(186,117,23,0.25)" }}
                >
                  Next Lesson
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/course/${courseId}`)}
                  className="rounded-xl px-6 py-3 text-sm font-bold text-white"
                  style={{ background: "#0f6e56", boxShadow: "0 2px 8px rgba(15,110,86,0.25)" }}
                >
                  Back to Course
                </button>
              )}
            </div>
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
  quickCheckAnswers,
  onQuickCheckAnswer,
}: {
  block: Block;
  worksheetValue: string;
  onWorksheetChange: (blockId: number, value: string) => void;
  quickCheckAnswers: Record<string, string>;
  onQuickCheckAnswer: (questionKey: string, answer: string) => void;
}) {
  switch (block.block_type) {
    case "paragraph":
      return <p className="text-lg leading-8 text-[#444441]">{block.content}</p>;

    case "heading":
      return <h3 className="mt-4 text-xl font-bold text-[#1e3a5f]">{block.content}</h3>;

    case "key_point":
      return (
        <div
          className="rounded-r-xl border-l-4 border-[#BA7517] bg-[#FAEEDA] px-6 py-5"
          style={{ boxShadow: "0 2px 8px rgba(186,117,23,0.1)" }}
        >
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#854F0B]">Key point</div>
          <p className="text-base leading-7 text-[#412402]">{block.content}</p>
        </div>
      );

    case "did_you_know":
      return (
        <div
          className="rounded-xl border border-[#9FE1CB] bg-[#F7FFFB] px-6 py-5"
          style={{ boxShadow: "0 2px 8px rgba(15,110,86,0.06)" }}
        >
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#085041]">Did you know?</div>
          <p className="text-base leading-7 text-[#04342C]">{block.content}</p>
        </div>
      );

    case "story":
      return (
        <div
          className="rounded-xl border border-[#D3D1C7] bg-[#FAFAF8] px-6 py-5"
          style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
        >
          <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#5F5E5A]">A story</div>
          {block.content.split("\n\n").map((paragraph, i) => (
            <p key={i} className={`text-base italic leading-7 text-[#444441] ${i > 0 ? "mt-3" : ""}`}>
              {paragraph}
            </p>
          ))}
        </div>
      );

    case "think_about_it":
      return (
        <div
          className="rounded-xl border border-[#CECBF6] bg-[#EEEDFE] px-6 py-5"
          style={{ boxShadow: "0 2px 8px rgba(83,74,183,0.06)" }}
        >
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#3C3489]">Think about it</div>
          <p className="text-base leading-7 text-[#26215C]">{block.content}</p>
        </div>
      );

    case "worksheet":
      return (
        <div
          className="rounded-2xl border-2 border-[#EF9F27] bg-[#FFF8F0] p-6"
          style={{ boxShadow: "0 3px 12px rgba(186,117,23,0.1)" }}
        >
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAEEDA]"
              style={{ boxShadow: "0 1px 4px rgba(186,117,23,0.15)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#854F0B]">Worksheet activity</div>
          </div>
          <p className="mb-1 text-base font-medium text-[#1e3a5f]">{block.content}</p>
          {block.prompt ? (
            block.prompt.split("\n").map((line, i) => (
              <p key={i} className="mb-1 text-sm text-[#888780]">{line}</p>
            ))
          ) : null}
          <textarea
            value={worksheetValue}
            onChange={(e) => onWorksheetChange(block.id, e.target.value)}
            placeholder="Type your answer here..."
            className="mt-3 w-full rounded-xl border-2 border-[#EF9F27] bg-white px-4 py-3 text-base text-[#444441] placeholder-[#B4B2A9] outline-none focus:border-[#BA7517]"
            style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)" }}
            rows={4}
          />
          <p className="mt-2 text-[11px] text-[#B4B2A9]">Your answer saves automatically</p>
        </div>
      );

    case "quick_check": {
      // Parse correct answers from prompt field (JSON like {"1":"B","2":"C"})
      let answerKey: Record<string, string> = {};
      if (block.prompt) {
        try {
          answerKey = JSON.parse(block.prompt);
        } catch {
          answerKey = {};
        }
      }

      // Parse questions from content
      const lines = block.content.split("\n");
      const questions: Array<{ num: number; text: string; options: Array<{ key: string; text: string }> }> = [];
      let currentQ: { num: number; text: string; options: Array<{ key: string; text: string }> } | null = null;
      const intro: string[] = [];

      for (const line of lines) {
        const qMatch = line.match(/^(\d+)\.\s*(.*)/);
        const oMatch = line.match(/^([A-D])\)\s*(.*)/);
        if (qMatch) {
          if (currentQ) questions.push(currentQ);
          currentQ = { num: parseInt(qMatch[1]), text: qMatch[2], options: [] };
        } else if (oMatch && currentQ) {
          currentQ.options.push({ key: oMatch[1], text: oMatch[2] });
        } else if (!currentQ && line.trim()) {
          intro.push(line);
        }
      }
      if (currentQ) questions.push(currentQ);

      return (
        <div
          className="rounded-xl border border-[#9FE1CB] bg-[#E1F5EE] px-6 py-5"
          style={{ boxShadow: "0 2px 8px rgba(15,110,86,0.06)" }}
        >
          <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#085041]">Quick check</div>
          {intro.map((line, i) => (
            <p key={i} className="mb-3 text-base text-[#04342C]">{line}</p>
          ))}
          <div className="space-y-5">
            {questions.map((q) => {
              const qKey = block.id + "-" + q.num;
              const selected = quickCheckAnswers[qKey] || "";
              const correctAnswer = answerKey[String(q.num)] || "";
              const hasAnswered = selected !== "";
              const isCorrect = hasAnswered && selected.toUpperCase() === correctAnswer.toUpperCase();
              const isWrong = hasAnswered && !isCorrect && correctAnswer !== "";

              return (
                <div key={q.num}>
                  <p className="mb-2 text-base font-medium text-[#04342C]">{q.num}. {q.text}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt) => {
                      const isSelected = selected === opt.key;
                      const isThisCorrect = opt.key.toUpperCase() === correctAnswer.toUpperCase();
                      const showGreen = isSelected && isCorrect;
                      const showRed = isSelected && isWrong;
                      // Also show green on the correct answer when user got it wrong
                      const revealCorrect = isWrong && isThisCorrect;

                      let bg = "#F7FFFB";
                      let border = "1px solid #9FE1CB";
                      let color = "#04342C";
                      let fontWeight = 400;

                      if (showGreen || revealCorrect) {
                        bg = "#C8F0DD";
                        border = "2px solid #0F6E56";
                        color = "#085041";
                        fontWeight = 500;
                      } else if (showRed) {
                        bg = "#FCEBEB";
                        border = "2px solid #E24B4A";
                        color = "#791F1F";
                        fontWeight = 500;
                      }

                      return (
                        <button
                          key={opt.key}
                          onClick={() => {
                            if (isCorrect) return; // Already got it right, no need to click again
                            onQuickCheckAnswer(qKey, opt.key);
                          }}
                          disabled={isCorrect}
                          className="w-full rounded-lg px-4 py-2.5 text-left text-sm transition disabled:cursor-default"
                          style={{ background: bg, border, color, fontWeight }}
                        >
                          <span className="mr-2 font-bold">{opt.key})</span>
                          {opt.text}
                          {showGreen ? <span className="ml-2">&#10003;</span> : null}
                          {showRed ? <span className="ml-2">&#10007;</span> : null}
                          {revealCorrect && !isSelected ? <span className="ml-2 text-xs">(correct answer)</span> : null}
                        </button>
                      );
                    })}
                  </div>
                  {isWrong ? (
                    <p className="mt-2 text-sm text-[#A32D2D]">Not quite. Try again or look at the correct answer above.</p>
                  ) : null}
                  {isCorrect ? (
                    <p className="mt-2 text-sm font-medium text-[#0F6E56]">That&apos;s right!</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    default:
      return <p className="text-lg leading-8 text-[#444441]">{block.content}</p>;
  }
}
