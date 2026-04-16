import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();

  const { full_name, email, password, facility_ids } = body;

  if (!full_name || !email || !password || !facility_ids?.length) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: 400 }
    );
  }

  const userId = authData.user.id;

  await supabase.from("staff_profiles").insert({
    id: userId,
    full_name,
    last_used_facility_id: facility_ids[0],
  });

  const facilityRows = facility_ids.map((fid: number) => ({
    staff_id: userId,
    facility_id: fid,
  }));

  await supabase.from("staff_facilities").insert(facilityRows);

  return NextResponse.json({ success: true });
}