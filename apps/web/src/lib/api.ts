// ============================================================
// Coloriage Magique — API client
// ============================================================

export type Difficulty = "beginner" | "intermediate" | "expert";
export type Format = "a4" | "a3";
export type JobStatus = "pending" | "processing" | "done" | "failed";

export interface ColorLegendEntry {
  symbol: string;
  hex: string;
  name: string;
}

export interface Job {
  id: string;
  status: JobStatus;
  difficulty: Difficulty;
  format: Format;
  color_count: number;
  color_legend: ColorLegendEntry[];
  preview_url: string | null;
  coloring_pdf_url: string | null;
  reference_pdf_url: string | null;
  processing_ms: number | null;
  created_at: string;
  expires_at: string;
}

export interface CreateJobResponse {
  job_id: string;
  status: JobStatus;
  poll_url: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://coloriage-magique.srv1465877.hstgr.cloud";

// ------------------------------------------------------------
// createJob — POST multipart /api/v1/jobs
// ------------------------------------------------------------
export async function createJob(
  file: File,
  difficulty: Difficulty,
  format: Format
): Promise<CreateJobResponse> {
  const body = new FormData();
  body.append("image", file);
  body.append("difficulty", difficulty);
  body.append("format", format);

  const res = await fetch(`${BASE_URL}/api/v1/jobs`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`createJob failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<CreateJobResponse>;
}

// ------------------------------------------------------------
// getJob — GET /api/v1/jobs/{jobId}
// ------------------------------------------------------------
export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`${BASE_URL}/api/v1/jobs/${jobId}`, {
    // No-store so polling always gets fresh data
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`getJob failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<Job>;
}

// ------------------------------------------------------------
// getDownloadUrl — Absolute URL for a relative API path
// ------------------------------------------------------------
export function getDownloadUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
