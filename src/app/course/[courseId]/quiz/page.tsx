"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Question = {
  id: number;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

type QuizResult = {
  question_id: number;
  question_number: number;
  user_answer: string;
  correct_option: string;
  correct: boolean;
  explanation: string;
};

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Results state
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [passed, setPassed] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [certificateId, setCertificateId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/quiz-data?courseId=${courseId}`);
      const result = await res.json();
      if (!res.ok) {
        router.push(`/course/${courseId}`);
        return;
      }
      setCourseTitle(result.course.course_title);
      setQuestions(result.questions);

      // Check if all lessons are complete
      const progressRes = await fetch(`/api/course-data?courseId=${courseId}`);
      const progressData = await progressRes.json();
      if (progressRes.ok && progressData.completed_lessons < progressData.total_lessons) {
        router.push(`/course/${courseId}`);
        return;
      }

      setLoading(false);
    }
    load();
  }, [courseId, router]);

  const handleSelect = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      return;
    }

    setSubmitting(true);

    const res = await fetch("/api/quiz-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: Number(courseId), answers }),
    });

    const result = await res.json();

    setScore(result.score);
    setTotalQuestions(result.total_questions);
    setPassed(result.passed);
    setResults(result.results);
    if (result.certificate_id) setCertificateId(result.certificate_id);
    setSubmitted(true);
    setSubmitting(false);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="text-lg font-semibold text-[#1e3a5f]">Loading quiz...</div>
      </main>
    );
  }

  // Results screen
  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f8f9fa]">
        <header className="bg-[#1e3a5f] px-8 py-4 shadow-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <Link href="/resident-dashboard" className="cursor-pointer hover:opacity-80 transition-opacity"><div className="text-2xl font-extrabold text-white">RLC</div></Link>
            <button
              onClick={() => router.push(`/course/${courseId}`)}
              className="rounded-md bg-[#378add] px-4 py-2 text-sm font-semibold text-white"
            >
              Back to Course
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-8 py-10">
          {/* Score card */}
          <div className={`mb-8 rounded-xl p-8 text-center ${passed ? "bg-[#ecfdf5] border-2 border-[#0f6e56]" : "bg-[#FEF2F2] border-2 border-[#E24B4A]"}`}>
            <div className={`mb-2 text-5xl font-extrabold ${passed ? "text-[#0f6e56]" : "text-[#E24B4A]"}`}>
              {score} / {totalQuestions}
            </div>
            <div className={`text-xl font-bold ${passed ? "text-[#0f6e56]" : "text-[#E24B4A]"}`}>
              {passed ? "You passed!" : "Not quite yet"}
            </div>
            <p className="mt-2 text-gray-600">
              {passed
                ? "Great job! You finished this course."
                : "You need 7 out of 10 to pass. Read through the lessons again and try the quiz when you are ready."}
            </p>
          </div>

          {/* Results breakdown */}
          <h2 className="mb-4 text-2xl font-bold text-[#1e3a5f]">Your Answers</h2>
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.question_id}
                className={`rounded-lg border p-5 ${result.correct ? "border-[#0f6e56]/30 bg-[#f7fffb]" : "border-[#E24B4A]/30 bg-[#FEF8F8]"}`}
              >
                <div className="mb-2 flex items-start gap-3">
                  <span className={`mt-0.5 text-lg ${result.correct ? "text-[#0f6e56]" : "text-[#E24B4A]"}`}>
                    {result.correct ? "✓" : "✗"}
                  </span>
                  <div>
                    <div className="font-medium text-[#1e3a5f]">
                      {result.question_number}. {questions.find(q => q.id === result.question_id)?.question_text}
                    </div>
                    {!result.correct ? (
                      <div className="mt-2 text-sm text-gray-600">
                        Your answer: {result.user_answer} — Correct answer: {result.correct_option}
                      </div>
                    ) : null}
                    <div className="mt-1 text-sm text-gray-500">{result.explanation}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex gap-4">
            {passed ? (
              <>
                {certificateId ? (
                  <button
                    onClick={() => router.push(`/course/${courseId}/certificate?id=${certificateId}`)}
                    className="flex-1 rounded-md py-4 text-lg font-bold text-white"
                    style={{ background: "#BA7517", boxShadow: "0 4px 12px rgba(186,117,23,0.3)" }}
                  >
                    View Certificate
                  </button>
                ) : null}
                <button
                  onClick={() => router.push("/resident-dashboard")}
                  className="flex-1 rounded-md bg-[#0f6e56] py-4 text-lg font-bold text-white"
                >
                  Back to Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/course/${courseId}`)}
                  className="flex-1 rounded-md border border-gray-300 py-4 text-lg font-medium text-[#1e3a5f]"
                >
                  Review Lessons
                </button>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setAnswers({});
                    setResults([]);
                    window.scrollTo(0, 0);
                  }}
                  className="flex-1 rounded-md bg-[#BA7517] py-4 text-lg font-bold text-white"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Quiz form
  const answeredCount = Object.keys(answers).length;

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#1e3a5f] px-8 py-4 shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white">RLC</div>
            <div className="text-sm text-blue-100">Course Quiz</div>
          </div>
          <button
            onClick={() => router.push(`/course/${courseId}`)}
            className="rounded-md bg-[#378add] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Course
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-8 py-10">
        <h1 className="mb-2 text-3xl font-bold text-[#1e3a5f]">{courseTitle} — Quiz</h1>
        <p className="mb-2 text-gray-500">Answer all 10 questions. You need 7 right to pass.</p>
        <p className="mb-8 text-sm text-gray-400">You can take this quiz as many times as you want.</p>

        <div className="space-y-6">
          {questions.map((question, qi) => {
            const selected = answers[String(question.id)] || "";
            const options = [
              { key: "A", text: question.option_a },
              { key: "B", text: question.option_b },
              { key: "C", text: question.option_c },
              { key: "D", text: question.option_d },
            ];

            return (
              <div key={question.id} className="rounded-xl bg-white p-6 shadow">
                <div className="mb-4 text-lg font-medium text-[#1e3a5f]">
                  {qi + 1}. {question.question_text}
                </div>
                <div className="space-y-2">
                  {options.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => handleSelect(question.id, option.key)}
                      className={`w-full rounded-lg border px-4 py-3 text-left text-base transition ${
                        selected === option.key
                          ? "border-[#BA7517] bg-[#FAEEDA] font-medium text-[#633806]"
                          : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="mr-3 font-bold">{option.key}.</span>
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <div className="mt-8">
          <div className="mb-3 text-center text-sm text-gray-500">
            {answeredCount} of {questions.length} answered
          </div>
          <button
            onClick={handleSubmit}
            disabled={answeredCount < questions.length || submitting}
            className="w-full rounded-md bg-[#BA7517] py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Checking your answers..." : "Submit Quiz"}
          </button>
        </div>
      </div>
    </main>
  );
}
