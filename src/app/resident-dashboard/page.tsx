"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ResidentSidebar from "../components/ResidentSidebar";

type Resident = {
  id: number;
  first_name: string;
  last_name: string;
  register_number: string;
};

type Enrollment = {
  resident_id: number;
  course_id: number;
  enrollment_status?: string;
  enrolled_at: string | null;
  completed_at: string | null;
  last_activity_at?: string | null;
};

type ProgressRow = {
  resident_id: number;
  course_id: number;
  progress_percent: number;
  progress_status: string;
  updated_at: string | null;
};

type Recommendation = {
  resident_id: number;
  course_id: number;
  recommendation_status: string;
  recommended_at: string | null;
};

type Certificate = {
  id: number;
  resident_id: number;
  course_id: number;
  certificate_url: string | null;
  issued_at: string | null;
};

type Course = {
  id: number;
  course_title: string;
  tier?: "Tier 1" | "Tier 2";
  display_order?: number | null;
    short_description?: string | null;
};

type DashboardResponse = {
  resident: Resident | null;
  enrollments: Enrollment[];
  progress: ProgressRow[];
  recommendations: Recommendation[];
  certificates: Certificate[];
  courses: Course[];
};

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function displayStatus(progressStatus: string, progressPercent: number) {
  if (progressStatus === "completed" || progressPercent === 100) return "Completed";
  if (progressStatus === "in_progress" || (progressPercent > 0 && progressPercent < 100)) {
    return "In Progress";
  }
  return "Not Started";
}

function statusTextClass(progressStatus: string, progressPercent: number) {
  if (progressStatus === "completed" || progressPercent === 100) return "text-[#0f6e56]";
  if (progressStatus === "in_progress" || (progressPercent > 0 && progressPercent < 100)) {
    return "text-[#d85a30]";
  }
  return "text-gray-500";
}

function statusBarClass(progressStatus: string, progressPercent: number) {
  if (progressStatus === "completed" || progressPercent === 100) return "bg-[#0f6e56]";
  if (progressStatus === "in_progress" || (progressPercent > 0 && progressPercent < 100)) {
    return "bg-[#d85a30]";
  }
  return "bg-[#378add]";
}

function statusBadgeClass(status: "completed" | "current" | "recommended" | "available") {
  if (status === "completed") return "bg-[#ecfdf5] text-[#0f6e56]";
  if (status === "current") return "bg-[#eff6ff] text-[#378add]";
  if (status === "recommended") return "bg-[#fff1eb] text-[#d85a30]";
  return "bg-gray-100 text-gray-600";
}

function displayCourseStatus(status: "completed" | "current" | "recommended" | "available") {
  if (status === "completed") return "Completed";
  if (status === "current") return "Current";
  if (status === "recommended") return "Recommended";
  return "Available";
}

