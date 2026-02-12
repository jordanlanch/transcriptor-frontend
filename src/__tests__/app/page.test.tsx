import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home from "@/app/page";

const mockPush = vi.fn();

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock the API module
vi.mock("@/lib/api", () => ({
  uploadAudio: vi.fn(),
  getJob: vi.fn(),
  getJobs: vi.fn(),
  downloadExport: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message: string, public status?: number) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

function createFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("Home Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", () => {
    render(<Home />);
    expect(screen.getByText("Audio Transcriptor")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<Home />);
    expect(
      screen.getByText(/Upload Spanish audio files/)
    ).toBeInTheDocument();
  });

  it("renders the file upload component initially", () => {
    render(<Home />);
    expect(screen.getByText("Drop your audio files here")).toBeInTheDocument();
  });

  it("renders footer", () => {
    render(<Home />);
    expect(
      screen.getByText(/Powered by OpenAI Whisper and GPT-4/)
    ).toBeInTheDocument();
  });

  it("uploads multiple files and redirects to /jobs", async () => {
    const { uploadAudio } = await import("@/lib/api");
    (uploadAudio as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "job-1", status: "queued", filename: "a.mp3" })
      .mockResolvedValueOnce({ id: "job-2", status: "queued", filename: "b.wav" });

    const user = userEvent.setup();
    render(<Home />);

    const file1 = createFile("a.mp3", 1024, "audio/mpeg");
    const file2 = createFile("b.wav", 2048, "audio/wav");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [file1, file2]);

    await user.click(screen.getByRole("button", { name: /Upload 2 Files/i }));

    await waitFor(() => {
      expect(uploadAudio).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/jobs");
    });
  });

  it("shows batch upload progress", async () => {
    const { uploadAudio } = await import("@/lib/api");
    // Slow upload to catch the progress text
    (uploadAudio as ReturnType<typeof vi.fn>)
      .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ id: "job-1", status: "queued" }), 100)));

    const user = userEvent.setup();
    render(<Home />);

    const file1 = createFile("a.mp3", 1024, "audio/mpeg");
    const file2 = createFile("b.wav", 2048, "audio/wav");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [file1, file2]);

    await user.click(screen.getByRole("button", { name: /Upload 2 Files/i }));

    // Should show progress indicator
    await waitFor(() => {
      expect(screen.getByText(/Uploading file \d+ of 2/)).toBeInTheDocument();
    });
  });

  it("handles partial failures and still redirects", async () => {
    const { uploadAudio } = await import("@/lib/api");
    (uploadAudio as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "job-1", status: "queued", filename: "a.mp3" })
      .mockRejectedValueOnce(new Error("Network error"));

    const user = userEvent.setup();
    render(<Home />);

    const file1 = createFile("a.mp3", 1024, "audio/mpeg");
    const file2 = createFile("b.wav", 2048, "audio/wav");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [file1, file2]);

    await user.click(screen.getByRole("button", { name: /Upload 2 Files/i }));

    await waitFor(() => {
      expect(uploadAudio).toHaveBeenCalledTimes(2);
    });

    // Should still redirect since at least 1 succeeded
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/jobs");
    });

    // Should show error for failed file
    expect(screen.getByText(/b\.wav.*failed/i)).toBeInTheDocument();
  });

  it("does NOT redirect when all uploads fail", async () => {
    const { uploadAudio } = await import("@/lib/api");
    (uploadAudio as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Server error"));

    const user = userEvent.setup();
    render(<Home />);

    const file1 = createFile("a.mp3", 1024, "audio/mpeg");
    const file2 = createFile("b.wav", 2048, "audio/wav");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [file1, file2]);

    await user.click(screen.getByRole("button", { name: /Upload 2 Files/i }));

    await waitFor(() => {
      expect(uploadAudio).toHaveBeenCalledTimes(2);
    });

    // Should NOT redirect
    expect(mockPush).not.toHaveBeenCalled();

    // Should show errors
    await waitFor(() => {
      expect(screen.getByText(/All uploads failed/i)).toBeInTheDocument();
    });
  });
});
