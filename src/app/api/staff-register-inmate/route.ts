import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { first_name, last_name, register_number, facility_id, staff_id } = body;

    if (!first_name || !last_name || !register_number || !facility_id) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Verify facility is BOP (only inmates should be registered this way)
    const { data: facility } = await supabase
      .from("facilities")
      .select("facility_type, facility_name")
      .eq("id", Number(facility_id))
      .single();

    if (!facility || facility.facility_type !== "bop_prison") {
      return NextResponse.json(
        { error: "Inmates can only be registered at BOP facilities." },
        { status: 400 }
      );
    }

    // Verify the staff member is linked to this facility
    if (staff_id) {
      const { data: staffLink } = await supabase
        .from("staff_facilities")
        .select("id")
        .eq("staff_id", staff_id)
        .eq("facility_id", Number(facility_id))
        .maybeSingle();

      if (!staffLink) {
        return NextResponse.json(
          { error: "You don't have access to this facility." },
          { status: 403 }
        );
      }
    }

    const cleanRegisterNumber = String(register_number).trim();

    // Check for duplicate
    const { data: existing } = await supabase
      .from("residents")
      .select("id")
      .eq("register_number", cleanRegisterNumber)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this register number already exists." },
        { status: 400 }
      );
    }

    // Auto-generate a 4-digit PIN
    const generatedPin = String(Math.floor(1000 + Math.random() * 9000));

    const { error } = await supabase.from("residents").insert({
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      register_number: cleanRegisterNumber,
      facility_id: Number(facility_id),
      pin_hash: generatedPin,
      account_status: "active",
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Unable to create inmate account." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pin: generatedPin,
      facility_name: facility.facility_name,
    });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
