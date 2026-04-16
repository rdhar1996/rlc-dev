import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { first_name, last_name, register_number, new_pin } = body;

    if (!first_name || !last_name || !register_number || !new_pin) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const { data: resident } = await supabase
      .from("residents")
      .select("id")
      .eq("first_name", first_name)
      .eq("last_name", last_name)
      .eq("register_number", register_number)
      .maybeSingle();

    if (!resident) {
      return NextResponse.json(
        { error: "Resident information did not match our records." },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("residents")
      .update({ pin_hash: new_pin })
      .eq("id", resident.id);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Unable to reset PIN." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "PIN updated successfully. You can now sign in.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}