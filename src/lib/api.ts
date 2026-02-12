// Runtime API URL: fetched from server so Docker env vars work without rebuild
let _apiUrl: string | null = null;

async function getApiUrl(): Promise<string> {
  if (_apiUrl) return _apiUrl;
  // In browser, fetch from our own API route which reads the server env var
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/config");
      const config = await res.json();
      _apiUrl = config.apiUrl;
      return _apiUrl!;
    } catch {
      // Fallback if API route fails
    }
  }
  _apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return _apiUrl;
}

// Sync getter for XHR (uses cached value or fallback)
function getApiUrlSync(): string {
  return _apiUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

const TOKEN_KEY = "transcriptor_token";

// Token management
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// Type Definitions
export interface Job {
  id: string;
  status: "queued" | "processing" | "transcribing" | "translating" | "completed" | "failed";
  filename: string;
  original_format: string;
  file_size_bytes: number;
  duration_seconds: number | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  progress_percent: number;
  current_step: string;
  transcription: TranscriptionResult | null;
  translation: TranslationResult | null;
  user_id: string | null;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  segments: TranscriptionSegment[];
  duration_seconds: number;
  word_count: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranslationResult {
  text: string;
  source_language: string;
  target_language: string;
  word_count: number;
}

export type ExportFormat = "txt" | "docx" | "srt";

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

// Custom Error Class
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Auth Functions

export async function login(email: string, password: string): Promise<void> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || "Login failed",
      response.status,
      errorData
    );
  }

  const data = await response.json();
  setToken(data.access_token);
  // Set cookie immediately so proxy allows navigation
  document.cookie = `transcriptor_token=${data.access_token}; path=/; SameSite=Lax`;
}

export function logout(): void {
  clearToken();
  document.cookie = 'transcriptor_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export async function getMe(): Promise<User> {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
    method: "GET",
    headers: { ...authHeaders() },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearToken();
    }
    throw new ApiError("Not authenticated", response.status);
  }

  return await response.json();
}

// API Functions

export async function uploadAudio(
  file: File,
  onProgress?: (percent: number) => void
): Promise<Job> {
  // Pre-load API URL so the sync getter works inside the XHR callback
  await getApiUrl();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const job: Job = JSON.parse(xhr.responseText);
          resolve(job);
        } catch {
          reject(
            new ApiError(
              "Failed to parse response",
              xhr.status,
              xhr.responseText
            )
          );
        }
      } else if (xhr.status === 401 || xhr.status === 403) {
        clearToken();
        reject(new ApiError("Not authenticated", xhr.status));
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(
            new ApiError(
              errorData.detail || "Upload failed",
              xhr.status,
              errorData
            )
          );
        } catch {
          reject(
            new ApiError(
              `Upload failed with status ${xhr.status}`,
              xhr.status
            )
          );
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new ApiError("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new ApiError("Upload aborted"));
    });

    xhr.open("POST", `${getApiUrlSync()}/api/v1/jobs/upload`);
    const token = getToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

export async function getJob(id: string): Promise<Job> {
  const apiUrl = await getApiUrl();
  try {
    const response = await fetch(`${apiUrl}/api/v1/jobs/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearToken();
      }
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || `Failed to fetch job: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const job: Job = await response.json();
    return job;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch job"
    );
  }
}

export async function getJobs(): Promise<Job[]> {
  const apiUrl = await getApiUrl();
  try {
    const response = await fetch(`${apiUrl}/api/v1/jobs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearToken();
      }
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || `Failed to fetch jobs: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const jobs: Job[] = await response.json();
    return jobs;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch jobs"
    );
  }
}

export async function downloadExport(
  jobId: string,
  format: ExportFormat
): Promise<Blob> {
  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(
      `${apiUrl}/api/v1/jobs/${jobId}/export/${format}`,
      {
        method: "GET",
        headers: { ...authHeaders() },
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearToken();
      }
      const contentType = response.headers.get("content-type");
      let errorMessage = `Failed to download export: ${response.statusText}`;

      if (contentType?.includes("application/json")) {
        const errorData = await response.json().catch(() => ({}));
        errorMessage = errorData.detail || errorMessage;
        throw new ApiError(errorMessage, response.status, errorData);
      } else {
        const errorText = await response.text().catch(() => "");
        throw new ApiError(
          errorText || errorMessage,
          response.status
        );
      }
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to download export"
    );
  }
}
