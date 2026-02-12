'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import ProgressBar from '@/components/ProgressBar';
import ResultsPanel from '@/components/ResultsPanel';
import ExportButtons from '@/components/ExportButtons';
import JobStatusBadge from '@/components/JobStatusBadge';
import { getJob, type Job } from '@/lib/api';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const data = await getJob(id);
      setJob(data);

      // Continue polling if processing
      if (data.status !== 'completed' && data.status !== 'failed') {
        setTimeout(() => fetchJob(), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error || 'Job not found'}</p>
          </div>
          <Link href="/jobs" className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline">
            Back to jobs
          </Link>
        </div>
      </div>
    );
  }

  const showProgress = job.status !== 'completed' && job.status !== 'failed';
  const showResults = job.status === 'completed' && job.transcription && job.translation;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/jobs" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            &larr; Back to jobs
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{job.filename}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {job.original_format.toUpperCase()} &middot; Job {job.id.slice(0, 8)}...
              </p>
            </div>
            <JobStatusBadge status={job.status} />
          </div>
        </div>

        {/* Error */}
        {job.error_message && job.status === 'failed' && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{job.error_message}</p>
          </div>
        )}

        {/* Progress */}
        {showProgress && (
          <section className="mb-8">
            <ProgressBar
              status={job.status}
              currentStep={job.current_step}
              progressPercent={job.progress_percent}
            />
          </section>
        )}

        {/* Results */}
        {showResults && job.transcription && job.translation && (
          <div className="space-y-8">
            <section>
              <ResultsPanel transcription={job.transcription} translation={job.translation} />
            </section>
            <section>
              <ExportButtons
                jobId={job.id}
                hasSegments={job.transcription.segments && job.transcription.segments.length > 0}
                filename={job.filename}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
