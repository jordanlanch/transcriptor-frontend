'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import JobCard from '@/components/JobCard';
import { getJobs, type Job } from '@/lib/api';

const ACTIVE_STATUSES = ['queued', 'processing', 'transcribing', 'translating'];
const POLL_INTERVAL = 4000;

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'queued', label: 'Queued' },
  { value: 'transcribing', label: 'Transcribing' },
  { value: 'translating', label: 'Translating' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitialRef = useRef(true);

  const hasActiveJobs = useCallback((jobList: Job[]) => {
    return jobList.some((job) => ACTIVE_STATUSES.includes(job.status));
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      // Only show loading spinner on initial fetch
      if (isInitialRef.current) {
        setLoading(true);
      }
      const data = await getJobs();
      setJobs(data);

      // Start or stop polling based on active jobs
      if (hasActiveJobs(data)) {
        if (!pollingRef.current) {
          pollingRef.current = setInterval(fetchJobs, POLL_INTERVAL);
        }
      } else {
        stopPolling();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      if (isInitialRef.current) {
        setLoading(false);
        isInitialRef.current = false;
      }
    }
  }, [hasActiveJobs, stopPolling]);

  useEffect(() => {
    fetchJobs();
    return () => {
      stopPolling();
    };
  }, [fetchJobs, stopPolling]);

  const filteredJobs = statusFilter
    ? jobs.filter((job) => job.status === statusFilter)
    : jobs;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Jobs</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              All transcription and translation jobs
            </p>
          </div>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            New Upload
          </Link>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Loading jobs...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg mb-6">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Jobs list */}
        {!loading && !error && (
          <>
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {statusFilter ? 'No jobs match this filter' : 'No jobs yet'}
                </p>
                <Link
                  href="/"
                  className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Upload your first file
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
