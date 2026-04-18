"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

type CertData = {
  certificate_id: number;
  resident_name: string;
  course_title: string;
  course_tier: string;
  course_hours: number;
  facility_name: string;
  issued_at: string;
};

export default function CertificatePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;
  const certId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CertData | null>(null);

  useEffect(() => {
    async function load() {
      if (!certId) {
        router.push(`/course/${courseId}`);
        return;
      }
      const res = await fetch(`/api/certificate-data?id=${certId}`);
      const result = await res.json();
      if (!res.ok) {
        router.push(`/course/${courseId}`);
        return;
      }
      setData(result);
      setLoading(false);
    }
    load();
  }, [certId, courseId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: "#F5F3EE" }}>
        <div className="text-lg font-semibold text-[#1e3a5f]">Loading certificate...</div>
      </main>
    );
  }

  if (!data) return null;

  const issuedDate = new Date(data.issued_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen" style={{ background: "#F5F3EE" }}>
      {/* Load cursive font */}
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />

      {/* Header - hidden when printing */}
      <div className="print:hidden">
        <header className="bg-[#1e3a5f] px-8 py-4" style={{ boxShadow: "0 4px 16px rgba(30,58,95,0.2)" }}>
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div>
              <Link href="/resident-dashboard" className="cursor-pointer hover:opacity-80 transition-opacity"><div className="text-2xl font-extrabold text-white">RLC</div></Link>
              <div className="text-sm text-blue-100">Certificate</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="rounded-lg bg-[#0f6e56] px-5 py-2 text-sm font-semibold text-white"
              >
                Print Certificate
              </button>
              <button
                onClick={() => router.push("/resident-dashboard")}
                className="rounded-lg bg-[#378add] px-5 py-2 text-sm font-semibold text-white"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Certificate */}
      <div className="mx-auto max-w-4xl px-8 py-10 print:px-0 print:py-0">
        <div
          className="rounded-xl p-2"
          style={{ background: "#1e3a5f", boxShadow: "0 6px 28px rgba(0,0,0,0.15)" }}
        >
          <div
            className="relative overflow-hidden"
            style={{ background: "#FFFDF7", border: "2px solid #BA7517", borderRadius: "8px" }}
          >
            {/* Top left corner */}
            <svg style={{ position: "absolute", top: 0, left: 0 }} width="150" height="150" viewBox="0 0 150 150">
              <path d="M4,130 Q4,75 12,50 Q18,32 34,20 Q52,10 78,6 Q96,4 130,4" stroke="#BA7517" strokeWidth="1.5" fill="none" />
              <path d="M8,110 Q10,65 18,44 Q26,28 42,18 Q58,10 78,9 Q92,7 110,7" stroke="#EF9F27" strokeWidth="1" fill="none" />
              <path d="M50,4 Q42,8 38,16 Q34,24 38,30 Q42,24 46,20 Q50,14 50,4" fill="#BA7517" opacity="0.6" />
              <path d="M65,4 Q60,10 58,16 Q56,22 60,26 Q62,20 65,16 Q68,10 65,4" fill="#EF9F27" opacity="0.4" />
              <path d="M4,50 Q8,42 16,38 Q24,34 30,38 Q24,42 20,46 Q14,50 4,50" fill="#BA7517" opacity="0.6" />
              <path d="M4,65 Q10,60 16,58 Q22,56 26,60 Q20,62 16,65 Q10,68 4,65" fill="#EF9F27" opacity="0.4" />
              <circle cx="12" cy="12" r="6" fill="#BA7517" opacity="0.5" />
              <circle cx="12" cy="12" r="3" fill="#FFFDF7" />
              <path d="M12,6 Q20,12 12,18 Q4,12 12,6" fill="#BA7517" opacity="0.35" />
              <path d="M6,12 Q12,4 18,12 Q12,20 6,12" fill="#BA7517" opacity="0.35" />
              <path d="M35,8 Q40,14 38,22 Q36,14 30,10 Z" fill="#BA7517" opacity="0.4" />
              <path d="M8,35 Q14,40 22,38 Q14,36 10,30 Z" fill="#BA7517" opacity="0.4" />
              <path d="M42,12 Q46,18 44,24 Q40,18 38,14 Z" fill="#EF9F27" opacity="0.3" />
              <path d="M12,42 Q18,46 24,44 Q18,40 14,38 Z" fill="#EF9F27" opacity="0.3" />
            </svg>

            {/* Top right corner */}
            <svg style={{ position: "absolute", top: 0, right: 0, transform: "scaleX(-1)" }} width="150" height="150" viewBox="0 0 150 150">
              <path d="M4,130 Q4,75 12,50 Q18,32 34,20 Q52,10 78,6 Q96,4 130,4" stroke="#BA7517" strokeWidth="1.5" fill="none" />
              <path d="M8,110 Q10,65 18,44 Q26,28 42,18 Q58,10 78,9 Q92,7 110,7" stroke="#EF9F27" strokeWidth="1" fill="none" />
              <path d="M50,4 Q42,8 38,16 Q34,24 38,30 Q42,24 46,20 Q50,14 50,4" fill="#BA7517" opacity="0.6" />
              <path d="M4,50 Q8,42 16,38 Q24,34 30,38 Q24,42 20,46 Q14,50 4,50" fill="#BA7517" opacity="0.6" />
              <circle cx="12" cy="12" r="6" fill="#BA7517" opacity="0.5" />
              <circle cx="12" cy="12" r="3" fill="#FFFDF7" />
              <path d="M12,6 Q20,12 12,18 Q4,12 12,6" fill="#BA7517" opacity="0.35" />
              <path d="M6,12 Q12,4 18,12 Q12,20 6,12" fill="#BA7517" opacity="0.35" />
              <path d="M35,8 Q40,14 38,22 Q36,14 30,10 Z" fill="#BA7517" opacity="0.4" />
              <path d="M8,35 Q14,40 22,38 Q14,36 10,30 Z" fill="#BA7517" opacity="0.4" />
            </svg>

            {/* Bottom left corner */}
            <svg style={{ position: "absolute", bottom: 0, left: 0, transform: "scaleY(-1)" }} width="150" height="150" viewBox="0 0 150 150">
              <path d="M4,130 Q4,75 12,50 Q18,32 34,20 Q52,10 78,6 Q96,4 130,4" stroke="#BA7517" strokeWidth="1.5" fill="none" />
              <path d="M8,110 Q10,65 18,44 Q26,28 42,18 Q58,10 78,9 Q92,7 110,7" stroke="#EF9F27" strokeWidth="1" fill="none" />
              <path d="M50,4 Q42,8 38,16 Q34,24 38,30 Q42,24 46,20 Q50,14 50,4" fill="#BA7517" opacity="0.6" />
              <path d="M4,50 Q8,42 16,38 Q24,34 30,38 Q24,42 20,46 Q14,50 4,50" fill="#BA7517" opacity="0.6" />
              <circle cx="12" cy="12" r="6" fill="#BA7517" opacity="0.5" />
              <circle cx="12" cy="12" r="3" fill="#FFFDF7" />
              <path d="M12,6 Q20,12 12,18 Q4,12 12,6" fill="#BA7517" opacity="0.35" />
              <path d="M35,8 Q40,14 38,22 Q36,14 30,10 Z" fill="#BA7517" opacity="0.4" />
            </svg>

            {/* Bottom right corner */}
            <svg style={{ position: "absolute", bottom: 0, right: 0, transform: "scale(-1,-1)" }} width="150" height="150" viewBox="0 0 150 150">
              <path d="M4,130 Q4,75 12,50 Q18,32 34,20 Q52,10 78,6 Q96,4 130,4" stroke="#BA7517" strokeWidth="1.5" fill="none" />
              <path d="M8,110 Q10,65 18,44 Q26,28 42,18 Q58,10 78,9 Q92,7 110,7" stroke="#EF9F27" strokeWidth="1" fill="none" />
              <path d="M50,4 Q42,8 38,16 Q34,24 38,30 Q42,24 46,20 Q50,14 50,4" fill="#BA7517" opacity="0.6" />
              <path d="M4,50 Q8,42 16,38 Q24,34 30,38 Q24,42 20,46 Q14,50 4,50" fill="#BA7517" opacity="0.6" />
              <circle cx="12" cy="12" r="6" fill="#BA7517" opacity="0.5" />
              <circle cx="12" cy="12" r="3" fill="#FFFDF7" />
              <path d="M12,6 Q20,12 12,18 Q4,12 12,6" fill="#BA7517" opacity="0.35" />
              <path d="M35,8 Q40,14 38,22 Q36,14 30,10 Z" fill="#BA7517" opacity="0.4" />
            </svg>

            {/* Content */}
            <div className="relative px-16 py-14 text-center">
              <div style={{ fontSize: "48px", letterSpacing: "14px", color: "#1e3a5f", fontFamily: "Georgia, serif" }}>CERTIFICATE</div>
              <div style={{ fontSize: "18px", letterSpacing: "6px", color: "#BA7517", marginTop: "4px" }}>OF COMPLETION</div>

              <div style={{ margin: "22px auto", height: "1px", width: "220px", background: "linear-gradient(90deg, transparent, #BA7517, transparent)" }} />

              <div style={{ fontSize: "14px", color: "#888780", fontStyle: "italic" }}>This certificate is proudly presented to</div>

              <div style={{ fontSize: "78px", color: "#000", fontFamily: "'Great Vibes', cursive", lineHeight: 1.1, padding: "10px 0" }}>
                {data.resident_name}
              </div>

              <div style={{ margin: "6px auto 20px", height: "1px", width: "340px", background: "linear-gradient(90deg, transparent, #D3D1C7, transparent)" }} />

              <div style={{ fontSize: "14px", color: "#888780" }}>for successfully completing the course</div>
              <div style={{ fontSize: "26px", color: "#BA7517", fontFamily: "Georgia, serif", margin: "6px 0" }}>{data.course_title}</div>
              <div style={{ fontSize: "12px", color: "#B4B2A9", marginBottom: "8px" }}>
                {data.course_tier} &middot; {data.course_hours} Hours
              </div>

              <div style={{ margin: "20px auto 24px", height: "1px", width: "200px", background: "linear-gradient(90deg, transparent, #BA7517, transparent)" }} />

              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px" }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#B4B2A9" }}>FACILITY</div>
                  <div style={{ fontSize: "13px", color: "#1e3a5f", marginTop: "3px", fontWeight: 500 }}>{data.facility_name}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#B4B2A9" }}>DATE OF COMPLETION</div>
                  <div style={{ fontSize: "13px", color: "#1e3a5f", marginTop: "3px", fontWeight: 500 }}>{issuedDate}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#B4B2A9" }}>CERTIFICATE NO.</div>
                  <div style={{ fontSize: "13px", color: "#1e3a5f", marginTop: "3px", fontWeight: 500 }}>
                    RLC-{String(data.certificate_id).padStart(5, "0")}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "24px", fontSize: "11px", letterSpacing: "3px", color: "#BA7517", fontWeight: 500 }}>
                REENTRY LEARNING CENTER, LLC
              </div>
              <div style={{ marginTop: "4px", fontSize: "10px", color: "#D3D1C7" }}>
                &copy; 2026 Reentry Learning Center, LLC. All Rights Reserved.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          main { background: white !important; }
          @page { margin: 0.5in; size: landscape; }
        }
      `}</style>
    </main>
  );
}
