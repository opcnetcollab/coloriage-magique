import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Job, CreateJobResponse, ColorLegendEntry } from "./api";

// Mock fetch globally before any module import
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const mockLegend: ColorLegendEntry[] = [
  { symbol: "1", hex: "#ff6347", name: "Rouge" },
  { symbol: "2", hex: "#4169e1", name: "Bleu" },
];

const mockJob: Job = {
  id: "abc-123",
  status: "done",
  difficulty: "beginner",
  format: "a4",
  color_count: 6,
  color_legend: mockLegend,
  preview_url: "/api/v1/jobs/abc-123/preview",
  coloring_pdf_url: "/api/v1/jobs/abc-123/coloring-pdf",
  reference_pdf_url: "/api/v1/jobs/abc-123/reference-pdf",
  processing_ms: 1234,
  created_at: "2026-03-25T08:00:00Z",
  expires_at: "2026-03-26T08:00:00Z",
};

const mockCreateResponse: CreateJobResponse = {
  job_id: "abc-123",
  status: "pending",
  poll_url: "/api/v1/jobs/abc-123",
};

// ─────────────────────────────────────────────────────────────────────────────
// createJob
// ─────────────────────────────────────────────────────────────────────────────

describe("createJob", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.resetModules();
  });

  it("sends a POST with FormData containing image, difficulty and format", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCreateResponse,
    });

    const { createJob } = await import("./api");
    const file = new File(["fake-image"], "photo.jpg", { type: "image/jpeg" });
    const result = await createJob(file, "beginner", "a4");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v1/jobs");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);

    const fd = init.body as FormData;
    expect(fd.get("image")).toBeInstanceOf(File);
    expect(fd.get("difficulty")).toBe("beginner");
    expect(fd.get("format")).toBe("a4");

    // Return value matches CreateJobResponse shape
    expect(result.job_id).toBe("abc-123");
    expect(result.status).toBe("pending");
    expect(result.poll_url).toBe("/api/v1/jobs/abc-123");
  });

  it("supports intermediate difficulty and a3 format", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockCreateResponse, status: "pending" }),
    });

    const { createJob } = await import("./api");
    const file = new File(["fake"], "photo.png", { type: "image/png" });
    await createJob(file, "intermediate", "a3");

    const fd = mockFetch.mock.calls[0][1].body as FormData;
    expect(fd.get("difficulty")).toBe("intermediate");
    expect(fd.get("format")).toBe("a3");
  });

  it("throws with status code on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 413,
      text: async () => "Image trop grande",
      statusText: "Payload Too Large",
    });

    const { createJob } = await import("./api");
    const file = new File(["x"], "big.jpg", { type: "image/jpeg" });
    await expect(createJob(file, "beginner", "a4")).rejects.toThrow("413");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getJob
// ─────────────────────────────────────────────────────────────────────────────

describe("getJob", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.resetModules();
  });

  it("fetches GET /api/v1/jobs/{id} and returns a Job", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJob,
    });

    const { getJob } = await import("./api");
    const result = await getJob("abc-123");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v1/jobs/abc-123");

    // Verify all Job fields
    expect(result.id).toBe("abc-123");
    expect(result.status).toBe("done");
    expect(result.difficulty).toBe("beginner");
    expect(result.format).toBe("a4");
    expect(result.color_count).toBe(6);
    expect(result.coloring_pdf_url).toBe("/api/v1/jobs/abc-123/coloring-pdf");
    expect(result.reference_pdf_url).toBe("/api/v1/jobs/abc-123/reference-pdf");
    expect(result.processing_ms).toBe(1234);
  });

  it("returns color_legend with correct ColorLegendEntry shape", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJob,
    });

    const { getJob } = await import("./api");
    const result = await getJob("abc-123");

    expect(Array.isArray(result.color_legend)).toBe(true);
    const entry = result.color_legend![0];
    expect(entry.symbol).toBe("1");
    expect(entry.hex).toBe("#ff6347");
    expect(entry.name).toBe("Rouge");
  });

  it("returns a pending job with null pdf urls", async () => {
    const pendingJob: Job = {
      id: "xyz-999",
      status: "pending",
      difficulty: "expert",
      format: "a3",
      color_count: null as unknown as number,
      color_legend: null as unknown as ColorLegendEntry[],
      preview_url: null,
      coloring_pdf_url: null,
      reference_pdf_url: null,
      processing_ms: null,
      created_at: "2026-03-25T08:00:00Z",
      expires_at: "2026-03-26T08:00:00Z",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => pendingJob,
    });

    const { getJob } = await import("./api");
    const result = await getJob("xyz-999");

    expect(result.status).toBe("pending");
    expect(result.coloring_pdf_url).toBeNull();
    expect(result.reference_pdf_url).toBeNull();
  });

  it("throws with status code on 404", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Job not found",
      statusText: "Not Found",
    });

    const { getJob } = await import("./api");
    await expect(getJob("bad-id")).rejects.toThrow("404");
  });

  it("uses cache: no-store for fresh polling", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockJob,
    });

    const { getJob } = await import("./api");
    await getJob("abc-123");

    const [, init] = mockFetch.mock.calls[0];
    expect(init?.cache).toBe("no-store");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Types — compile-time checks (run at import time)
// ─────────────────────────────────────────────────────────────────────────────

describe("Type shapes", () => {
  it("ColorLegendEntry has symbol, hex, name", () => {
    const entry: ColorLegendEntry = { symbol: "A", hex: "#aabbcc", name: "Bleu" };
    expect(entry.symbol).toBe("A");
    expect(entry.hex).toBe("#aabbcc");
    expect(entry.name).toBe("Bleu");
  });

  it("Job uses id (not job_id)", () => {
    const job: Partial<Job> = { id: "test-id", status: "processing" };
    expect(job.id).toBe("test-id");
    // @ts-expect-error — job_id does not exist on Job
    expect((job as Record<string, unknown>).job_id).toBeUndefined();
  });

  it("JobStatus accepts done/failed/pending/processing", () => {
    const statuses = ["pending", "processing", "done", "failed"] as const;
    statuses.forEach((s) => {
      const j: Partial<Job> = { status: s };
      expect(j.status).toBe(s);
    });
  });
});
