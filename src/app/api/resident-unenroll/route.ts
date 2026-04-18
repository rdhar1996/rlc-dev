import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const residentId = req.cookies.get("resident_session")?.value;
    if (!residentId) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const body = await req.json();
    const { course_id } = body;
    if (!course_id) {
      return NextResponse.json({ error: "course_id is required." }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("enrollment_status, completed_at")
      .eq("resident_id", Number(residentId))
      .eq("course_id", Number(course_id))
      .maybeSingle();

    if (enrollment?.enrollment_status === "completed" || enrollment?.completed_at) {
      return NextResponse.json({ error: "Cannot remove a completed course." }, { status: 400 });
    }

    const { data: sections } = await supabase
      .from("sections")
      .select("id")
      .eq("course_id", Number(course_id));

    const sectionIds = (sections || []).map((s) => s.id);
    if (sectionIds.length > 0) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .in("section_id", sectionIds);

      const lessonIds = (lessons || []).map((l) => l.id);
      if (lessonIds.length > 0) {
        const { data: blocks } = await supabase
          .from("lesson_blocks")
          .select("id")
          .in("lesson_id", lessonIds);

        const blockIds = (blocks || []).map((b) => b.id);
        if (blockIds.length > 0) {
          await supabase
            .from("worksheet_responses")
            .delete()
            .eq("resident_id", Number(residentId))
            .in("lesson_block_id", blockIds);
        }

        await supabase
          .from("lesson_progress")
          .delete()
          .eq("resident_id", Number(residentId))
          .in("lesson_id", lessonIds);
      }
    }

    await supabase.from("progress").delete().eq("resident_id", Number(residentId)).eq("course_id", Number(course_id));
    await supabase.from("enrollments").delete().eq("resident_id", Number(residentId)).eq("course_id", Number(course_id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
