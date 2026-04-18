"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Resident = {
  id: number;
  first_name: string;
  last_name: string;
  register_number: string;
  facility_id: number | null;
  last_login_at: string | null;
};

type Enrollment = {
  resident_id: number;
  course_id: number;
  enrollment_status: string;
  enrolled_at: string | null;
  completed_at: string | null;
  last_activity_at: string | null;
};

type ProgressRow = {
  resident_id: number;
  course_id: number;
  progress_percent: number;
  progress_status: string;
  updated_at: string | null;
};

type Course = {
  id: number;
  course_title: string;
  tier: "Tier 1" | "Tier 2";
  display_order: number | null;
};

type Recommendation = {
  id?: number;
  resident_id: number;
  course_id: number;
  recommendation_status: string;
  recommended_at: string | null;
  staff_id: string;
};

type Certificate = {
  resident_id: number;
  course_id: number;
  certificate_url: string | null;
  issued_at: string | null;
};

type StaffProfile = {
  full_name: string;
  last_used_facility_id: number | null;
};

type Facility = {
  id: number;
  facility_name: string;
};

function isWithinDays(dateValue: string | null | undefined, days: number) {
  if (!dateValue) return false;
  const now = new Date().getTime();
  const date = new Date(dateValue).getTime();
  if (Number.isNaN(date)) return false;
  return now - date <= days * 24 * 60 * 60 * 1000;
}

function isThisMonth(dateValue: string | null | undefined) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}

function maxDateMs(...values: Array<string | null | undefined>) {
  const valid = values
    .filter(Boolean)
    .map((v) => new Date(v as string).getTime())
    .filter((n) => !Number.isNaN(n));

  return valid.length ? Math.max(...valid) : 0;
}

