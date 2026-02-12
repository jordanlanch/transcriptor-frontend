import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import FileUpload from "@/components/FileUpload";

function createFile(
  name: string,
  size: number,
  type: string
): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("FileUpload", () => {
  it("renders upload zone with instructions (plural)", () => {
    render(<FileUpload onUploadStart={vi.fn()} isUploading={false} />);
    expect(screen.getByText("Drop your audio files here")).toBeInTheDocument();
    expect(screen.getByText(/Supported formats/)).toBeInTheDocument();
  });

  it("renders browse button", () => {
    render(<FileUpload onUploadStart={vi.fn()} isUploading={false} />);
    expect(screen.getByText("browse")).toBeInTheDocument();
  });

  it("has multiple attribute on file input", () => {
    render(<FileUpload onUploadStart={vi.fn()} isUploading={false} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toHaveAttribute("multiple");
  });

  it("accepts valid audio file via file input", async () => {
    const user = userEvent.setup();
    render(<FileUpload onUploadStart={vi.fn()} isUploading={false} />);

    const file = createFile("test.mp3", 1024, "audio/mpeg");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByText("test.mp3")).toBeInTheDocument();
  });

  it("accepts multiple files via file input", async () => {
    const user = userEvent.setup();
    render(<FileUpload onUploadStart={vi.fn()} isUploading={false} />);

    const file1 = createFile("audio1.mp3", 1024, "audio/mpeg");
    const file2 = createFile("audio2.wav", 2048, "audio/wav");
    const file3 = createFile("audio3.m4a", 4096, "audio/mp4");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [file1, file2, file3]);

    expect(screen.getByText("audio1.mp3")).toBeInTheDocument();
    expect(screen.getByText("audio2.wav")).toBeInTheDocument();
    expect(screen.getByText("audio3.m4a")).toBeInTheDocument();
  });

  it("accepts multiple files via drag and drop", () => {
    render(<FileUpload onUploadStart={vi.fn()} isUploading={false} />);

    const dropZone = screen.getByText("Drop your audio files here").closest("div")!.parentElement!.parentElement!;

    const file1 = createFile("drag1.mp3", 1024, "audio/mpeg");
    const file2 = createFile("drag2.wav", 2048, "audio/wav");
    const dataTransfer = {
      files: [file1, file2],
      items: [
        { kind: "file", type: "audio/mpeg", getAsFile: () => file1 },
        { kind: "file", type: "audio/wav", getAsFile: () => file2 },
      ],
      types: ["Files"],
    };

    fireEvent.dragEnter(dropZone, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    expect(screen.getByText("drag1.mp3")).toBeInTheDocument();
    expect(screen.getByText("drag2.wav")).toBeInTheDocument();
  });

  it("validates each file individually (rejects invalid, keeps valid)", () => {
    render(<FileUpload onUploadStart={vi.fn()} isUploading={false} />);

    const validFile = createFile("good.mp3", 1024, "audio/mpeg");
    const invalidFile = createFile("bad.pdf", 1024, "application/pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Use fireEvent to bypass accept attribute filtering
    fireEvent.change(input, { target: { files: [validFile, invalidFile] } });

    // Valid file should be shown
    expect(screen.getByText("good.mp3")).toBeInTheDocument();
    // Invalid file should NOT be listed
    expect(screen.queryByText("bad.pdf")).not.toBeInTheDocument();
    // Error message for the invalid file
    expect(screen.getByText(/Invalid file format.*bad\.pdf/)).toBeInTheDocument();
  });

  it("rejects file exceeding 500MB", async () => {
    const user = userEvent.setup();
    render(<FileUpload onUploadStart={vi.fn()} isUploading={false} />);

    const file = createFile("big.mp3", 600 * 1024 * 1024, "audio/mpeg");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByText(/500MB/)).toBeInTheDocument();
  });

  it("allows removing individual files from the list", async () => {
    const user = userEvent.setup();
    render(<FileUpload onUploadStart={vi.fn()} isUploading={false} />);

    const file1 = createFile("keep.mp3", 1024, "audio/mpeg");
    const file2 = createFile("remove.wav", 2048, "audio/wav");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [file1, file2]);

    expect(screen.getByText("keep.mp3")).toBeInTheDocument();
    expect(screen.getByText("remove.wav")).toBeInTheDocument();

    // Click the remove button for remove.wav (each file row has a remove button)
    const removeButtons = screen.getAllByRole("button").filter(
      (btn) => btn.getAttribute("aria-label")?.includes("Remove")
    );
    // Find the one for remove.wav
    const removeBtnForWav = removeButtons.find(
      (btn) => btn.getAttribute("aria-label") === "Remove remove.wav"
    );
    expect(removeBtnForWav).toBeDefined();
    await user.click(removeBtnForWav!);

    expect(screen.queryByText("remove.wav")).not.toBeInTheDocument();
    expect(screen.getByText("keep.mp3")).toBeInTheDocument();
  });

  it("calls onUploadStart with array of files", async () => {
    const onUploadStart = vi.fn();
    const user = userEvent.setup();
    render(<FileUpload onUploadStart={onUploadStart} isUploading={false} />);

    const file1 = createFile("a.mp3", 1024, "audio/mpeg");
    const file2 = createFile("b.wav", 2048, "audio/wav");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [file1, file2]);

    await user.click(screen.getByRole("button", { name: /Upload 2 Files/i }));
    expect(onUploadStart).toHaveBeenCalledWith([file1, file2]);
  });

  it("shows singular text for single file upload button", async () => {
    const user = userEvent.setup();
    render(<FileUpload onUploadStart={vi.fn()} isUploading={false} />);

    const file = createFile("single.mp3", 1024, "audio/mpeg");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByRole("button", { name: /Upload 1 File$/i })).toBeInTheDocument();
  });

  it("shows file count and total size summary", async () => {
    const user = userEvent.setup();
    render(<FileUpload onUploadStart={vi.fn()} isUploading={false} />);

    const file1 = createFile("a.mp3", 1024 * 1024, "audio/mpeg"); // 1 MB
    const file2 = createFile("b.wav", 2 * 1024 * 1024, "audio/wav"); // 2 MB
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [file1, file2]);

    expect(screen.getByText(/2 files selected/)).toBeInTheDocument();
  });

  it("shows uploading state", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <FileUpload onUploadStart={vi.fn()} isUploading={false} />
    );

    const file = createFile("test.mp3", 1024, "audio/mpeg");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    rerender(<FileUpload onUploadStart={vi.fn()} isUploading={true} />);
    expect(screen.getByText("Uploading...")).toBeInTheDocument();
  });

  it("handles drag and drop of single file", () => {
    render(<FileUpload onUploadStart={vi.fn()} isUploading={false} />);

    const dropZone = screen.getByText("Drop your audio files here").closest("div")!.parentElement!.parentElement!;

    const file = createFile("test.mp3", 1024, "audio/mpeg");
    const dataTransfer = {
      files: [file],
      items: [{ kind: "file", type: "audio/mpeg", getAsFile: () => file }],
      types: ["Files"],
    };

    fireEvent.dragEnter(dropZone, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    expect(screen.getByText("test.mp3")).toBeInTheDocument();
  });
});
