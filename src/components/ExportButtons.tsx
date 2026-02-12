'use client';

import { useState } from 'react';
import { downloadExport, type ExportFormat } from '@/lib/api';

interface ExportButtonsProps {
  jobId: string;
  hasSegments: boolean;
  filename: string;
}

export default function ExportButtons({ jobId, hasSegments, filename }: ExportButtonsProps) {
  const [downloading, setDownloading] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (format: ExportFormat) => {
    try {
      setDownloading(format);
      setError(null);

      const blob = await downloadExport(jobId, format);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename
      const baseName = filename.replace(/\.[^/.]+$/, '');
      link.download = `${baseName}.${format}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Export Results
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* TXT Export */}
          <button
            onClick={() => handleDownload('txt')}
            disabled={downloading !== null}
            className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-10 h-10 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="text-center">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {downloading === 'txt' ? 'Downloading...' : 'Plain Text'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                .txt file
              </p>
            </div>
          </button>

          {/* DOCX Export */}
          <button
            onClick={() => handleDownload('docx')}
            disabled={downloading !== null}
            className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-10 h-10 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <div className="text-center">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {downloading === 'docx' ? 'Downloading...' : 'Word Document'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                .docx file
              </p>
            </div>
          </button>

          {/* SRT Export */}
          <button
            onClick={() => handleDownload('srt')}
            disabled={downloading !== null || !hasSegments}
            className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!hasSegments ? 'Subtitles not available for this file' : ''}
          >
            <svg
              className={`w-10 h-10 ${
                hasSegments
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
            <div className="text-center">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {downloading === 'srt' ? 'Downloading...' : 'Subtitles'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {hasSegments ? '.srt file' : 'Not available'}
              </p>
            </div>
          </button>
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">TXT:</span> Simple text format with Spanish and English side-by-side
            <br />
            <span className="font-medium">DOCX:</span> Formatted Microsoft Word document with columns
            <br />
            <span className="font-medium">SRT:</span> Subtitle file with timestamps (for video editing)
          </p>
        </div>
      </div>
    </div>
  );
}
