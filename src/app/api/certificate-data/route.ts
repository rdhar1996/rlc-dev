import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const certificateId = req.nextUrl.searchParams.get("id");
  if (!certificateId) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { data: cert } = await supabase
    .from("certificates")
    .select("id, resident_id, course_id, issued_at")
    .eq("id", Number(certificateId))
    .single();

  if (!cert) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }

  const [{ data: resident }, { data: course }] = await Promise.all([
    supabase
      .from("residents")
      .select("first_name, last_name, facility_id")
      .eq("id", cert.resident_id)
      .single(),
    supabase
      .from("courses")
      .select("course_title, tier, estimated_hours")
      .eq("id", cert.course_id)
      .single(),
  ]);

  let facilityName = "Reentry Learning Center";
  if (resident?.facility_id) {
    const { data: facility } = await supabase
      .from("facilities")
      .select("facility_name")
      .eq("id", resident.facility_id)
      .single();
    if (facility) facilityName = facility.facility_name;
  }

  return NextResponse.json({
    certificate_id: cert.id,
    resident_name: `${resident?.first_name || ""} ${resident?.last_name || ""}`.trim(),
    course_title: course?.course_title || "Course",
    course_tier: course?.tier || "Tier 1",
    course_hours: course?.estimated_hours || 0,
    facility_name: facilityName,
    issued_at: cert.issued_at,
  });
}
