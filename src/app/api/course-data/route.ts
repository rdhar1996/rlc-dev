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

  const [
    { data: course },
    { data: sections },
    { data: lessons },
    { data: lessonProgress },
    { data: progress },
  ] = await Promise.all([
    supabase
      .from("courses")
      .select("id, course_title, tier, short_description, estimated_hours")
      .eq("id", Number(courseId))
      .single(),
    supabase
      .from("sections")
      .select("id, section_number, title, display_order")
      .eq("course_id", Number(courseId))
      .order("display_order"),
    supabase
      .from("lessons")
      .select("id, section_id, lesson_number, title, estimated_minutes, display_order")
      .eq("section_id", Number(courseId))
      .order("display_order"),
    supabase
      .from("lesson_progress")
      .select("lesson_id, status, completed_at")
      .eq("resident_id", Number(residentId)),
    supabase
      .from("progress")
      .select("progress_percent, progress_status")
      .eq("resident_id", Number(residentId))
      .eq("course_id", Number(courseId))
      .maybeSingle(),
  ]);

  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  // Fetch lessons for each section properly
  const sectionIds = (sections || []).map((s: { id: number }) => s.id);
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, section_id, lesson_number, title, estimated_minutes, display_order")
    .in("section_id", sectionIds)
    .order("display_order");

  // Build progress map
  const progressMap = new Map(
    (lessonProgress || []).map((lp: { lesson_id: number; status: string; completed_at: string | null }) => [
      lp.lesson_id,
      lp,
    ])
  );

  // Structure sections with their lessons
  const structuredSections = (sections || []).map((section: { id: number; section_number: number; title: string; display_order: number }) => {
    const sectionLessons = (allLessons || [])
      .filter((l: { section_id: number }) => l.section_id === section.id)
      .map((lesson: { id: number; lesson_number: number; title: string; estimated_minutes: number }) => {
        const lp = progressMap.get(lesson.id);
        return {
          id: lesson.id,
          lesson_number: lesson.lesson_number,
          title: lesson.title,
          estimated_minutes: lesson.estimated_minutes,
          status: lp ? (lp as { status: string }).status : "not_started",
        };
      });

    const completedCount = sectionLessons.filter(
      (l: { status: string }) => l.status === "completed"
    ).length;

    return {
      id: section.id,
      section_number: section.section_number,
      title: section.title,
      lessons: sectionLessons,
      completed_count: completedCount,
      total_count: sectionLessons.length,
    };
  });

  const totalLessons = (allLessons || []).length;
  const completedLessons = Array.from(progressMap.values()).filter(
    (lp) => (lp as { status: string }).status === "completed"
  ).length;

  return NextResponse.json({
    course,
    sections: structuredSections,
    total_lessons: totalLessons,
    completed_lessons: completedLessons,
    progress: progress || { progress_percent: 0, progress_status: "not_started" },
  });
}
