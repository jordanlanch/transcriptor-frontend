import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";

const mockJobQueued = {
  id: "e2e-job-001",
  status: "queued",
  filename: "test-audio.mp3",
  original_format: "mp3",
  file_size_bytes: 1048576,
  duration_seconds: null,
  created_at: "2026-01-15T10:00:00Z",
  completed_at: null,
  error_message: null,
  progress_percent: 0,
  current_step: "Queued",
  transcription: null,
  translation: null,
};

const mockJobQueued2 = {
  ...mockJobQueued,
  id: "e2e-job-002",
  filename: "test-audio-2.mp3",
};

// Helper to create temp audio file
function createTempAudioFile(name?: string): string {
  const tmpFile = path.join(os.tmpdir(), name || `test-audio-${Date.now()}.mp3`);
  fs.writeFileSync(tmpFile, Buffer.alloc(1024, 0));
  return tmpFile;
}

// Helper to select files via the file chooser dialog
async function selectFiles(
  page: import("@playwright/test").Page,
  filePaths: string[]
) {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "browse" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePaths);
}

test.describe("Upload Flow", () => {
  test("shows home page with upload form", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Audio Transcriptor")).toBeVisible();
    await expect(
      page.getByText("Upload Spanish audio files")
    ).toBeVisible();
    await expect(
      page.getByText("Drop your audio files here")
    ).toBeVisible();
  });

  test("multi-file upload redirects to jobs page", async ({ page }) => {
    let uploadCount = 0;

    // Mock POST /api/v1/jobs/upload
    await page.route("**/api/v1/jobs/upload", async (route) => {
      uploadCount++;
      const body =
        uploadCount === 1 ? mockJobQueued : mockJobQueued2;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    // Mock GET /api/v1/jobs for the jobs page
    await page.route("**/api/v1/jobs", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/jobs") && !url.pathname.includes("/jobs/")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockJobQueued, mockJobQueued2]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/");

    const tmpFile1 = createTempAudioFile("upload-test-1.mp3");
    const tmpFile2 = createTempAudioFile("upload-test-2.mp3");

    try {
      // Select multiple files
      await selectFiles(page, [tmpFile1, tmpFile2]);

      // Click upload button (should show file count)
      await page.getByRole("button", { name: /upload 2 files/i }).click();

      // Should show batch upload progress
      await expect(
        page.getByText(/Uploading file \d+ of 2/)
      ).toBeVisible({ timeout: 5000 });

      // Should redirect to /jobs
      await expect(page).toHaveURL(/\/jobs/, { timeout: 15000 });

      // Jobs page should show the jobs
      await expect(page.getByText("test-audio.mp3")).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText("test-audio-2.mp3")).toBeVisible();
    } finally {
      if (fs.existsSync(tmpFile1)) fs.unlinkSync(tmpFile1);
      if (fs.existsSync(tmpFile2)) fs.unlinkSync(tmpFile2);
    }
  });

  test("single file upload redirects to jobs page", async ({ page }) => {
    // Mock POST /api/v1/jobs/upload
    await page.route("**/api/v1/jobs/upload", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(mockJobQueued),
      });
    });

    // Mock GET /api/v1/jobs for the jobs page
    await page.route("**/api/v1/jobs", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/jobs") && !url.pathname.includes("/jobs/")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockJobQueued]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/");

    const tmpFile = createTempAudioFile();

    try {
      await selectFiles(page, [tmpFile]);

      // Single file should say "Upload 1 File"
      await page.getByRole("button", { name: /upload 1 file/i }).click();

      // Should redirect to /jobs
      await expect(page).toHaveURL(/\/jobs/, { timeout: 15000 });
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  test("shows error state on upload failure", async ({ page }) => {
    await page.route("**/api/v1/jobs/upload", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal server error" }),
      });
    });

    await page.goto("/");

    const tmpFile = createTempAudioFile();

    try {
      await selectFiles(page, [tmpFile]);
      await page.getByRole("button", { name: /upload 1 file/i }).click();

      // Should show error message
      await expect(page.getByText(/failed/i).first()).toBeVisible({
        timeout: 10000,
      });
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });
});
