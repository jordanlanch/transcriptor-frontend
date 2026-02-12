import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import JobCard from "@/components/JobCard";
import type { Job } from "@/lib/types";

// Mock next/link
const mockJob: Job = {
  id: "test-job-123",
  status: "completed",
  filename: "interview.mp3",
  original_format: "mp3",
  file_size_bytes: 5242880,
  duration_seconds: 120,
  created_at: "2026-01-15T10:30:00Z",
  completed_at: "2026-01-15T10:35:00Z",
  error_message: null,
  progress_percent: 100,
  current_step: "Completed",
  transcription: null,
  translation: null,
};

describe("JobCard", () => {
  it("renders filename", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("interview.mp3")).toBeInTheDocument();
  });

  it("renders file format", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText(/MP3/)).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders audio duration for completed jobs", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("120s audio")).toBeInTheDocument();
  });

  it("renders progress bar for processing jobs", () => {
    const processingJob: Job = {
      ...mockJob,
      status: "transcribing",
      progress_percent: 45,
      current_step: "Transcribing...",
    };
    render(<JobCard job={processingJob} />);
    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.getByText("Transcribing...")).toBeInTheDocument();
  });

  it("links to job detail page", () => {
    render(<JobCard job={mockJob} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/jobs/test-job-123");
  });
});
