import { test, expect } from "@playwright/test";

const mockJobTranscribing = {
  id: "job-e2e-002",
  status: "transcribing",
  filename: "meeting.wav",
  original_format: "wav",
  file_size_bytes: 10485760,
  duration_seconds: null,
  created_at: "2026-01-16T08:00:00Z",
  completed_at: null,
  error_message: null,
  progress_percent: 55,
  current_step: "Transcribing...",
  transcription: null,
  translation: null,
};

const mockJobCompleted = {
  id: "job-e2e-001",
  status: "completed",
  filename: "interview.mp3",
  original_format: "mp3",
  file_size_bytes: 5242880,
  duration_seconds: 120,
  created_at: "2026-01-15T10:00:00Z",
  completed_at: "2026-01-15T10:05:00Z",
  error_message: null,
  progress_percent: 100,
  current_step: "Completed",
  transcription: null,
  translation: null,
};

const mockJobFailed = {
  id: "job-e2e-003",
  status: "failed",
  filename: "podcast.ogg",
  original_format: "ogg",
  file_size_bytes: 2097152,
  duration_seconds: null,
  created_at: "2026-01-17T12:00:00Z",
  completed_at: null,
  error_message: "Audio file corrupted",
  progress_percent: 10,
  current_step: "Failed",
  transcription: null,
  translation: null,
};

const allJobs = [mockJobCompleted, mockJobTranscribing, mockJobFailed];

const mockJobDetail = {
  ...mockJobCompleted,
  transcription: {
    text: "Esta es la transcripción de la entrevista.",
    language: "es",
    segments: [
      { start: 0.0, end: 3.0, text: "Esta es la transcripción" },
      { start: 3.0, end: 5.0, text: "de la entrevista." },
    ],
    duration_seconds: 120,
    word_count: 7,
  },
  translation: {
    text: "This is the interview transcription.",
    source_language: "es",
    target_language: "en",
    word_count: 6,
  },
};

// Helper to set up jobs list API mock
async function mockJobsApi(
  page: import("@playwright/test").Page,
  jobs = allJobs
) {
  await page.route("**/api/v1/jobs", async (route) => {
    const url = new URL(route.request().url());
    // Only respond to the exact jobs list endpoint
    if (url.pathname.endsWith("/jobs") && !url.pathname.includes("/jobs/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(jobs),
      });
    } else {
      await route.continue();
    }
  });
}

test.describe("Jobs Page", () => {
  test("renders jobs list page", async ({ page }) => {
    await mockJobsApi(page);
    await page.goto("/jobs");

    await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible();
    await expect(
      page.getByText("All transcription and translation jobs")
    ).toBeVisible();
  });

  test("displays all jobs from API", async ({ page }) => {
    await mockJobsApi(page);
    await page.goto("/jobs");

    // Wait for loading to complete and jobs to appear
    await expect(page.getByText("Loading jobs...")).not.toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("interview.mp3")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("meeting.wav")).toBeVisible();
    await expect(page.getByText("podcast.ogg")).toBeVisible();
  });

  test("shows status filter buttons", async ({ page }) => {
    await mockJobsApi(page);
    await page.goto("/jobs");

    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Completed" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Failed" })).toBeVisible();
  });

  test("filters jobs by status", async ({ page }) => {
    await mockJobsApi(page);
    await page.goto("/jobs");

    // Wait for jobs to load
    await expect(page.getByText("interview.mp3")).toBeVisible({
      timeout: 10000,
    });

    // Click "Completed" filter
    await page.getByRole("button", { name: "Completed" }).click();

    // Should show only completed job
    await expect(page.getByText("interview.mp3")).toBeVisible();
    await expect(page.getByText("meeting.wav")).not.toBeVisible();
    await expect(page.getByText("podcast.ogg")).not.toBeVisible();

    // Click "Failed" filter
    await page.getByRole("button", { name: "Failed" }).click();

    await expect(page.getByText("podcast.ogg")).toBeVisible();
    await expect(page.getByText("interview.mp3")).not.toBeVisible();

    // Click "All" to reset
    await page.getByRole("button", { name: "All" }).click();

    await expect(page.getByText("interview.mp3")).toBeVisible();
    await expect(page.getByText("meeting.wav")).toBeVisible();
    await expect(page.getByText("podcast.ogg")).toBeVisible();
  });

  test("navigates to job detail page", async ({ page }) => {
    await mockJobsApi(page);

    // Mock job detail endpoint
    await page.route("**/api/v1/jobs/job-e2e-001", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockJobDetail),
      });
    });

    await page.goto("/jobs");

    // Wait for jobs to load, then click on the job card link
    const jobLink = page.getByRole("link", { name: /interview\.mp3/ });
    await expect(jobLink).toBeVisible({ timeout: 10000 });
    await jobLink.click();

    // Should navigate to detail page and show job info
    await expect(page).toHaveURL(/\/jobs\/job-e2e-001/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "interview.mp3" })
    ).toBeVisible({ timeout: 10000 });

    // Should show transcription and translation
    await expect(
      page.getByText("Esta es la transcripción de la entrevista.")
    ).toBeVisible();
    await expect(
      page.getByText("This is the interview transcription.")
    ).toBeVisible();
  });

  test("navigates between pages via nav bar", async ({ page }) => {
    await mockJobsApi(page);
    await page.goto("/");

    // Click "Jobs" in nav
    await page.getByRole("link", { name: "Jobs" }).click();
    await expect(page).toHaveURL(/\/jobs/);

    // Click "Home" in nav
    await page.getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL("/");
  });

  test("New Upload link goes to home page", async ({ page }) => {
    await mockJobsApi(page);
    await page.goto("/jobs");

    // Wait for loading to finish
    await expect(page.getByText("Loading jobs...")).not.toBeVisible({
      timeout: 10000,
    });

    // Click "New Upload" button
    await page.getByRole("link", { name: "New Upload" }).click();
    await expect(page).toHaveURL("/");
  });

  test("auto-updates jobs that are processing", async ({ page }) => {
    let pollCount = 0;

    // Mock that returns transcribing first, then completed
    await page.route("**/api/v1/jobs", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/jobs") && !url.pathname.includes("/jobs/")) {
        pollCount++;
        if (pollCount <= 2) {
          // First calls: job is still transcribing
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([mockJobTranscribing]),
          });
        } else {
          // Later calls: job is completed
          const completedMeeting = {
            ...mockJobTranscribing,
            status: "completed",
            progress_percent: 100,
            current_step: "Completed",
          };
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([completedMeeting]),
          });
        }
      } else {
        await route.continue();
      }
    });

    await page.goto("/jobs");

    // Initially should show transcribing status
    await expect(page.getByText("meeting.wav")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/transcribing/i).first()).toBeVisible();

    // Wait for auto-polling to update the status to completed (within ~12s)
    await expect(page.getByText(/completed/i).first()).toBeVisible({
      timeout: 20000,
    });
  });
});
