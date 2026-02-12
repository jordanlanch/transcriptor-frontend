import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { Job } from "@/lib/api";

const API_URL = "http://localhost:8000";

const mockJob: Job = {
  id: "job-123",
  status: "queued",
  filename: "test.mp3",
  original_format: "mp3",
  file_size_bytes: 1024,
  duration_seconds: null,
  created_at: "2026-01-01T00:00:00Z",
  completed_at: null,
  error_message: null,
  progress_percent: 0,
  current_step: "Queued",
  transcription: null,
  translation: null,
};

const server = setupServer(
  http.get(`${API_URL}/api/v1/jobs/:id`, ({ params }) => {
    if (params.id === "not-found") {
      return HttpResponse.json({ detail: "Job not found" }, { status: 404 });
    }
    return HttpResponse.json({ ...mockJob, id: params.id });
  }),

  http.get(`${API_URL}/api/v1/jobs`, () => {
    return HttpResponse.json([mockJob]);
  }),

  http.get(`${API_URL}/api/v1/jobs/:id/export/:format`, () => {
    return new HttpResponse("file content", {
      headers: { "Content-Type": "text/plain" },
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("API Client", () => {
  it("getJob returns job data", async () => {
    const { getJob } = await import("@/lib/api");
    const job = await getJob("job-123");
    expect(job.id).toBe("job-123");
    expect(job.status).toBe("queued");
  });

  it("getJob throws ApiError on 404", async () => {
    const { getJob, ApiError } = await import("@/lib/api");
    await expect(getJob("not-found")).rejects.toThrow(ApiError);
  });

  it("getJobs returns array of jobs", async () => {
    const { getJobs } = await import("@/lib/api");
    const jobs = await getJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("job-123");
  });

  it("downloadExport returns blob", async () => {
    const { downloadExport } = await import("@/lib/api");
    const blob = await downloadExport("job-123", "txt");
    expect(blob.size).toBeGreaterThan(0);
    expect(typeof blob.text).toBe("function");
  });

  it("getJobs handles server error", async () => {
    server.use(
      http.get(`${API_URL}/api/v1/jobs`, () => {
        return HttpResponse.json({ detail: "Server error" }, { status: 500 });
      })
    );

    const { getJobs, ApiError } = await import("@/lib/api");
    await expect(getJobs()).rejects.toThrow(ApiError);
  });

  it("downloadExport handles error response", async () => {
    server.use(
      http.get(`${API_URL}/api/v1/jobs/:id/export/:format`, () => {
        return HttpResponse.json({ detail: "Export failed" }, { status: 400 });
      })
    );

    const { downloadExport, ApiError } = await import("@/lib/api");
    await expect(downloadExport("job-123", "txt")).rejects.toThrow(ApiError);
  });

  it("getJob includes proper error message", async () => {
    const { getJob } = await import("@/lib/api");
    try {
      await getJob("not-found");
    } catch (error) {
      expect((error as Error).message).toContain("Job not found");
    }
  });

  it("downloadExport works for docx format", async () => {
    server.use(
      http.get(`${API_URL}/api/v1/jobs/:id/export/:format`, () => {
        return new HttpResponse(new Uint8Array([1, 2, 3]), {
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          },
        });
      })
    );

    const { downloadExport } = await import("@/lib/api");
    const blob = await downloadExport("job-123", "docx");
    expect(blob.size).toBeGreaterThan(0);
    expect(typeof blob.text).toBe("function");
  });
});
