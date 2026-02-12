'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import { uploadAudio } from '@/lib/api';

interface UploadError {
  filename: string;
  error: string;
}

interface UploadProgress {
  total: number;
  current: number;
  currentFileName: string;
}

export default function Home() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);

  const handleUploadStart = async (files: File[]) => {
    setIsUploading(true);
    setUploadErrors([]);

    let successCount = 0;
    const errors: UploadError[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({
        total: files.length,
        current: i + 1,
        currentFileName: file.name,
      });

      try {
        await uploadAudio(file);
        successCount++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        errors.push({ filename: file.name, error: errorMessage });
      }
    }

    setUploadErrors(errors);
    setIsUploading(false);
    setUploadProgress(null);

    if (successCount > 0) {
      // Brief delay to let user see any errors before redirect
      if (errors.length > 0) {
        setTimeout(() => router.push('/jobs'), 1500);
      } else {
        router.push('/jobs');
      }
    }
  };

  const allFailed = uploadErrors.length > 0 && !isUploading && !uploadProgress;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Audio Transcriptor
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Upload Spanish audio files to get automatic transcription and English translation
          </p>
        </header>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Uploading file {uploadProgress.current} of {uploadProgress.total}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    {uploadProgress.currentFileName}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Errors */}
        {uploadErrors.length > 0 && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              {allFailed && (
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                  All uploads failed
                </p>
              )}
              {uploadErrors.map((err, i) => (
                <p key={i} className="text-sm text-red-600 dark:text-red-400">
                  {err.filename} failed: {err.error}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main>
          <section>
            <FileUpload
              onUploadStart={handleUploadStart}
              isUploading={isUploading}
            />
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Powered by OpenAI Whisper and GPT-4
          </p>
        </footer>
      </div>
    </div>
  );
}
