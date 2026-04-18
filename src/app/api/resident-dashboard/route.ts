import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const cookieResidentId = req.cookies.get("resident_session")?.value;
  const residentId = cookieResidentId || req.nextUrl.searchParams.get("residentId");

  if (!residentId) {
    return NextResponse.json(
      { error: "Resident session not found." },
      { status: 401 }
    );
  }

  const supabase = createServerSupabase();

  const [
    { data: resident },
    { data: enrollments },
    { data: progress },
    { data: recommendations },
    { data: certificates },
    { data: courses },
  ] = await Promise.all([
    supabase
      .from("residents")
      .select("id, first_name, last_name, register_number, facility_id, facilities(facility_type, facility_name)")
      .eq("id", Number(residentId))
      .single(),
    supabase
      .from("enrollments")
      .select("*")
      .eq("resident_id", Number(residentId)),
    supabase
      .from("progress")
      .select("*")
      .eq("resident_id", Number(residentId)),
    supabase
      .from("recommendations")
      .select("*")
      .eq("resident_id", Number(residentId)),
    supabase
      .from("certificates")
      .select("*")
      .eq("resident_id", Number(residentId)),
    supabase.from("courses").select("*"),
  ]);

  if (!resident) {
    return NextResponse.json(
      { error: "Resident not found." },
      { status: 404 }
    );
  }

  const facilityType = (resident as { facilities?: { facility_type?: string } })?.facilities?.facility_type || "halfway_house";
  const facilityName = (resident as { facilities?: { facility_name?: string } })?.facilities?.facility_name || "";
  const isInmate = facilityType === "bop_prison";

  return NextResponse.json({
    resident: resident || null,
    facility_type: facilityType,
    facility_name: facilityName,
    is_inmate: isInmate,
    enrollments: enrollments || [],
    progress: progress || [],
    recommendations: recommendations || [],
    certificates: certificates || [],
    courses: courses || [],
  });
}