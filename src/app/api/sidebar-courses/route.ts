import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const residentId = req.cookies.get("resident_session")?.value;
    if (!residentId) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const supabase = createServerSupabase();

    const { data: courses } = await supabase
      .from("courses")
      .select("id, course_title, tier, display_order")
      .eq("active", true)
      .order("display_order", { ascending: true });

    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id, completed_at, enrollment_status")
      .eq("resident_id", Number(residentId));

    const { data: progressRows } = await supabase
      .from("progress")
      .select("course_id, progress_percent, progress_status")
      .eq("resident_id", Number(residentId));

    const enrolledMap = new Map(
      (enrollments || []).map((e) => [e.course_id, e])
    );
    const progressMap = new Map(
      (progressRows || []).map((p) => [p.course_id, p])
    );

    const items = (courses || []).map((c) => {
      const enroll = enrolledMap.get(c.id);
      const prog = progressMap.get(c.id);
      let status: "completed" | "in_progress" | "enrolled" | "not_enrolled" = "not_enrolled";
      if (enroll?.completed_at || prog?.progress_status === "completed") status = "completed";
      else if (prog && (prog.progress_percent || 0) > 0) status = "in_progress";
      else if (enroll) status = "enrolled";

      return {
        id: c.id,
        course_title: c.course_title,
        tier: c.tier || "Tier 1",
        status,
      };
    });

    return NextResponse.json({ courses: items });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
