import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import JobsPage from "@/app/jobs/page";
import type { Job } from "@/lib/types";

const mockJobs: Job[] = [
  {
    id: "job-1",
    status: "completed",
    filename: "audio1.mp3",
    original_format: "mp3",
    file_size_bytes: 1024,
    duration_seconds: 60,
    created_at: "2026-01-01T00:00:00Z",
    completed_at: "2026-01-01T00:05:00Z",
    error_message: null,
    progress_percent: 100,
    current_step: "Completed",
    transcription: null,
    translation: null,
  },
  {
    id: "job-2",
    status: "failed",
    filename: "audio2.wav",
    original_format: "wav",
    file_size_bytes: 2048,
    duration_seconds: null,
    created_at: "2026-01-02T00:00:00Z",
    completed_at: null,
    error_message: "Network error",
    progress_percent: 30,
    current_step: "Failed",
    transcription: null,
    translation: null,
  },
];

const activeJobs: Job[] = [
  {
    id: "job-3",
    status: "transcribing",
    filename: "active.mp3",
    original_format: "mp3",
    file_size_bytes: 1024,
    duration_seconds: null,
    created_at: "2026-01-03T00:00:00Z",
    completed_at: null,
    error_message: null,
    progress_percent: 40,
    current_step: "Transcribing...",
    transcription: null,
    translation: null,
  },
];

vi.mock("@/lib/api", () => ({
  getJobs: vi.fn().mockResolvedValue([]),
  getJob: vi.fn(),
  uploadAudio: vi.fn(),
  downloadExport: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

describe("JobsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders page title", async () => {
    render(<JobsPage />);
    expect(screen.getByText("Jobs")).toBeInTheDocument();
  });

  it("renders new upload link", () => {
    render(<JobsPage />);
    expect(screen.getByText("New Upload")).toBeInTheDocument();
  });

  it("renders status filter buttons", () => {
    render(<JobsPage />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    render(<JobsPage />);
    expect(screen.getByText("Loading jobs...")).toBeInTheDocument();
  });

  it("shows empty state when no jobs", async () => {
    render(<JobsPage />);
    await waitFor(() => {
      expect(screen.getByText("No jobs yet")).toBeInTheDocument();
    });
  });

  it("renders jobs when available", async () => {
    const { getJobs } = await import("@/lib/api");
    (getJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockJobs);

    render(<JobsPage />);
    await waitFor(() => {
      expect(screen.getByText("audio1.mp3")).toBeInTheDocument();
      expect(screen.getByText("audio2.wav")).toBeInTheDocument();
    });
  });

  it("polls every 4s when active jobs exist", async () => {
    const { getJobs } = await import("@/lib/api");
    (getJobs as ReturnType<typeof vi.fn>).mockResolvedValue(activeJobs);

    render(<JobsPage />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(screen.getByText("active.mp3")).toBeInTheDocument();
    });

    // getJobs called once for initial fetch
    expect(getJobs).toHaveBeenCalledTimes(1);

    // Advance 4 seconds - should trigger polling
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(getJobs).toHaveBeenCalledTimes(2);
    });

    // Advance another 4 seconds
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(getJobs).toHaveBeenCalledTimes(3);
    });
  });

  it("stops polling when all jobs are completed/failed", async () => {
    const { getJobs } = await import("@/lib/api");
    // First call: active jobs
    (getJobs as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(activeJobs)
      // Second call: all completed
      .mockResolvedValue(mockJobs);

    render(<JobsPage />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(screen.getByText("active.mp3")).toBeInTheDocument();
    });

    // Advance to trigger one poll
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(getJobs).toHaveBeenCalledTimes(2);
    });

    // Now all jobs are completed/failed, polling should stop
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });

    // Should not have called again (stays at 2)
    expect(getJobs).toHaveBeenCalledTimes(2);
  });

  it("does not poll if no active jobs from the start", async () => {
    const { getJobs } = await import("@/lib/api");
    (getJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockJobs);

    render(<JobsPage />);

    await waitFor(() => {
      expect(screen.getByText("audio1.mp3")).toBeInTheDocument();
    });

    expect(getJobs).toHaveBeenCalledTimes(1);

    // Advance time - should NOT trigger additional calls
    await act(async () => {
      vi.advanceTimersByTime(12000);
    });

    expect(getJobs).toHaveBeenCalledTimes(1);
  });
});
