import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const residentId = req.cookies.get("resident_session")?.value;
  if (!residentId) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId is required." }, { status: 400 });
  }

  const supabase = createServerSupabase();

  // Get lesson info with section and course context
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, section_id, lesson_number, title, estimated_minutes")
    .eq("id", Number(lessonId))
    .single();

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  // Get section info
  const { data: section } = await supabase
    .from("sections")
    .select("id, course_id, section_number, title")
    .eq("id", lesson.section_id)
    .single();

  // Get course info
  const { data: course } = await supabase
    .from("courses")
    .select("id, course_title")
    .eq("id", section?.course_id)
    .single();

  // Get all lessons in this course for navigation
  const { data: allSections } = await supabase
    .from("sections")
    .select("id")
    .eq("course_id", section?.course_id);

  const sectionIds = (allSections || []).map((s: { id: number }) => s.id);
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, section_id, lesson_number, title, display_order")
    .in("section_id", sectionIds)
    .order("display_order");

  // Find prev/next lesson
  const lessonList = allLessons || [];
  const currentIndex = lessonList.findIndex((l: { id: number }) => l.id === Number(lessonId));
  const prevLesson = currentIndex > 0 ? lessonList[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessonList.length - 1 ? lessonList[currentIndex + 1] : null;

  // Get lesson blocks
  const { data: blocks } = await supabase
    .from("lesson_blocks")
    .select("id, block_type, content, prompt, display_order")
    .eq("lesson_id", Number(lessonId))
    .order("display_order");

  // Get worksheet responses for this resident
  const blockIds = (blocks || []).map((b: { id: number }) => b.id);
  const { data: worksheetResponses } = await supabase
    .from("worksheet_responses")
    .select("lesson_block_id, response_text")
    .eq("resident_id", Number(residentId))
    .in("lesson_block_id", blockIds.length > 0 ? blockIds : [0]);

  const responseMap = new Map(
    (worksheetResponses || []).map((r: { lesson_block_id: number; response_text: string }) => [
      r.lesson_block_id,
      r.response_text,
    ])
  );

  // Get lesson progress
  const { data: lessonProg } = await supabase
    .from("lesson_progress")
    .select("status")
    .eq("resident_id", Number(residentId))
    .eq("lesson_id", Number(lessonId))
    .maybeSingle();

  return NextResponse.json({
    lesson,
    section,
    course,
    blocks: (blocks || []).map((block: { id: number; block_type: string; content: string; prompt: string | null; display_order: number }) => ({
      ...block,
      saved_response: responseMap.get(block.id) || null,
    })),
    total_lessons: lessonList.length,
    current_index: currentIndex,
    prev_lesson: prevLesson ? { id: prevLesson.id, title: prevLesson.title } : null,
    next_lesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null,
    status: lessonProg?.status || "not_started",
  });
}