export default function ResidentDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [enrollLoadingId, setEnrollLoadingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const loadDashboard = async () => {
    const res = await fetch("/api/resident-dashboard");
    const result = await res.json();

    if (!res.ok || !result?.resident) {
      setErrorMessage(result?.error || "Unable to load resident dashboard.");
      setLoading(false);
      return;
    }

    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const computed = useMemo(() => {
    if (!data) {
      return {
        enrolledCount: 0,
        completedCount: 0,
        certificateCount: 0,
        inProgressCount: 0,
        recommendedCourses: [] as Array<{
          courseId: number;
          title: string;
          recommendedAt: string | null;
        }>,
        currentCourses: [] as Array<{
          courseId: number;
          title: string;
          tier: string;
          progressPercent: number;
          progressStatus: string;
          lastActivityAt: string | null;
          isRecommended: boolean;
          hasCertificate: boolean;
        }>,
        completedCourses: [] as Array<{
          courseId: number;
          title: string;
          tier: string;
          completedAt: string | null;
          certificateUrl: string | null;
        }>,
        certificateCourses: [] as Array<{
          courseId: number;
          title: string;
          issuedAt: string | null;
          certificateUrl: string | null;
        }>,
        allCourses: [] as Array<{
          id: number;
          title: string;
          tier: string;
          description: string;
          status: "completed" | "current" | "recommended" | "available";
        }>,
      };
    }

    const courseById = new Map(data.courses.map((course) => [course.id, course]));
    const progressByCourseId = new Map(data.progress.map((row) => [row.course_id, row]));
    const certificateByCourseId = new Map(
      data.certificates.map((row) => [row.course_id, row])
    );
    const enrollmentByCourseId = new Map(
      data.enrollments.map((row) => [row.course_id, row])
    );

    const activeRecommendationCourseIds = new Set(
      data.recommendations
        .filter((row) => row.recommendation_status === "active")
        .map((row) => row.course_id)
    );

    const allEnrolledCourses = data.enrollments
      .map((enrollment) => {
        const course = courseById.get(enrollment.course_id);
        const progress = progressByCourseId.get(enrollment.course_id);
        const certificate = certificateByCourseId.get(enrollment.course_id);

        return {
          courseId: enrollment.course_id,
          title: course?.course_title || `Course ${enrollment.course_id}`,
          tier: course?.tier || "—",
          progressPercent: Number(progress?.progress_percent || 0),
          progressStatus: progress?.progress_status || "not_started",
          lastActivityAt:
            enrollment.last_activity_at || progress?.updated_at || null,
          isRecommended: activeRecommendationCourseIds.has(enrollment.course_id),
          hasCertificate: Boolean(certificate),
          certificateUrl: certificate?.certificate_url || null,
          completedAt: enrollment.completed_at,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));

    const completedCourses = allEnrolledCourses
      .filter(
        (course) =>
          course.progressStatus === "completed" || course.progressPercent === 100
      )
      .map((course) => ({
        courseId: course.courseId,
        title: course.title,
        tier: course.tier,
        completedAt: course.completedAt || null,
        certificateUrl: course.certificateUrl,
      }));

    const currentCourses = allEnrolledCourses.filter(
      (course) =>
        !(course.progressStatus === "completed" || course.progressPercent === 100)
    );

    const recommendedCourses = data.recommendations
      .filter((row) => row.recommendation_status === "active")
      .map((row) => {
        const course = courseById.get(row.course_id);
        return {
          courseId: row.course_id,
          title: course?.course_title || `Course ${row.course_id}`,
          recommendedAt: row.recommended_at,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));

    const certificateCourses = data.certificates
      .map((row) => {
        const course = courseById.get(row.course_id);
        return {
          courseId: row.course_id,
          title: course?.course_title || `Course ${row.course_id}`,
          issuedAt: row.issued_at,
          certificateUrl: row.certificate_url,
          certificateId: row.id,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));

    const allCourses = data.courses
      .map((course) => {
        const enrollment = enrollmentByCourseId.get(course.id);
        const progress = progressByCourseId.get(course.id);

        let status: "completed" | "current" | "recommended" | "available" =
          "available";

        if (
          progress &&
          (progress.progress_status === "completed" ||
            Number(progress.progress_percent) === 100)
        ) {
          status = "completed";
        } else if (enrollment) {
          status = "current";
        } else if (activeRecommendationCourseIds.has(course.id)) {
          status = "recommended";
        }

        return {
          id: course.id,
          title: course.course_title,
          tier: course.tier || "—",
          description: course.short_description || "Build practical skills that support reentry and daily life.",
          status,
        };
      })
      .sort((a, b) => {
        const aOrder =
          data.courses.find((course) => course.id === a.id)?.display_order ?? 9999;
        const bOrder =
          data.courses.find((course) => course.id === b.id)?.display_order ?? 9999;
        return aOrder - bOrder;
      });

    return {
      enrolledCount: data.enrollments.length,
      completedCount: completedCourses.length,
      certificateCount: data.certificates.length,
      inProgressCount: currentCourses.filter(
        (course) =>
          course.progressStatus === "in_progress" ||
          (course.progressPercent > 0 && course.progressPercent < 100)
      ).length,
      recommendedCourses,
      currentCourses,
      completedCourses,
      certificateCourses,
      allCourses,
    };
  }, [data]);

  const handleLogout = async () => {
    await fetch("/api/resident-logout", { method: "POST" });
    router.push("/");
  };

  const handleUnenroll = async (courseId: number, courseTitle: string) => {
    const confirmed = window.confirm("Remove " + courseTitle + " from your courses? Your progress for this course will be deleted.");
    if (!confirmed) return;

    const res = await fetch("/api/resident-unenroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId }),
    });
    const result = await res.json();
    if (!res.ok) {
      setToastMessage(result.error || "Unable to remove course.");
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2500);
      return;
    }
    setToastMessage("Removed: " + courseTitle);
    setToastVisible(true);
    await loadDashboard();
    setTimeout(() => setToastVisible(false), 2200);
  };

  const handleEnroll = async (courseId: number, courseTitle: string) => {
    setEnrollLoadingId(courseId);

    const res = await fetch("/api/resident-enroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        course_id: courseId,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setToastMessage(result.error || "Unable to add course.");
      setToastVisible(true);
      setEnrollLoadingId(null);
      setTimeout(() => setToastVisible(false), 2000);
      return;
    }

    setToastMessage(`Added to current courses: ${courseTitle}`);
    setToastVisible(true);
    await loadDashboard();
    setEnrollLoadingId(null);
    setTimeout(() => setToastVisible(false), 2200);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="text-lg font-semibold text-[#1e3a5f]">
          Loading your dashboard...
        </div>
      </main>
    );
  }

  if (!data?.resident) {
    return (
      <main className="min-h-screen bg-[#f8f9fa] px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
          <h1 className="mb-3 text-2xl font-bold text-[#1e3a5f]">
            Unable to load dashboard
          </h1>
          <p className="mb-6 text-red-500">
            {errorMessage || "Resident not found."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="rounded-md bg-[#378add] px-5 py-3 font-semibold text-white"
          >
            Back to Home
          </button>
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
            <div className="text-sm text-blue-100">Resident Dashboard</div>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-md bg-[#d85a30] px-4 py-2 text-sm font-semibold text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="flex gap-6">
          <ResidentSidebar />
          <div className="flex-1 min-w-0">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#1e3a5f]">
            Welcome, {data.resident.first_name}
          </h1>
          <p className="mt-2 text-gray-500">
            Register #: {data.resident.register_number}
          </p>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Courses Enrolled" value={computed.enrolledCount} accent="blue" />
          <StatCard label="Courses Completed" value={computed.completedCount} accent="teal" />
          <StatCard label="Certificates Earned" value={computed.certificateCount} accent="green" />
          <StatCard label="In Progress" value={computed.inProgressCount} accent="coral" />
        </div>

        <SectionTitle title="Recommended Courses" />

        <div className="mb-10 rounded-xl bg-white p-6 shadow">
          {computed.recommendedCourses.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {computed.recommendedCourses.map((course) => (
                <div
                  key={course.courseId}
                  className="rounded-xl border border-[#d85a30]/20 bg-[#fff8f5] p-5"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#d85a30]">
                    Recommended
                  </div>
                  <div className="text-lg font-bold text-[#1e3a5f]">{course.title}</div>
                  <div className="mt-2 text-sm text-gray-500">
                    Added: {fmtDate(course.recommendedAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No recommended courses yet." />
          )}
        </div>

        <SectionTitle title="Current Courses" />

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {computed.currentCourses.length ? (
            computed.currentCourses.map((course) => (
              <div key={course.courseId} className="rounded-xl bg-white p-6 shadow">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold text-[#1e3a5f]">{course.title}</div>
                    <div className="mt-1 text-sm text-gray-500">{course.tier}</div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {course.isRecommended ? (
                      <span className="rounded-full bg-[#fff1eb] px-3 py-1 text-xs font-semibold text-[#d85a30]">
                        Recommended
                      </span>
                    ) : null}

                    {course.hasCertificate ? (
                      <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-semibold text-[#0f6e56]">
                        Certificate
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className={`font-medium ${statusTextClass(course.progressStatus, course.progressPercent)}`}>
                    {displayStatus(course.progressStatus, course.progressPercent)}
                  </span>
                  <span className="text-gray-500">{course.progressPercent}%</span>
                </div>

                <div className="mb-3 h-2 rounded-full bg-gray-200">
                  <div
                    className={`h-3 rounded-full ${statusBarClass(course.progressStatus, course.progressPercent)}`}
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>

                <div className="text-xs text-gray-500">
                  Last activity: {fmtDate(course.lastActivityAt)}
                </div>

                <button
                  onClick={() => router.push(`/course/${course.courseId}`)}
                  className="mt-3 w-full rounded-md bg-[#BA7517] px-4 py-2.5 text-sm font-bold text-white"
                >
                  {course.progressPercent > 0 ? "Continue Learning" : "Start Learning"}
                </button>

                <div className="mt-3 text-center">
                  <button
                    onClick={() => handleUnenroll(course.courseId, course.title)}
                    className="text-[11px] font-normal text-gray-400 hover:text-gray-600 hover:underline"
                  >
                    Remove course
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-white p-6 shadow">
              <EmptyState text="No current courses yet." />
            </div>
          )}
        </div>

        <SectionTitle title="Completed Courses" />

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {computed.completedCourses.length ? (
            computed.completedCourses.map((course) => (
              <div
                key={course.courseId}
                className="rounded-xl border border-[#0f6e56]/20 bg-white p-6 shadow"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold text-[#1e3a5f]">{course.title}</div>
                    <div className="mt-1 text-sm text-gray-500">{course.tier}</div>
                  </div>

                  <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-semibold text-[#0f6e56]">
                    Completed
                  </span>
                </div>

                <div className="text-xs text-gray-500">
                  Completed: {fmtDate(course.completedAt)}
                </div>

                <a
                  href={`/course/${course.courseId}/certificate?id=${course.certificateId || ''}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0f6e56] px-4 py-2 text-sm font-semibold text-white"
                  style={{ boxShadow: "0 2px 8px rgba(15,110,86,0.25)" }}
                >
                  View Certificate
                </a>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-white p-6 shadow">
              <EmptyState text="No completed courses yet." />
            </div>
          )}
        </div>

        <div className="mb-10 rounded-3xl p-7" style={{ background: "linear-gradient(135deg, #F0E8FE 0%, #FFF3E0 50%, #FFE8D9 100%)", border: "1px solid #E5D9F7", boxShadow: "0 4px 20px rgba(124, 58, 237, 0.08), 0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #7F77DD 0%, #BA7517 100%)", boxShadow: "0 4px 12px rgba(127, 119, 221, 0.3)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-wider text-[#1e3a5f]">AI HUB CENTER</h2>
              <p className="text-sm text-[#5F5E5A]">Smart tools to help you tackle real life tasks.</p>
            </div>
          </div>



        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <button onClick={() => router.push("/ai-hub/job-career")} className="rounded-3xl bg-white p-6 text-left transition-transform hover:-translate-y-0.5" style={{ boxShadow: "0 6px 20px rgba(186,117,23,0.12), 0 2px 6px rgba(0,0,0,0.05)", border: "1px solid #F3E6D5" }}>

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#FAEEDA" }}>

              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-3V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>

            </div>

            <div className="mb-1 text-lg font-bold text-[#1e3a5f]">Job & career</div>

            <div className="mb-3 text-sm text-[#888780]">Resume, cover letter, interview practice, and job posting help.</div>

            <div className="text-xs font-medium text-[#BA7517]">4 tools &rarr;</div>

          </button>



          <button onClick={() => router.push("/ai-hub/money-benefits")} className="rounded-3xl bg-white p-6 text-left transition-transform hover:-translate-y-0.5" style={{ boxShadow: "0 6px 20px rgba(15,110,86,0.12), 0 2px 6px rgba(0,0,0,0.05)", border: "1px solid #D6EFE3" }}>

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#E1F5EE" }}>

              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="18" cy="15" r="1.5"/></svg>

            </div>

            <div className="mb-1 text-lg font-bold text-[#1e3a5f]">Money & benefits</div>

            <div className="mb-3 text-sm text-[#888780]">Build a budget and understand paystubs or tax forms.</div>

            <div className="text-xs font-medium text-[#0F6E56]">2 tools &rarr;</div>

          </button>



          <button onClick={() => router.push("/ai-hub/housing")} className="rounded-3xl bg-white p-6 text-left transition-transform hover:-translate-y-0.5" style={{ boxShadow: "0 6px 20px rgba(127,119,221,0.12), 0 2px 6px rgba(0,0,0,0.05)", border: "1px solid #E0DCF7" }}>

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#EEEDFE" }}>

              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3C3489" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>

            </div>

            <div className="mb-1 text-lg font-bold text-[#1e3a5f]">Housing</div>

            <div className="mb-3 text-sm text-[#888780]">Plan for a place to live and understand your lease.</div>

            <div className="text-xs font-medium text-[#3C3489]">2 tools &rarr;</div>

          </button>



          <button onClick={() => router.push("/ai-hub/life-navigation")} className="rounded-3xl bg-white p-6 text-left transition-transform hover:-translate-y-0.5" style={{ boxShadow: "0 6px 20px rgba(216,90,48,0.12), 0 2px 6px rgba(0,0,0,0.05)", border: "1px solid #F5D4C4" }}>

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#FAECE7" }}>

              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#712B13" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>

            </div>

            <div className="mb-1 text-lg font-bold text-[#1e3a5f]">Life navigation</div>

            <div className="mb-3 text-sm text-[#888780]">Translate documents, practice hard talks, find resources.</div>

            <div className="text-xs font-medium text-[#712B13]">5 tools &rarr;</div>

          </button>

        </div>
        </div>

        {toastVisible ? (
          <div className="fixed bottom-6 right-6 rounded-lg bg-[#1e3a5f] px-5 py-4 text-sm font-medium text-white shadow-lg">
            {toastMessage}
          </div>
        ) : null}
      </div>
          </div>
        </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: number;
  accent?: "blue" | "teal" | "coral" | "green";
}) {
  const accentConfig: Record<string, { border: string; bg: string; accent: string }> = {
    blue: { border: "#378add", bg: "#E6F1FB", accent: "#185FA5" },
    teal: { border: "#0f6e56", bg: "#E1F5EE", accent: "#085041" },
    coral: { border: "#d85a30", bg: "#FAECE7", accent: "#993C1D" },
    green: { border: "#10b981", bg: "#EAF3DE", accent: "#3B6D11" },
  };
  const cfg = accentConfig[accent];

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white p-7"
      style={{
        boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        borderTop: `4px solid ${cfg.border}`,
      }}
    >
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-50"
        style={{ background: cfg.bg }}
      />
      <div className="relative">
        <div className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: cfg.accent }}>
          {label}
        </div>
        <div className="text-5xl font-extrabold text-[#1e3a5f]">{value}</div>
      </div>
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

function EmptyState({ text }: { text: string }) {
  return <div className="text-sm text-gray-500">{text}</div>;
}