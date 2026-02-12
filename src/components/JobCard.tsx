'use client';

import Link from 'next/link';
import type { Job } from '@/lib/types';
import JobStatusBadge from './JobStatusBadge';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {job.filename}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatFileSize(job.file_size_bytes)} &middot; {job.original_format.toUpperCase()}
            </p>
          </div>
          <JobStatusBadge status={job.status} />
        </div>

        {job.status !== 'completed' && job.status !== 'failed' && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>{job.current_step}</span>
              <span>{job.progress_percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${job.progress_percent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{formatDate(job.created_at)}</span>
          {job.duration_seconds && (
            <span>{Math.round(job.duration_seconds)}s audio</span>
          )}
        </div>
      </div>
    </Link>
  );
}
