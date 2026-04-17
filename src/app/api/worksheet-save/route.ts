import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const residentId = req.cookies.get("resident_session")?.value;
  if (!residentId) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const body = await req.json();
  const { lesson_block_id, response_text } = body;

  if (!lesson_block_id) {
    return NextResponse.json({ error: "lesson_block_id is required." }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { error } = await supabase
    .from("worksheet_responses")
    .upsert(
      {
        resident_id: Number(residentId),
        lesson_block_id: Number(lesson_block_id),
        response_text: response_text || "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "resident_id,lesson_block_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
