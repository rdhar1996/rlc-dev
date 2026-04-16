"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Facility = {
  id: number;
  facility_name: string;
};

export default function RegisterPage() {
  const [userType, setUserType] = useState<"resident" | "staff">("resident");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);

  const [residentForm, setResidentForm] = useState({
    first_name: "",
    last_name: "",
    register_number: "",
    facility_id: "",
    pin: "",
    confirmPin: "",
  });

  const [staffForm, setStaffForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    selectedFacilities: [] as number[],
  });

  useEffect(() => {
    const loadFacilities = async () => {
      const { data } = await supabase
        .from("facilities")
        .select("id, facility_name")
        .order("facility_name", { ascending: true });

      setFacilities((data || []) as Facility[]);
    };

    loadFacilities();
  }, []);

  const toggleFacility = (facilityId: number) => {
    setStaffForm((prev) => {
      const exists = prev.selectedFacilities.includes(facilityId);

      return {
        ...prev,
        selectedFacilities: exists
          ? prev.selectedFacilities.filter((id) => id !== facilityId)
          : [...prev.selectedFacilities, facilityId],
      };
    });
  };

  const handleResidentRegister = async () => {
    setMessage("");
    setMessageType("");

    if (
      !residentForm.first_name ||
      !residentForm.last_name ||
      !residentForm.register_number ||
      !residentForm.facility_id ||
      !residentForm.pin ||
      !residentForm.confirmPin
    ) {
      setMessage("Please complete all resident fields.");
      setMessageType("error");
      return;
    }

    if (residentForm.pin !== residentForm.confirmPin) {
      setMessage("PINs do not match.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/resident-register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: residentForm.first_name,
        last_name: residentForm.last_name,
        register_number: residentForm.register_number,
        facility_id: residentForm.facility_id,
        pin: residentForm.pin,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setMessage(result.error || "Unable to create resident account.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setMessage("Resident account created successfully. You can now sign in.");
    setMessageType("success");

    setResidentForm({
      first_name: "",
      last_name: "",
      register_number: "",
      facility_id: "",
      pin: "",
      confirmPin: "",
    });

    setLoading(false);
  };

  const handleStaffRegister = async () => {
    setMessage("");
    setMessageType("");

    if (
      !staffForm.full_name ||
      !staffForm.email ||
      !staffForm.password ||
      !staffForm.confirmPassword ||
      staffForm.selectedFacilities.length === 0
    ) {
      setMessage("Please complete all staff fields and select at least one facility.");
      setMessageType("error");
      return;
    }

    if (staffForm.password !== staffForm.confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/staff-register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: staffForm.full_name,
        email: staffForm.email,
        password: staffForm.password,
        facility_ids: staffForm.selectedFacilities,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setMessage(result.error || "Unable to create staff account.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setMessage("Staff account created successfully. You can now sign in.");
    setMessageType("success");

    setStaffForm({
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      selectedFacilities: [],
    });

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#1e3a5f] px-8 py-4 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="text-2xl font-extrabold text-white">RLC</div>
          <div className="text-sm font-medium text-blue-100">
            Reentry Learning Center
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-xl bg-white p-10 shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-[#1e3a5f]">
            Create Your Account
          </h1>

          <p className="mb-8 text-gray-700">
            Register as a resident or staff member.
          </p>

          <div className="mb-8 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUserType("resident")}
              className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                userType === "resident"
                  ? "border-[#0b63c9] bg-[#378add] text-white shadow-sm"
                  : "border-gray-300 bg-white text-[#1e3a5f] hover:bg-gray-50"
              }`}
            >
              Resident
            </button>

            <button
              type="button"
              onClick={() => setUserType("staff")}
              className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                userType === "staff"
                  ? "border-[#0b63c9] bg-[#378add] text-white shadow-sm"
                  : "border-gray-300 bg-white text-[#1e3a5f] hover:bg-gray-50"
              }`}
            >
              Staff
            </button>
          </div>

          {userType === "resident" ? (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                    First Name
                  </label>
                  <input
                    value={residentForm.first_name}
                    onChange={(e) =>
                      setResidentForm({
                        ...residentForm,
                        first_name: e.target.value,
                      })
                    }
                    placeholder="First Name"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-black placeholder-gray-500 outline-none focus:border-[#378add]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                    Last Name
                  </label>
                  <input
                    value={residentForm.last_name}
                    onChange={(e) =>
                      setResidentForm({
                        ...residentForm,
                        last_name: e.target.value,
                      })
                    }
                    placeholder="Last Name"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-black placeholder-gray-500 outline-none focus:border-[#378add]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                  Register Number
                </label>
                <input
                  value={residentForm.register_number}
                  onChange={(e) =>
                    setResidentForm({
                      ...residentForm,
                      register_number: e.target.value,
                    })
                  }
                  placeholder="Register Number"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-black placeholder-gray-500 outline-none focus:border-[#378add]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                  Facility
                </label>
                <select
                  value={residentForm.facility_id}
                  onChange={(e) =>
                    setResidentForm({
                      ...residentForm,
                      facility_id: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-[#378add]"
                >
                  <option value="">Select Facility</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.facility_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                    PIN
                  </label>
                  <input
                    type="password"
                    value={residentForm.pin}
                    onChange={(e) =>
                      setResidentForm({
                        ...residentForm,
                        pin: e.target.value,
                      })
                    }
                    placeholder="PIN"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-black placeholder-gray-500 outline-none focus:border-[#378add]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    value={residentForm.confirmPin}
                    onChange={(e) =>
                      setResidentForm({
                        ...residentForm,
                        confirmPin: e.target.value,
                      })
                    }
                    placeholder="Confirm PIN"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-black placeholder-gray-500 outline-none focus:border-[#378add]"
                  />
                </div>
              </div>

              <button
                onClick={handleResidentRegister}
                disabled={loading}
                className="w-full rounded-md bg-[#0f6e56] px-4 py-3 font-bold text-white disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Resident Account"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                  Full Name
                </label>
                <input
                  value={staffForm.full_name}
                  onChange={(e) =>
                    setStaffForm({
                      ...staffForm,
                      full_name: e.target.value,
                    })
                  }
                  placeholder="Full Name"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-black placeholder-gray-500 outline-none focus:border-[#378add]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                  Email
                </label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) =>
                    setStaffForm({
                      ...staffForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="Email"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-black placeholder-gray-500 outline-none focus:border-[#378add]"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                    Password
                  </label>
                  <input
                    type="password"
                    value={staffForm.password}
                    onChange={(e) =>
                      setStaffForm({
                        ...staffForm,
                        password: e.target.value,
                      })
                    }
                    placeholder="Password"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-black placeholder-gray-500 outline-none focus:border-[#378add]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={staffForm.confirmPassword}
                    onChange={(e) =>
                      setStaffForm({
                        ...staffForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm Password"
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-black placeholder-gray-500 outline-none focus:border-[#378add]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-[#1e3a5f]">
                  Select Facilities
                </label>

                <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  {facilities.map((facility) => (
                    <label
                      key={facility.id}
                      className="flex items-center gap-3 rounded-md bg-white px-3 py-2 text-[#1e3a5f]"
                    >
                      <input
                        type="checkbox"
                        checked={staffForm.selectedFacilities.includes(facility.id)}
                        onChange={() => toggleFacility(facility.id)}
                      />
                      <span>{facility.facility_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStaffRegister}
                disabled={loading}
                className="w-full rounded-md bg-[#378add] px-4 py-3 font-bold text-white disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Staff Account"}
              </button>
            </div>
          )}

          {message ? (
            <div
              className={`mt-6 rounded-lg px-4 py-3 text-sm font-medium ${
                messageType === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}