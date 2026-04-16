import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      first_name,
      last_name,
      register_number,
      facility_id,
      pin,
    } = body;

    if (
      !first_name ||
      !last_name ||
      !register_number ||
      !facility_id ||
      !pin
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const { data: existing } = await supabase
      .from("residents")
      .select("id")
      .eq("register_number", register_number)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A resident with that register number already exists." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("residents").insert({
      first_name,
      last_name,
      register_number,
      facility_id: Number(facility_id),
      pin_hash: pin,
      account_status: "active",
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Unable to create resident." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}