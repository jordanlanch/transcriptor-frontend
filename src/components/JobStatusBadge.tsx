'use client';

interface JobStatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  queued: { label: 'Queued', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  processing: { label: 'Processing', bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
  transcribing: { label: 'Transcribing', bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
  translating: { label: 'Translating', bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300' },
  completed: { label: 'Completed', bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-700 dark:text-green-300' },
  failed: { label: 'Failed', bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-300' },
};

export default function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.queued;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
