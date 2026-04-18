"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Resident = {
  id: number;
  first_name: string;
  last_name: string;
  register_number: string;
  facility_id: number | null;
  last_login_at: string | null;
};

type Facility = {
  id: number;
  facility_name: string;
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
  staff_id?: string;
};

type Certificate = {
  resident_id: number;
  course_id: number;
  certificate_url: string | null;
  issued_at: string | null;
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

export default function ResidentProfilePage() {
  const router = useRouter();
  const params = useParams();
  const residentId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [resident, setResident] = useState<Resident | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffUserId, setStaffUserId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendMessage, setRecommendMessage] = useState("");

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
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

      const [{ data: residentData, error: residentError }, { data: coursesData }] =
        await Promise.all([
          supabase
            .from("residents")
            .select(
              "id, first_name, last_name, register_number, facility_id, last_login_at"
            )
            .eq("id", residentId)
            .single(),
          supabase
            .from("courses")
            .select("id, course_title, tier, display_order")
            .order("display_order", { ascending: true }),
        ]);

      if (residentError || !residentData) {
        setErrorMessage("Resident not found or access denied.");
        setLoading(false);
        return;
      }

      setResident(residentData as Resident);
      setCourses((coursesData || []) as Course[]);

      const facilityId = (residentData as Resident).facility_id;

      const [
        { data: facilityData },
        { data: enrollmentData },
        { data: progressData },
        { data: recommendationData },
        { data: certificateData },
      ] = await Promise.all([
        facilityId
          ? supabase
              .from("facilities")
              .select("id, facility_name")
              .eq("id", facilityId)
              .single()
          : Promise.resolve({ data: null }),
        supabase
          .from("enrollments")
          .select(
            "resident_id, course_id, enrollment_status, enrolled_at, completed_at, last_activity_at"
          )
          .eq("resident_id", residentId),
        supabase
          .from("progress")
          .select(
            "resident_id, course_id, progress_percent, progress_status, updated_at"
          )
          .eq("resident_id", residentId),
        supabase
          .from("recommendations")
          .select(
            "id, resident_id, course_id, recommendation_status, recommended_at, staff_id"
          )
          .eq("resident_id", residentId),
        supabase
          .from("certificates")
          .select("resident_id, course_id, certificate_url, issued_at")
          .eq("resident_id", residentId),
      ]);

      setFacility((facilityData as Facility) || null);
      setEnrollments((enrollmentData || []) as Enrollment[]);
      setProgressRows((progressData || []) as ProgressRow[]);
      setRecommendations((recommendationData || []) as Recommendation[]);
      setCertificates((certificateData || []) as Certificate[]);

      setLoading(false);
    };

    if (!Number.isNaN(residentId)) {
      loadPage();
    } else {
      setErrorMessage("Invalid resident ID.");
      setLoading(false);
    }
  }, [residentId, router]);

  const profileData = useMemo(() => {
    const courseById = new Map(courses.map((c) => [c.id, c]));
    const progressByCourseId = new Map(
      progressRows.map((p) => [p.course_id, p])
    );
    const certByCourseId = new Map(certificates.map((c) => [c.course_id, c]));
    const recByCourseId = new Map(
      recommendations
        .filter((r) => r.recommendation_status === "active")
        .map((r) => [r.course_id, r])
    );
    const enrollmentByCourseId = new Map(
      enrollments.map((e) => [e.course_id, e])
    );

    const enrolledCount = enrollments.length;

    const allCourses = enrollments
      .map((enrollment) => {
        const course = courseById.get(enrollment.course_id);
        const progress = progressByCourseId.get(enrollment.course_id);
        const cert = certByCourseId.get(enrollment.course_id);
        const rec = recByCourseId.get(enrollment.course_id);

        return {
          courseId: enrollment.course_id,
          courseTitle: course?.course_title || `Course ${enrollment.course_id}`,
          tier: course?.tier || "—",
          progressPercent: Number(progress?.progress_percent || 0),
          progressStatus: progress?.progress_status || "not_started",
          enrolledAt: enrollment.enrolled_at,
          completedAt: enrollment.completed_at,
          lastActivityAt:
            enrollment.last_activity_at || progress?.updated_at || null,
          hasCertificate: Boolean(cert),
          certificateUrl: cert?.certificate_url || null,
          certificateIssuedAt: cert?.issued_at || null,
          isRecommended: Boolean(rec),
        };
      })
      .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));

    const completedCourses = allCourses.filter(
      (course) =>
        course.progressStatus === "completed" || course.progressPercent === 100
    );

    const currentCourses = allCourses.filter(
      (course) =>
        !(course.progressStatus === "completed" || course.progressPercent === 100)
    );

    const completedCount = completedCourses.length;
    const currentCoursesCount = currentCourses.length;
    const certificateCount = certificates.length;

    const activeRecommendations = recommendations.filter(
      (r) => r.recommendation_status === "active"
    );

    const certificateCards = certificates
      .map((cert) => {
        const course = courseById.get(cert.course_id);
        return {
          courseId: cert.course_id,
          courseTitle: course?.course_title || `Course ${cert.course_id}`,
          issuedAt: cert.issued_at,
          certificateUrl: cert.certificate_url,
        };
      })
      .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));

    const activityTimeline = [
      ...activeRecommendations.map((rec) => {
        const course = courseById.get(rec.course_id);
        return {
          label: "Recommended",
          detail: course?.course_title || `Course ${rec.course_id}`,
          date: rec.recommended_at,
        };
      }),
      ...enrollments.map((enrollment) => {
        const course = courseById.get(enrollment.course_id);
        return {
          label: "Enrolled",
          detail: course?.course_title || `Course ${enrollment.course_id}`,
          date: enrollment.enrolled_at,
        };
      }),
      ...certificates.map((cert) => {
        const course = courseById.get(cert.course_id);
        return {
          label: "Certificate Earned",
          detail: course?.course_title || `Course ${cert.course_id}`,
          date: cert.issued_at,
        };
      }),
    ]
      .filter((item) => item.date)
      .sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0;
        const bTime = b.date ? new Date(b.date).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10);

    const recommendableCourses = courses.filter((course) => {
      const progress = progressByCourseId.get(course.id);
      const isCompleted =
        progress &&
        (progress.progress_status === "completed" ||
          Number(progress.progress_percent) === 100);

      return !isCompleted;
    });

    return {
      enrolledCount,
      completedCount,
      currentCoursesCount,
      certificateCount,
      currentCourses,
      completedCourses,
      activeRecommendations,
      certificateCards,
      activityTimeline,
      recommendableCourses,
      enrollmentByCourseId,
    };
  }, [courses, enrollments, progressRows, recommendations, certificates]);

  const openRecommendModal = () => {
    setSelectedCourseId("");
    setRecommendMessage("");
    setIsRecommendOpen(true);
  };

  const closeRecommendModal = () => {
    setIsRecommendOpen(false);
    setSelectedCourseId("");
    setRecommendMessage("");
    setRecommendLoading(false);
  };

  const handleRecommend = async () => {
    if (!resident || !selectedCourseId || !staffUserId) {
      setRecommendMessage("Please select a course.");
      return;
    }

    const courseIdNum = Number(selectedCourseId);

    const alreadyActive = recommendations.some(
      (r) =>
        r.resident_id === resident.id &&
        r.course_id === courseIdNum &&
        r.recommendation_status === "active"
    );

    if (alreadyActive) {
      setRecommendMessage("This course is already recommended.");
      return;
    }

    const progress = progressRows.find(
      (row) => row.course_id === courseIdNum && row.resident_id === resident.id
    );

    const isCompleted =
      progress &&
      (progress.progress_status === "completed" ||
        Number(progress.progress_percent) === 100);

    if (isCompleted) {
      setRecommendMessage("Completed courses cannot be recommended.");
      return;
    }

    setRecommendLoading(true);
    setRecommendMessage("");

    const { data, error } = await supabase
      .from("recommendations")
      .insert({
        resident_id: resident.id,
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="text-lg font-semibold text-[#1e3a5f]">
          Loading resident profile...
        </div>
      </main>
    );
  }

  if (!resident) {
    return (
      <main className="min-h-screen bg-[#f8f9fa] p-10">
        <p className="text-red-600">{errorMessage || "Resident not found."}</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-[#378add] hover:underline"
        >
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#1e3a5f] px-8 py-4 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-white">RLC</div>
            <div className="text-sm text-blue-100">Resident Profile</div>
          </div>

          <div className="text-right text-sm text-blue-100">
            <div className="font-semibold text-white">{staffEmail}</div>
            <div>{facility?.facility_name || "Facility"}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-block text-sm font-semibold text-[#378add] hover:underline"
            >
              ← Back to dashboard
            </Link>

            <h1 className="text-4xl font-bold text-[#1e3a5f]">
              {resident.first_name} {resident.last_name}
            </h1>

            <p className="mt-2 text-gray-500">
              Register #: {resident.register_number} •{" "}
              {facility?.facility_name || "No facility"} • Last login:{" "}
              {fmtDate(resident.last_login_at)}
            </p>
          </div>

          <button
            onClick={openRecommendModal}
            className="rounded-md bg-[#d85a30] px-5 py-3 text-sm font-semibold text-white"
          >
            Recommend Course
          </button>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <ProfileCard
            label="Courses Enrolled"
            value={String(profileData.enrolledCount)}
            accent="blue"
          />
          <ProfileCard
            label="Current Courses"
            value={String(profileData.currentCoursesCount)}
            accent="coral"
          />
          <ProfileCard
            label="Courses Completed"
            value={String(profileData.completedCount)}
            accent="teal"
          />
          <ProfileCard
            label="Certificates Earned"
            value={String(profileData.certificateCount)}
            accent="green"
          />
        </div>

        <SectionTitle title="Recommended Courses" />

        <div className="mb-10 rounded-xl bg-white p-6 shadow">
          {profileData.activeRecommendations.length ? (
            <div className="space-y-3">
              {profileData.activeRecommendations.map((rec, index) => {
                const course = courses.find((c) => c.id === rec.course_id);
                return (
                  <div
                    key={`${rec.course_id}-${index}`}
                    className="rounded-lg bg-gray-50 px-4 py-3"
                  >
                    <div className="font-semibold text-[#1e3a5f]">
                      {course?.course_title || `Course ${rec.course_id}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      Added: {fmtDate(rec.recommended_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No active recommendations.
            </div>
          )}
        </div>

        <SectionTitle title="Current Courses" />

        <div className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {profileData.currentCourses.length ? (
            profileData.currentCourses.map((course) => (
              <div key={course.courseId} className="rounded-xl bg-white p-6 shadow">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold text-[#1e3a5f]">
                      {course.courseTitle}
                    </div>
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
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-white p-6 shadow">
              <EmptyState text="No current courses." />
            </div>
          )}
        </div>

        <SectionTitle title="Completed Courses" />

        <div className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {profileData.completedCourses.length ? (
            profileData.completedCourses.map((course) => (
              <div
                key={course.courseId}
                className="rounded-xl border border-[#0f6e56]/20 bg-white p-6 shadow"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold text-[#1e3a5f]">
                      {course.courseTitle}
                    </div>
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
              <EmptyState text="No completed courses." />
            </div>
          )}
        </div>

        <SectionTitle title="Certificates" />

        <div className="mb-10 rounded-xl bg-white p-6 shadow">
          {profileData.certificateCards.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {profileData.certificateCards.map((course) => (
                <div
                  key={course.courseId}
                  className="rounded-xl border border-[#0f6e56]/20 bg-[#f7fffb] p-5"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0f6e56]">
                    Certificate Earned
                  </div>
                  <div className="text-lg font-bold text-[#1e3a5f]">
                    {course.courseTitle}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Issued: {fmtDate(course.issuedAt)}
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
              ))}
            </div>
          ) : (
            <EmptyState text="No certificates yet." />
          )}
        </div>

        <SectionTitle title="Activity Timeline" />

        <div className="mb-10 rounded-xl bg-white p-6 shadow">
          {profileData.activityTimeline.length ? (
            <div className="space-y-4">
              {profileData.activityTimeline.map((item, index) => (
                <div
                  key={`${item.label}-${item.detail}-${index}`}
                  className="flex gap-4"
                >
                  <div className="mt-1 h-3 w-3 rounded-full bg-[#378add]" />
                  <div>
                    <div className="font-semibold text-[#1e3a5f]">
                      {item.label}
                    </div>
                    <div className="text-sm text-gray-600">{item.detail}</div>
                    <div className="text-sm text-gray-500">
                      {fmtDate(item.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No activity yet." />
          )}
        </div>
      </div>

      {isRecommendOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-[#1e3a5f]">
                  Recommend Course
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {resident.first_name} {resident.last_name} • Register #{" "}
                  {resident.register_number}
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
                  {profileData.recommendableCourses.map((course) => {
                    const alreadyActive = recommendations.some(
                      (r) =>
                        r.resident_id === resident.id &&
                        r.course_id === course.id &&
                        r.recommendation_status === "active"
                    );

                    return (
                      <option
                        key={course.id}
                        value={course.id}
                        disabled={alreadyActive}
                      >
                        {course.tier ? `${course.tier}: ` : ""}{course.course_title}
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

function ProfileCard({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: string;
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