export default function DashboardPage() {
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [facilityLoading, setFacilityLoading] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffUserId, setStaffUserId] = useState("");
  const [assignedFacilities, setAssignedFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(
    null
  );

  const [residents, setResidents] = useState<Resident[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendMessage, setRecommendMessage] = useState("");

  useEffect(() => {
    const loadStaffContext = async () => {
      setPageLoading(true);
      setErrorMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/staff-login");
        return;
      }

      setStaffEmail(user.email || "");
      setStaffUserId(user.id);

      const [{ data: profileData, error: profileError }, { data: accessData, error: accessError }] =
        await Promise.all([
          supabase
            .from("staff_profiles")
            .select("full_name, last_used_facility_id")
            .eq("id", user.id)
            .single(),
          supabase
            .from("staff_facilities")
            .select("facility_id")
            .eq("staff_id", user.id),
        ]);

      if (profileError || accessError) {
        setErrorMessage("Unable to load staff access.");
        setPageLoading(false);
        return;
      }

      const profile = profileData as StaffProfile | null;
      setStaffName(profile?.full_name || "");

      const facilityIds =
        (accessData || [])
          .map((row: { facility_id: number }) => row.facility_id)
          .filter(Boolean) || [];

      if (!facilityIds.length) {
        setAssignedFacilities([]);
        setSelectedFacilityId(null);
        setPageLoading(false);
        return;
      }

      const { data: facilitiesData, error: facilitiesError } = await supabase
        .from("facilities")
        .select("id, facility_name")
        .in("id", facilityIds)
        .order("facility_name", { ascending: true });

      if (facilitiesError) {
        setErrorMessage("Unable to load facilities.");
        setPageLoading(false);
        return;
      }

      const facilities = (facilitiesData || []) as Facility[];
      setAssignedFacilities(facilities);

      const defaultFacility =
        profile?.last_used_facility_id &&
        facilities.some((f) => f.id === profile.last_used_facility_id)
          ? profile.last_used_facility_id
          : facilities[0]?.id || null;

      setSelectedFacilityId(defaultFacility);
      setPageLoading(false);
    };

    loadStaffContext();
  }, [router]);

  useEffect(() => {
    const loadFacilityData = async () => {
      if (!selectedFacilityId) return;

      setFacilityLoading(true);
      setErrorMessage("");

      const { data: residentData, error: residentsError } = await supabase
        .from("residents")
        .select(
          "id, first_name, last_name, register_number, facility_id, last_login_at"
        )
        .eq("facility_id", selectedFacilityId);

      if (residentsError) {
        setErrorMessage("Unable to load residents.");
        setFacilityLoading(false);
        return;
      }

      const residentRows = ((residentData || []) as Resident[]).sort((a, b) =>
        a.first_name.localeCompare(b.first_name)
      );
      setResidents(residentRows);

      const residentIds = residentRows.map((r) => r.id);

      const [{ data: courseData }, { data: enrollmentData }, { data: progressData }, { data: recommendationData }, { data: certificateData }] =
        await Promise.all([
          supabase
            .from("courses")
            .select("id, course_title, tier, display_order")
            .order("display_order", { ascending: true }),
          residentIds.length
            ? supabase
                .from("enrollments")
                .select(
                  "resident_id, course_id, enrollment_status, enrolled_at, completed_at, last_activity_at"
                )
                .in("resident_id", residentIds)
            : Promise.resolve({ data: [] as Enrollment[] }),
          residentIds.length
            ? supabase
                .from("progress")
                .select(
                  "resident_id, course_id, progress_percent, progress_status, updated_at"
                )
                .in("resident_id", residentIds)
            : Promise.resolve({ data: [] as ProgressRow[] }),
          residentIds.length
            ? supabase
                .from("recommendations")
                .select(
                  "id, resident_id, course_id, recommendation_status, recommended_at, staff_id"
                )
                .in("resident_id", residentIds)
            : Promise.resolve({ data: [] as Recommendation[] }),
          residentIds.length
            ? supabase
                .from("certificates")
                .select("resident_id, course_id, certificate_url, issued_at")
                .in("resident_id", residentIds)
            : Promise.resolve({ data: [] as Certificate[] }),
        ]);

      setCourses((courseData || []) as Course[]);
      setEnrollments((enrollmentData || []) as Enrollment[]);
      setProgressRows((progressData || []) as ProgressRow[]);
      setRecommendations((recommendationData || []) as Recommendation[]);
      setCertificates((certificateData || []) as Certificate[]);

      setFacilityLoading(false);
    };

    loadFacilityData();
  }, [selectedFacilityId]);

  const selectedFacilityName =
    assignedFacilities.find((f) => f.id === selectedFacilityId)?.facility_name ||
    "No Facility";

  const metrics = useMemo(() => {
    const courseById = new Map(courses.map((c) => [c.id, c]));
    const progressByResident = new Map<number, ProgressRow[]>();
    const enrollmentsByResident = new Map<number, Enrollment[]>();
    const recommendationsByResident = new Map<number, Recommendation[]>();

    progressRows.forEach((row) => {
      const list = progressByResident.get(row.resident_id) || [];
      list.push(row);
      progressByResident.set(row.resident_id, list);
    });

    enrollments.forEach((row) => {
      const list = enrollmentsByResident.get(row.resident_id) || [];
      list.push(row);
      enrollmentsByResident.set(row.resident_id, list);
    });

    recommendations.forEach((row) => {
      const list = recommendationsByResident.get(row.resident_id) || [];
      list.push(row);
      recommendationsByResident.set(row.resident_id, list);
    });

    const totalResidents = residents.length;

    const completedRows = progressRows.filter(
      (p) =>
        p.progress_status === "completed" || Number(p.progress_percent) === 100
    );

    const inProgressRows = progressRows.filter(
      (p) =>
        p.progress_status === "in_progress" &&
        Number(p.progress_percent) > 0 &&
        Number(p.progress_percent) < 100
    );

    const overallCompletionRate = progressRows.length
      ? Math.round((completedRows.length / progressRows.length) * 100)
      : 0;

    const activeResidentsThisWeek = new Set<number>();

    residents.forEach((resident) => {
      if (isWithinDays(resident.last_login_at, 7)) {
        activeResidentsThisWeek.add(resident.id);
      }
    });

    enrollments.forEach((row) => {
      if (isWithinDays(row.last_activity_at, 7)) {
        activeResidentsThisWeek.add(row.resident_id);
      }
    });

    progressRows.forEach((row) => {
      if (isWithinDays(row.updated_at, 7)) {
        activeResidentsThisWeek.add(row.resident_id);
      }
    });

    const tier1Progress = progressRows.filter(
      (p) => courseById.get(p.course_id)?.tier === "Tier 1"
    );
    const tier2Progress = progressRows.filter(
      (p) => courseById.get(p.course_id)?.tier === "Tier 2"
    );

    const tier1CompletionRate = tier1Progress.length
      ? Math.round(
          (tier1Progress.filter(
            (p) =>
              p.progress_status === "completed" ||
              Number(p.progress_percent) === 100
          ).length /
            tier1Progress.length) *
            100
        )
      : 0;

    const tier2CompletionRate = tier2Progress.length
      ? Math.round(
          (tier2Progress.filter(
            (p) =>
              p.progress_status === "completed" ||
              Number(p.progress_percent) === 100
          ).length /
            tier2Progress.length) *
            100
        )
      : 0;

    const newThisMonth = enrollments.filter((e) => isThisMonth(e.enrolled_at)).length;

    const courseEnrollmentCounts = courses
      .map((course) => ({
        courseId: course.id,
        courseTitle: course.course_title,
        count: enrollments.filter((e) => e.course_id === course.id).length,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const courseCompletionCounts = courses
      .map((course) => ({
        courseId: course.id,
        courseTitle: course.course_title,
        count: completedRows.filter((p) => p.course_id === course.id).length,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const tier1EnrollmentCount = enrollments.filter(
      (e) => courseById.get(e.course_id)?.tier === "Tier 1"
    ).length;

    const tier2EnrollmentCount = enrollments.filter(
      (e) => courseById.get(e.course_id)?.tier === "Tier 2"
    ).length;

    const minimallyEngagedResidents = residents
      .map((resident) => {
        const residentEnrollments = enrollmentsByResident.get(resident.id) || [];
        const residentProgress = progressByResident.get(resident.id) || [];

        if (!residentEnrollments.length) {
          return {
            id: resident.id,
            name: `${resident.first_name} ${resident.last_name}`,
            status: `Register #: ${resident.register_number} • No courses started`,
          };
        }

        const allNotStarted =
          !residentProgress.length ||
          residentProgress.every(
            (p) =>
              p.progress_status === "not_started" ||
              Number(p.progress_percent) === 0
          );

        if (allNotStarted) {
          return {
            id: resident.id,
            name: `${resident.first_name} ${resident.last_name}`,
            status: `Register #: ${resident.register_number} • No courses started`,
          };
        }

        const latestActivityMs = Math.max(
          maxDateMs(resident.last_login_at),
          ...residentEnrollments.map((e) => maxDateMs(e.last_activity_at)),
          ...residentProgress.map((p) => maxDateMs(p.updated_at))
        );

        const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

        if (!latestActivityMs || Date.now() - latestActivityMs > fourteenDaysMs) {
          return {
            id: resident.id,
            name: `${resident.first_name} ${resident.last_name}`,
            status: `Register #: ${resident.register_number} • No activity for 14 days`,
          };
        }

        return null;
      })
      .filter(Boolean)
      .slice(0, 5) as Array<{ id: number; name: string; status: string }>;

    const residentRows = residents
      .map((resident) => {
        const residentEnrollments = enrollmentsByResident.get(resident.id) || [];
        const residentProgress = progressByResident.get(resident.id) || [];
        const residentRecommendations =
          recommendationsByResident.get(resident.id) || [];

        const avgProgress = residentProgress.length
          ? Math.round(
              residentProgress.reduce(
                (sum, row) => sum + Number(row.progress_percent || 0),
                0
              ) / residentProgress.length
            )
          : 0;

        const latestActivityMs = Math.max(
          maxDateMs(resident.last_login_at),
          ...residentEnrollments.map((e) => maxDateMs(e.last_activity_at)),
          ...residentProgress.map((p) => maxDateMs(p.updated_at))
        );

        const lastActivity =
          latestActivityMs > 0 ? new Date(latestActivityMs).toISOString() : null;

        const inactive =
          !latestActivityMs ||
          Date.now() - latestActivityMs > 14 * 24 * 60 * 60 * 1000;

        return {
          id: resident.id,
          firstName: resident.first_name,
          name: `${resident.first_name} ${resident.last_name}`,
          registerNumber: resident.register_number,
          enrolledCount: residentEnrollments.length,
          progress: avgProgress,
          activeRecommendations: residentRecommendations.filter(
            (r) => r.recommendation_status === "active"
          ).length,
          lastActivity,
          status: inactive ? "Inactive" : "Active",
        };
      })
      .sort((a, b) => a.firstName.localeCompare(b.firstName));

    return {
      totalResidents,
      overallCompletionRate,
      activeResidentsThisWeek: activeResidentsThisWeek.size,
      totalCertificates: certificates.length,
      inProgressCount: inProgressRows.length,
      tier1CompletionRate,
      tier2CompletionRate,
      newThisMonth,
      courseEnrollmentCounts,
      courseCompletionCounts,
      tier1EnrollmentCount,
      tier2EnrollmentCount,
      minimallyEngagedResidents,
      residentRows,
    };
  }, [residents, enrollments, progressRows, courses, recommendations, certificates]);

  const openRecommendModal = (residentId: number) => {
    const resident = residents.find((r) => r.id === residentId) || null;
    setSelectedResident(resident);
    setSelectedCourseId("");
    setRecommendMessage("");
    setIsRecommendOpen(true);
  };

  const closeRecommendModal = () => {
    setIsRecommendOpen(false);
    setSelectedResident(null);
    setSelectedCourseId("");
    setRecommendMessage("");
    setRecommendLoading(false);
  };

  const handleRecommend = async () => {
    if (!selectedResident || !selectedCourseId || !staffUserId) {
      setRecommendMessage("Please select a course.");
      return;
    }

    const courseIdNum = Number(selectedCourseId);

    const alreadyActive = recommendations.some(
      (r) =>
        r.resident_id === selectedResident.id &&
        r.course_id === courseIdNum &&
        r.recommendation_status === "active"
    );

    if (alreadyActive) {
      setRecommendMessage("This course is already recommended.");
      return;
    }

    const residentProgress = progressRows.find(
      (row) =>
        row.resident_id === selectedResident.id && row.course_id === courseIdNum
    );

    if (
      residentProgress &&
      (residentProgress.progress_status === "completed" ||
        Number(residentProgress.progress_percent) === 100)
    ) {
      setRecommendMessage("Completed courses cannot be recommended.");
      return;
    }

    setRecommendLoading(true);
    setRecommendMessage("");

    const { data, error } = await supabase
      .from("recommendations")
      .insert({
        resident_id: selectedResident.id,
        course_id: courseIdNum,
        recommendation_status: "active",
        staff_id: staffUserId,
      })
      .select()
      .single();

    if (error) {
      setRecommendMessage(error.message || "Unable to save recommendation.");
      setRecommendLoading(false);
      return;
    }

    setRecommendations((prev) => [...prev, data as Recommendation]);
    setRecommendMessage("Recommendation added.");

    setTimeout(() => {
      closeRecommendModal();
    }, 700);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/staff-login");
  };

  const handleExport = () => {
    const csvRows = [
      [
        "Resident Name",
        "Register Number",
        "Courses Enrolled",
        "Average Progress",
        "Active Recommendations",
        "Last Activity",
        "Status",
      ],
      ...metrics.residentRows.map((row) => [
        row.name,
        row.registerNumber,
        String(row.enrolledCount),
        `${row.progress}%`,
        String(row.activeRecommendations),
        row.lastActivity || "—",
        row.status,
      ]),
    ];

    const csv = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedFacilityName
      .toLowerCase()
      .replace(/\s+/g, "-")}-resident-report.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-[#f8f9fa]">
        <header className="bg-[#1e3a5f] px-8 py-4 shadow-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <Link href="/dashboard" className="cursor-pointer hover:opacity-80 transition-opacity"><div className="text-2xl font-extrabold text-white">RLC</div></Link>
              <div className="text-sm text-blue-100">Facility Dashboard</div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-8 py-10">
          <div className="animate-pulse">
            <div className="mb-8 h-10 w-72 rounded bg-gray-200" />
            <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-32 rounded-xl bg-white shadow" />
              ))}
            </div>
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              <div className="h-[500px] rounded-xl bg-white shadow" />
              <div className="space-y-8">
                <div className="h-72 rounded-xl bg-white shadow" />
                <div className="h-72 rounded-xl bg-white shadow" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#1e3a5f] px-8 py-4 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white">RLC</div>
            <div className="text-sm text-blue-100">Facility Dashboard</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-sm text-blue-100">
              <div className="font-semibold text-white">
                {staffName || staffEmail}
              </div>
              <div>{selectedFacilityName}</div>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-md bg-[#d85a30] px-4 py-2 text-sm font-semibold text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#1e3a5f]">
              Facility Dashboard
            </h1>
            <p className="mt-1 text-gray-500">Signed in as {staffEmail}</p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={selectedFacilityId ?? ""}
              onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-white px-4 py-3 text-black"
            >
              {assignedFacilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.facility_name}
                </option>
              ))}
            </select>

            <button
              onClick={handleExport}
              className="rounded-md bg-[#0f6e56] px-5 py-3 text-sm font-semibold text-white"
            >
              Export Report
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            {errorMessage}
          </div>
        ) : null}

        {facilityLoading ? (
          <div className="mb-8 rounded-xl bg-white p-6 shadow">
            <div className="animate-pulse">
              <div className="mb-4 h-5 w-48 rounded bg-gray-200" />
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-32 rounded-xl bg-gray-100" />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-xl bg-white p-5 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1e3a5f]">Residents</h2>
              <span className="rounded-full bg-[#eaf3ff] px-3 py-1 text-xs font-semibold text-[#378add]">
                {metrics.totalResidents}
              </span>
            </div>

            <div className="space-y-3">
              {metrics.residentRows.length ? (
                metrics.residentRows.map((resident) => (
                  <Link
                    key={resident.id}
                    href={`/dashboard/resident/${resident.id}`}
                    className="block rounded-lg border border-gray-200 px-4 py-3 transition hover:border-[#378add] hover:bg-blue-50"
                  >
                    <div className="font-semibold text-[#1e3a5f]">
                      {resident.name}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Register #: {resident.registerNumber}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-sm text-gray-500">
                  No residents found for this facility.
                </div>
              )}
            </div>
          </aside>

          <div>
            <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <DashboardCard
                label="Total Residents"
                value={String(metrics.totalResidents)}
                description="Active enrolled"
                accent="blue"
              />
              <DashboardCard
                label="Overall Completion"
                value={`${metrics.overallCompletionRate}%`}
                description="All tracked course progress"
                accent="teal"
              />
              <DashboardCard
                label="Active This Week"
                value={String(metrics.activeResidentsThisWeek)}
                description="With login or course activity"
                accent="coral"
              />
              <DashboardCard
                label="Total Certificates"
                value={String(metrics.totalCertificates)}
                description="Overall earned"
                accent="green"
              />
              <DashboardCard
                label="In Progress"
                value={String(metrics.inProgressCount)}
                description="Active course records"
                accent="blue"
              />
              <DashboardCard
                label="Tier 1 Completion"
                value={`${metrics.tier1CompletionRate}%`}
                description="Foundational"
                accent="teal"
              />
              <DashboardCard
                label="Tier 2 Completion"
                value={`${metrics.tier2CompletionRate}%`}
                description="Advanced"
                accent="coral"
              />
              <DashboardCard
                label="New This Month"
                value={String(metrics.newThisMonth)}
                description="New enrollments"
                accent="green"
              />
            </div>

            <SectionTitle title="Course Analytics" />

            <div className="mb-10 grid gap-6 lg:grid-cols-3">
              <AnalyticsCard title="Course Enrollment Distribution">
                <div className="space-y-4">
                  {metrics.courseEnrollmentCounts.length ? (
                    metrics.courseEnrollmentCounts.map((course) => (
                      <BarRow
                        key={course.courseId}
                        label={course.courseTitle}
                        value={course.count}
                        max={Math.max(
                          ...metrics.courseEnrollmentCounts.map((c) => c.count),
                          1
                        )}
                      />
                    ))
                  ) : (
                    <EmptyState text="No enrollment data yet." />
                  )}
                </div>
              </AnalyticsCard>

              <AnalyticsCard title="Most Completed Courses">
                <div className="space-y-3">
                  {metrics.courseCompletionCounts.length ? (
                    metrics.courseCompletionCounts.map((course) => (
                      <CourseCountItem
                        key={course.courseId}
                        name={course.courseTitle}
                        count={`${course.count} completed`}
                      />
                    ))
                  ) : (
                    <EmptyState text="No completed courses yet." />
                  )}
                </div>
              </AnalyticsCard>

              <AnalyticsCard title="Tier Enrollment Breakdown">
                <div className="grid grid-cols-2 gap-4">
                  <TierBox
                    number={String(metrics.tier1EnrollmentCount)}
                    label="Tier 1 - Foundational"
                  />
                  <TierBox
                    number={String(metrics.tier2EnrollmentCount)}
                    label="Tier 2 - Advanced"
                  />
                </div>

                <p className="mt-4 text-center text-sm text-gray-500">
                  Residents are shown only for the currently selected facility.
                </p>
              </AnalyticsCard>
            </div>

            <div className="mb-10 rounded-xl border-2 border-[#d85a30] bg-[#fff8f5] p-6">
              <div className="mb-2 text-xl font-bold text-[#d85a30]">
                Minimally Engaged Residents
              </div>
              <p className="mb-4 text-sm text-gray-500">
                Residents with no courses started or no activity in the last 14 days.
              </p>

              <div className="space-y-3">
                {metrics.minimallyEngagedResidents.length ? (
                  metrics.minimallyEngagedResidents.map((resident) => (
                    <AtRiskResident
                      key={resident.id}
                      name={resident.name}
                      status={resident.status}
                    />
                  ))
                ) : (
                  <EmptyState text="No minimally engaged residents right now." />
                )}
              </div>
            </div>

            <SectionTitle title="Resident Management" />

            <div className="overflow-hidden rounded-xl bg-white shadow">
              <div className="grid grid-cols-4 gap-4 bg-[#1e3a5f] px-6 py-4 text-sm font-bold uppercase tracking-wide text-white">
                <div>Resident Name / ID</div>
                <div>Courses Enrolled</div>
                <div>Progress</div>
                <div>Action</div>
              </div>

              {metrics.residentRows.length ? (
                metrics.residentRows.map((resident) => (
                  <ResidentRow
                    key={resident.id}
                    id={resident.id}
                    name={resident.name}
                    registerNumber={resident.registerNumber}
                    enrolled={String(resident.enrolledCount)}
                    progress={resident.progress}
                    recommendationCount={resident.activeRecommendations}
                    onRecommend={() => openRecommendModal(resident.id)}
                  />
                ))
              ) : (
                <div className="p-6 text-sm text-gray-500">
                  No residents found for this facility.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isRecommendOpen && selectedResident ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-[#1e3a5f]">
                  Recommend Course
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedResident.first_name} {selectedResident.last_name} • Register #{" "}
                  {selectedResident.register_number}
                </p>
              </div>

              <button
                onClick={closeRecommendModal}
                className="text-sm font-semibold text-gray-500 hover:text-black"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1e3a5f]">
                  Select Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-black"
                >
                  <option value="">Choose a course</option>
                  {courses
                    .filter((course) => {
                      const residentProgress = progressRows.find(
                        (row) =>
                          row.resident_id === selectedResident.id &&
                          row.course_id === course.id
                      );

                      const isCompleted =
                        residentProgress &&
                        (residentProgress.progress_status === "completed" ||
                          Number(residentProgress.progress_percent) === 100);

                      return !isCompleted;
                    })
                    .map((course) => {
                      const alreadyActive = recommendations.some(
                        (r) =>
                          r.resident_id === selectedResident.id &&
                          r.course_id === course.id &&
                          r.recommendation_status === "active"
                      );

                      return (
                        <option
                          key={course.id}
                          value={course.id}
                          disabled={alreadyActive}
                        >
                          {course.course_title}
                          {alreadyActive ? " (already recommended)" : ""}
                        </option>
                      );
                    })}
                </select>
              </div>

              {recommendMessage ? (
                <div className="rounded-md bg-gray-50 px-4 py-3 text-sm text-[#1e3a5f]">
                  {recommendMessage}
                </div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeRecommendModal}
                  className="rounded-md border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>

                <button
                  onClick={handleRecommend}
                  disabled={recommendLoading}
                  className="rounded-md bg-[#d85a30] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {recommendLoading ? "Saving..." : "Recommend"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function DashboardCard({
  label,
  value,
  description,
  accent = "blue",
}: {
  label: string;
  value: string;
  description: string;
  accent?: "blue" | "teal" | "coral" | "green";
}) {
  const accentMap = {
    blue: "border-t-[#378add]",
    teal: "border-t-[#0f6e56]",
    coral: "border-t-[#d85a30]",
    green: "border-t-[#10b981]",
  };

  return (
    <div
      className={`rounded-xl border-t-4 bg-white p-6 shadow ${accentMap[accent]}`}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mb-2 text-4xl font-extrabold text-[#1e3a5f]">{value}</div>
      <div className="text-sm text-gray-500">{description}</div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="mb-5 border-b-2 border-[#378add] pb-2 text-2xl font-bold text-[#1e3a5f]">
      {title}
    </h2>
  );
}

function AnalyticsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h3 className="mb-5 text-xl font-bold text-[#1e3a5f]">{title}</h3>
      {children}
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width = `${(value / max) * 100}%`;

  return (
    <div>
      <div className="mb-1 flex justify-between gap-4 text-sm">
        <span className="truncate font-medium text-[#1e3a5f]">{label}</span>
        <span className="shrink-0 text-gray-500">{value}</span>
      </div>
      <div className="h-3 rounded-full bg-gray-200">
        <div className="h-3 rounded-full bg-[#378add]" style={{ width }} />
      </div>
    </div>
  );
}

function CourseCountItem({
  name,
  count,
}: {
  name: string;
  count: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3">
      <span className="font-medium text-[#1e3a5f]">{name}</span>
      <span className="rounded-full bg-[#378add] px-3 py-1 text-xs font-bold text-white">
        {count}
      </span>
    </div>
  );
}

function TierBox({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-5 text-center">
      <div className="text-4xl font-extrabold text-[#1e3a5f]">{number}</div>
      <div className="mt-2 text-sm text-gray-500">{label}</div>
    </div>
  );
}

function AtRiskResident({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  return (
    <div className="rounded-lg border-l-4 border-[#d85a30] bg-white p-4">
      <div className="font-bold text-[#1e3a5f]">{name}</div>
      <div className="text-sm text-gray-500">{status}</div>
    </div>
  );
}

function ResidentRow({
  id,
  name,
  registerNumber,
  enrolled,
  progress,
  recommendationCount,
  onRecommend,
}: {
  id: number;
  name: string;
  registerNumber: string;
  enrolled: string;
  progress: number;
  recommendationCount: number;
  onRecommend: () => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-4 border-b border-gray-200 px-6 py-4">
      <div>
        <Link
          href={`/dashboard/resident/${id}`}
          className="font-semibold text-[#1e3a5f] hover:underline"
        >
          {name}
        </Link>
        <div className="text-sm text-gray-500">Register #: {registerNumber}</div>
      </div>

      <div className="flex items-center text-[#1e3a5f]">{enrolled}</div>

      <div className="flex items-center">
        <div className="w-full">
          <div className="mb-1 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-[#378add]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">{progress}%</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRecommend}
          className="rounded-md bg-[#d85a30] px-4 py-2 text-sm font-semibold text-white"
        >
          Recommend
        </button>
        {recommendationCount > 0 ? (
          <span className="text-xs text-gray-500">
            {recommendationCount} active
          </span>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-sm text-gray-500">{text}</div>;
}