'use client';

import { useState } from 'react';
import type { TranscriptionResult, TranslationResult } from '@/lib/types';

interface ResultsPanelProps {
  transcription: TranscriptionResult;
  translation: TranslationResult;
}

export default function ResultsPanel({ transcription, translation }: ResultsPanelProps) {
  const [showTimestamps, setShowTimestamps] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header with stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Audio Duration</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {formatDuration(transcription.duration_seconds)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Spanish Words</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {transcription.word_count.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">English Words</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {translation.word_count.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Toggle timestamps button */}
      {transcription.segments && transcription.segments.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowTimestamps(!showTimestamps)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {showTimestamps ? 'Hide' : 'Show'} Timestamps
          </button>
        </div>
      )}

      {/* Results display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spanish Transcription */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Spanish Transcription
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Original Audio ({transcription.language})
            </p>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {showTimestamps && transcription.segments && transcription.segments.length > 0 ? (
              <div className="space-y-3">
                {transcription.segments.map((segment, index) => (
                  <div key={index} className="group">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-600 mt-1 min-w-[60px]">
                        {formatTime(segment.start)}
                      </span>
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed flex-1">
                        {segment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                {transcription.text}
              </p>
            )}
          </div>
        </div>

        {/* English Translation */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              English Translation
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {translation.source_language} → {translation.target_language}
            </p>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {translation.text}
            </p>
          </div>
        </div>
      </div>

      {/* Language detection badge */}
      <div className="mt-4 flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-full">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Detected language: {transcription.language}
          </span>
        </div>
      </div>
    </div>
  );
}
