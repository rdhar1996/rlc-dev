import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const residentId = req.cookies.get("resident_session")?.value;
  if (!residentId) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const body = await req.json();
  const { lesson_id, course_id } = body;

  if (!lesson_id || !course_id) {
    return NextResponse.json({ error: "lesson_id and course_id are required." }, { status: 400 });
  }

  const supabase = createServerSupabase();

  // Mark lesson as completed
  await supabase
    .from("lesson_progress")
    .upsert(
      {
        resident_id: Number(residentId),
        lesson_id: Number(lesson_id),
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "resident_id,lesson_id" }
    );

  // Count total lessons in course
  const { data: sections } = await supabase
    .from("sections")
    .select("id")
    .eq("course_id", Number(course_id));

  const sectionIds = (sections || []).map((s: { id: number }) => s.id);
  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .in("section_id", sectionIds);

  // Count completed lessons for this resident
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id")
    .in("section_id", sectionIds);

  const lessonIds = (allLessons || []).map((l: { id: number }) => l.id);
  const { count: completedLessons } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("resident_id", Number(residentId))
    .eq("status", "completed")
    .in("lesson_id", lessonIds);

  // Calculate progress
  const total = totalLessons || 1;
  const completed = completedLessons || 0;
  const percent = Math.round((completed / total) * 100);
  const status = percent >= 100 ? "completed" : percent > 0 ? "in_progress" : "not_started";

  // Update course-level progress
  await supabase
    .from("progress")
    .upsert(
      {
        resident_id: Number(residentId),
        course_id: Number(course_id),
        progress_percent: percent,
        progress_status: status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "resident_id,course_id" }
    );

  // Update enrollment last_activity_at
  await supabase
    .from("enrollments")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("resident_id", Number(residentId))
    .eq("course_id", Number(course_id));

  return NextResponse.json({
    success: true,
    progress_percent: percent,
    progress_status: status,
    completed_lessons: completed,
    total_lessons: total,
  });
}
