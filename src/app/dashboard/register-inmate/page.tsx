"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Facility = {
  id: number;
  facility_name: string;
  facility_code: string;
  facility_type: string;
};

export default function RegisterInmatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bopFacilities, setBopFacilities] = useState<Facility[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [error, setError] = useState("");

  const [result, setResult] = useState<{ firstName: string; lastName: string; registerNumber: string; pin: string; facilityName: string } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/staff-login");
        return;
      }
      setStaffId(user.id);

      // Get the staff member's facilities, filter to BOP only
      const { data: staffFacilities } = await supabase
        .from("staff_facilities")
        .select("facility_id, facilities(id, facility_name, facility_code, facility_type)")
        .eq("staff_id", user.id);

      const bop = (staffFacilities || [])
        .map((sf: { facilities: Facility | Facility[] | null }) => Array.isArray(sf.facilities) ? sf.facilities[0] : sf.facilities)
        .filter((f): f is Facility => !!f && f.facility_type === "bop_prison");

      setBopFacilities(bop);
      if (bop.length === 1) setFacilityId(String(bop[0].id));
      setLoading(false);
    }
    load();
  }, [router]);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !registerNumber.trim() || !facilityId) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setSubmitting(true);

    const res = await fetch("/api/staff-register-inmate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        register_number: registerNumber,
        facility_id: Number(facilityId),
        staff_id: staffId,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Unable to register inmate.");
      return;
    }

    const facility = bopFacilities.find((f) => f.id === Number(facilityId));
    setResult({
      firstName,
      lastName,
      registerNumber: registerNumber.trim(),
      pin: data.pin,
      facilityName: facility?.facility_name || "",
    });
  };

  const handleRegisterAnother = () => {
    setResult(null);
    setFirstName("");
    setLastName("");
    setRegisterNumber("");
    setError("");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: "#F5F3EE" }}>
        <div className="text-lg font-semibold text-[#1e3a5f]">Loading...</div>
      </main>
    );
  }

  if (bopFacilities.length === 0) {
    return (
      <main className="min-h-screen" style={{ background: "#F5F3EE" }}>
        <header className="bg-[#1e3a5f] px-8 py-4" style={{ boxShadow: "0 4px 16px rgba(30,58,95,0.2)" }}>
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <Link href="/dashboard" className="cursor-pointer hover:opacity-80">
              <div className="text-2xl font-extrabold text-white">RLC</div>
            </Link>
            <Link href="/dashboard" className="rounded-lg bg-[#378add] px-5 py-2 text-sm font-semibold text-white">
              Back to Dashboard
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-8 py-10">
          <div className="rounded-2xl bg-white p-8 shadow">
            <h1 className="mb-3 text-2xl font-bold text-[#1e3a5f]">Not available</h1>
            <p className="text-gray-600">
              Your staff account isn&apos;t linked to any BOP facility. Inmate registration is only available for staff at BOP facilities.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "#F5F3EE" }}>
      <header className="bg-[#1e3a5f] px-8 py-4" style={{ boxShadow: "0 4px 16px rgba(30,58,95,0.2)" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/dashboard" className="cursor-pointer hover:opacity-80">
            <div className="text-2xl font-extrabold text-white">RLC</div>
          </Link>
          <Link href="/dashboard" className="rounded-lg bg-[#378add] px-5 py-2 text-sm font-semibold text-white">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-8 py-10">
        {result ? (
          <div className="rounded-2xl bg-white p-8" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E1F5EE]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f6e56" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-[#1e3a5f]">Inmate Registered</h1>
            <p className="mb-6 text-gray-600">Share these credentials with the inmate in person.</p>

            <div className="mb-6 rounded-xl border-2 border-[#BA7517] bg-[#FFF8F0] p-6">
              <div className="grid gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#854F0B]">Name</div>
                  <div className="text-lg font-bold text-[#1e3a5f]">{result.firstName} {result.lastName}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#854F0B]">Register Number (used to log in)</div>
                  <div className="text-lg font-mono font-bold text-[#1e3a5f]">{result.registerNumber}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#854F0B]">PIN (used to log in)</div>
                  <div className="text-3xl font-mono font-bold text-[#BA7517]">{result.pin}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#854F0B]">Facility</div>
                  <div className="text-base font-semibold text-[#1e3a5f]">{result.facilityName}</div>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-[#FAEEDA] px-4 py-3 text-sm text-[#854F0B]">
              <strong>Important:</strong> Write down the PIN and share it with the inmate in person. This PIN will not be shown again.
            </div>

            <div className="flex gap-3">
              <button onClick={handleRegisterAnother} className="flex-1 rounded-xl bg-[#BA7517] px-4 py-3 font-semibold text-white">
                Register Another Inmate
              </button>
              <Link href="/dashboard" className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-center font-semibold text-[#1e3a5f]">
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <h1 className="mb-2 text-2xl font-bold text-[#1e3a5f]">Register an Inmate</h1>
            <p className="mb-6 text-sm text-gray-600">
              Create an account for an inmate at your facility. A PIN will be generated automatically. Share the register number and PIN with the inmate in person.
            </p>

            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1e3a5f]">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#1e3a5f] outline-none focus:border-[#BA7517]"
                  placeholder="e.g., John"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1e3a5f]">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#1e3a5f] outline-none focus:border-[#BA7517]"
                  placeholder="e.g., Smith"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1e3a5f]">Federal Register Number</label>
                <input
                  type="text"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-[#1e3a5f] outline-none focus:border-[#BA7517]"
                  placeholder="e.g., 65791-056"
                />
                <p className="mt-1 text-xs text-gray-500">Format: 5 digits, dash, 3 digits</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1e3a5f]">Facility</label>
                <select
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[#1e3a5f] outline-none focus:border-[#BA7517]"
                >
                  <option value="">Select a facility</option>
                  {bopFacilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.facility_name}</option>
                  ))}
                </select>
              </div>

              {error ? (
                <div className="rounded-lg bg-[#FCEBEB] px-4 py-3 text-sm text-[#A32D2D]">{error}</div>
              ) : null}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-2 w-full rounded-xl bg-[#BA7517] py-4 text-lg font-bold text-white disabled:opacity-60"
                style={{ boxShadow: "0 4px 12px rgba(186,117,23,0.3)" }}
              >
                {submitting ? "Creating account..." : "Create Inmate Account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
