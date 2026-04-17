import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const residentId = req.cookies.get("resident_session")?.value;
  if (!residentId) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const body = await req.json();
  const { course_id, answers } = body;

  if (!course_id || !answers) {
    return NextResponse.json({ error: "course_id and answers are required." }, { status: 400 });
  }

  const supabase = createServerSupabase();

  // Get correct answers
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, question_number, correct_option, explanation")
    .eq("course_id", Number(course_id))
    .order("display_order");

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "No quiz found for this course." }, { status: 404 });
  }

  // Score the quiz
  let score = 0;
  const results = questions.map((q) => {
    const userAnswer = answers[String(q.id)] || "";
    const correct = userAnswer.toUpperCase() === q.correct_option.toUpperCase();
    if (correct) score++;
    return {
      question_id: q.id,
      question_number: q.question_number,
      user_answer: userAnswer,
      correct_option: q.correct_option,
      correct,
      explanation: q.explanation,
    };
  });

  const totalQuestions = questions.length;
  const passed = score >= 7;

  // Count existing attempts
  const { count: attemptCount } = await supabase
    .from("quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("resident_id", Number(residentId))
    .eq("course_id", Number(course_id));

  // Save the attempt
  await supabase.from("quiz_attempts").insert({
    resident_id: Number(residentId),
    course_id: Number(course_id),
    attempt_number: (attemptCount || 0) + 1,
    score,
    total_questions: totalQuestions,
    passed,
    answers: results,
    completed_at: new Date().toISOString(),
  });

  let certificateId = null;
  if (passed) {
    const { data: certData } = await supabase
      .from("certificates")
      .insert({
        resident_id: Number(residentId),
        course_id: Number(course_id),
        issued_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (certData) certificateId = certData.id;
    await supabase
      .from("enrollments")
      .update({
        enrollment_status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("resident_id", Number(residentId))
      .eq("course_id", Number(course_id));

    await supabase
      .from("progress")
      .upsert(
        {
          resident_id: Number(residentId),
          course_id: Number(course_id),
          progress_percent: 100,
          progress_status: "completed",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "resident_id,course_id" }
      );
  }

  return NextResponse.json({
    score,
    total_questions: totalQuestions,
    passed,
    results,
    certificate_id: certificateId,
  });
}
