import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get("courseId");
    if (!courseId) {
      return NextResponse.json({ error: "courseId is required." }, { status: 400 });
    }

    const residentId = req.cookies.get("resident_session")?.value;
    const supabase = createServerSupabase();

    const { data: course } = await supabase
      .from("courses")
      .select("id, course_title, tier, short_description, estimated_hours")
      .eq("id", Number(courseId))
      .single();

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const { data: sections } = await supabase
      .from("sections")
      .select("id, section_number, title")
      .eq("course_id", Number(courseId))
      .order("section_number", { ascending: true });

    const sectionIds = (sections || []).map((s) => s.id);
    const lessonsBySection: Record<number, number> = {};
    let totalLessons = 0;

    if (sectionIds.length > 0) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, section_id")
        .in("section_id", sectionIds);

      for (const l of lessons || []) {
        lessonsBySection[l.section_id] = (lessonsBySection[l.section_id] || 0) + 1;
        totalLessons++;
      }
    }

    const sectionData = (sections || []).map((s) => ({
      section_number: s.section_number,
      title: s.title,
      lesson_count: lessonsBySection[s.id] || 0,
    }));

    let enrollmentStatus: "completed" | "in_progress" | "enrolled" | "not_enrolled" = "not_enrolled";
    if (residentId) {
      const { data: enroll } = await supabase
        .from("enrollments")
        .select("completed_at")
        .eq("resident_id", Number(residentId))
        .eq("course_id", Number(courseId))
        .maybeSingle();

      const { data: prog } = await supabase
        .from("progress")
        .select("progress_percent, progress_status")
        .eq("resident_id", Number(residentId))
        .eq("course_id", Number(courseId))
        .maybeSingle();

      if (enroll?.completed_at || prog?.progress_status === "completed") enrollmentStatus = "completed";
      else if (prog && (prog.progress_percent || 0) > 0) enrollmentStatus = "in_progress";
      else if (enroll) enrollmentStatus = "enrolled";
    }

    return NextResponse.json({
      course: {
        id: course.id,
        course_title: course.course_title,
        tier: course.tier || "Tier 1",
        short_description: course.short_description || "",
        estimated_hours: course.estimated_hours || 0,
      },
      sections: sectionData,
      total_lessons: totalLessons,
      enrollment_status: enrollmentStatus,
    });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
