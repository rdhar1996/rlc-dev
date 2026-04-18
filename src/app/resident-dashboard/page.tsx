"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

        <div className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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

                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className={`font-medium ${statusTextClass(course.progressStatus, course.progressPercent)}`}>
                    {displayStatus(course.progressStatus, course.progressPercent)}
                  </span>
                  <span className="text-gray-500">{course.progressPercent}%</span>
                </div>

                <div className="mb-4 h-3 rounded-full bg-gray-200">
                  <div
                    className={`h-3 rounded-full ${statusBarClass(course.progressStatus, course.progressPercent)}`}
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>

                <div className="text-sm text-gray-500">
                  Last activity: {fmtDate(course.lastActivityAt)}
                </div>

                <button
                  onClick={() => router.push(`/course/${course.courseId}`)}
                  className="mt-4 w-full rounded-md bg-[#BA7517] px-4 py-3 text-sm font-bold text-white"
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

        <div className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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

                <div className="text-sm text-gray-500">
                  Completed: {fmtDate(course.completedAt)}
                </div>

                {course.certificateUrl ? (
                  <a
                    href={course.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-semibold text-[#378add] hover:underline"
                  >
                    View Certificate
                  </a>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-white p-6 shadow">
              <EmptyState text="No completed courses yet." />
            </div>
          )}
        </div>

        <SectionTitle title="Certificates" />

        <div className="mb-10 rounded-xl bg-white p-6 shadow">
          {computed.certificateCourses.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {computed.certificateCourses.map((course) => (
                <div
                  key={course.courseId}
                  className="rounded-xl border border-[#0f6e56]/20 bg-[#f7fffb] p-5"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0f6e56]">
                    Certificate Earned
                  </div>
                  <div className="text-lg font-bold text-[#1e3a5f]">{course.title}</div>
                  <div className="mt-2 text-sm text-gray-500">
                    Issued: {fmtDate(course.issuedAt)}
                  </div>
                  {course.certificateUrl ? (
                    <a
                      href={`/course/${course.courseId}/certificate?id=${course.certificateId || ''}`}
                      className="mt-4 inline-block text-sm font-semibold text-[#378add] hover:underline"
                    >
                      View Certificate
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No certificates yet." />
          )}
        </div>

        <SectionTitle title="All Courses" />

        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-5">
            {computed.allCourses.map((course) => (
              <div
                key={course.id}
                className="w-[260px] shrink-0 rounded-xl bg-white p-5 shadow"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="text-lg font-bold text-[#1e3a5f]">{course.title}</div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadgeClass(course.status)}`}>
                    {displayCourseStatus(course.status)}
                  </span>
                </div>

                <div className="mb-2 text-sm text-gray-500">{course.tier}</div>

                <p className="mb-5 text-sm text-gray-600">
                  {course.description}
                </p>

                <button
                  disabled={
                    course.status === "completed" ||
                    enrollLoadingId === course.id
                  }
                  onClick={() => course.status === "current" ? router.push(`/course/${course.id}`) : handleEnroll(course.id, course.title)}
                  className="w-full rounded-md bg-[#378add] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {enrollLoadingId === course.id
                    ? "Adding..."
                    : course.status === "completed"
                    ? "Completed"
                    : course.status === "current"
                    ? "Start Learning"
                    : "Enroll"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {toastVisible ? (
          <div className="fixed bottom-6 right-6 rounded-lg bg-[#1e3a5f] px-5 py-4 text-sm font-medium text-white shadow-lg">
            {toastMessage}
          </div>
        ) : null}
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
  const accentMap = {
    blue: "border-t-[#378add]",
    teal: "border-t-[#0f6e56]",
    coral: "border-t-[#d85a30]",
    green: "border-t-[#10b981]",
  };

  return (
    <div className={`rounded-xl border-t-4 bg-white p-6 shadow ${accentMap[accent]}`}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-4xl font-extrabold text-[#1e3a5f]">{value}</div>
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