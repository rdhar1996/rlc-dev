import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const residentId = req.cookies.get("resident_session")?.value;
  if (!residentId) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required." }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const [{ data: course }, { data: questions }, { data: attempts }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, course_title")
      .eq("id", Number(courseId))
      .single(),
    supabase
      .from("quiz_questions")
      .select("id, question_number, question_text, option_a, option_b, option_c, option_d, display_order")
      .eq("course_id", Number(courseId))
      .order("display_order"),
    supabase
      .from("quiz_attempts")
      .select("id, score, total_questions, passed, completed_at")
      .eq("resident_id", Number(residentId))
      .eq("course_id", Number(courseId))
      .order("completed_at", { ascending: false })
      .limit(1),
  ]);

  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  return NextResponse.json({
    course,
    questions: questions || [],
    last_attempt: attempts && attempts.length > 0 ? attempts[0] : null,
  });
}
