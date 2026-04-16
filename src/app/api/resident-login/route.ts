import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { register_number, pin } = body;

    if (!register_number || !pin) {
      return NextResponse.json(
        { error: "Register number and PIN are required." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from("residents")
      .select("id, first_name, last_name, register_number, facility_id")
      .eq("register_number", register_number)
      .eq("pin_hash", pin)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: "Invalid register number or PIN." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      resident: data,
    });

    response.cookies.set("resident_session", String(data.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}