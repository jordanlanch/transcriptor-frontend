import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ExportButtons from "@/components/ExportButtons";

// Mock the api module
vi.mock("@/lib/api", () => ({
  downloadExport: vi.fn(),
}));

describe("ExportButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders three export buttons", () => {
    render(
      <ExportButtons jobId="test-123" hasSegments={true} filename="test.mp3" />
    );
    expect(screen.getByText("Plain Text")).toBeInTheDocument();
    expect(screen.getByText("Word Document")).toBeInTheDocument();
    expect(screen.getByText("Subtitles")).toBeInTheDocument();
  });

  it("renders export results heading", () => {
    render(
      <ExportButtons jobId="test-123" hasSegments={true} filename="test.mp3" />
    );
    expect(screen.getByText("Export Results")).toBeInTheDocument();
  });

  it("disables SRT button when no segments", () => {
    render(
      <ExportButtons jobId="test-123" hasSegments={false} filename="test.mp3" />
    );
    const srtButton = screen.getByText("Subtitles").closest("button")!;
    expect(srtButton).toBeDisabled();
    expect(screen.getByText("Not available")).toBeInTheDocument();
  });

  it("enables SRT button when segments exist", () => {
    render(
      <ExportButtons jobId="test-123" hasSegments={true} filename="test.mp3" />
    );
    const srtButton = screen.getByText("Subtitles").closest("button")!;
    expect(srtButton).not.toBeDisabled();
    expect(screen.getByText(".srt file")).toBeInTheDocument();
  });

  it("triggers download on TXT button click", async () => {
    const { downloadExport } = await import("@/lib/api");
    (downloadExport as ReturnType<typeof vi.fn>).mockResolvedValue(new Blob(["test"]));

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const createObjectURL = vi.fn(() => "blob:test");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(window, "URL", {
      value: { createObjectURL, revokeObjectURL },
      writable: true,
    });

    const user = userEvent.setup();
    render(
      <ExportButtons jobId="test-123" hasSegments={true} filename="test.mp3" />
    );

    await user.click(screen.getByText("Plain Text").closest("button")!);
    expect(downloadExport).toHaveBeenCalledWith("test-123", "txt");
  });

  it("shows error on download failure", async () => {
    const { downloadExport } = await import("@/lib/api");
    (downloadExport as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

    const user = userEvent.setup();
    render(
      <ExportButtons jobId="test-123" hasSegments={true} filename="test.mp3" />
    );

    await user.click(screen.getByText("Plain Text").closest("button")!);
    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });
});
