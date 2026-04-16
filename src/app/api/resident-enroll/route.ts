import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const residentId = req.cookies.get("resident_session")?.value;

    if (!residentId) {
      return NextResponse.json(
        { error: "Resident session not found." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { course_id } = body;

    if (!course_id) {
      return NextResponse.json(
        { error: "course_id is required." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const { data: existingEnrollment } = await supabase
      .from("enrollments")
      .select("resident_id, course_id")
      .eq("resident_id", Number(residentId))
      .eq("course_id", Number(course_id))
      .maybeSingle();

    if (existingEnrollment) {
      return NextResponse.json({
        success: true,
        already_enrolled: true,
      });
    }

    const { error: enrollmentError } = await supabase.from("enrollments").insert({
      resident_id: Number(residentId),
      course_id: Number(course_id),
      enrollment_status: "enrolled",
      enrolled_at: new Date().toISOString(),
      completed_at: null,
      last_activity_at: new Date().toISOString(),
    });

    if (enrollmentError) {
      return NextResponse.json(
        { error: enrollmentError.message || "Unable to enroll resident." },
        { status: 500 }
      );
    }

    const { data: existingProgress } = await supabase
      .from("progress")
      .select("resident_id, course_id")
      .eq("resident_id", Number(residentId))
      .eq("course_id", Number(course_id))
      .maybeSingle();

    if (!existingProgress) {
      const { error: progressError } = await supabase.from("progress").insert({
        resident_id: Number(residentId),
        course_id: Number(course_id),
        progress_percent: 0,
        progress_status: "not_started",
        updated_at: new Date().toISOString(),
      });

      if (progressError) {
        return NextResponse.json(
          { error: progressError.message || "Unable to create progress record." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}