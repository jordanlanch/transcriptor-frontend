'use client';

interface ProgressBarProps {
  status: 'queued' | 'processing' | 'transcribing' | 'translating' | 'completed' | 'failed';
  currentStep: string;
  progressPercent: number;
}

const STATUS_COLORS = {
  queued: 'bg-gray-500',
  processing: 'bg-blue-500',
  transcribing: 'bg-blue-500',
  translating: 'bg-purple-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

const STATUS_TEXT_COLORS = {
  queued: 'text-gray-700 dark:text-gray-300',
  processing: 'text-blue-700 dark:text-blue-300',
  transcribing: 'text-blue-700 dark:text-blue-300',
  translating: 'text-purple-700 dark:text-purple-300',
  completed: 'text-green-700 dark:text-green-300',
  failed: 'text-red-700 dark:text-red-300',
};

const STATUS_BG_COLORS = {
  queued: 'bg-gray-100 dark:bg-gray-800',
  processing: 'bg-blue-100 dark:bg-blue-950',
  transcribing: 'bg-blue-100 dark:bg-blue-950',
  translating: 'bg-purple-100 dark:bg-purple-950',
  completed: 'bg-green-100 dark:bg-green-950',
  failed: 'bg-red-100 dark:bg-red-950',
};

const STATUS_LABELS = {
  queued: 'Queued',
  processing: 'Processing',
  transcribing: 'Transcribing',
  translating: 'Translating',
  completed: 'Completed',
  failed: 'Failed',
};

export default function ProgressBar({ status, currentStep, progressPercent }: ProgressBarProps) {
  const isActive = status !== 'completed' && status !== 'failed';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {isActive && (
            <div className="w-5 h-5">
              <svg
                className="animate-spin text-blue-600 dark:text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
          {status === 'completed' && (
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {status === 'failed' && (
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <p className={`font-medium ${STATUS_TEXT_COLORS[status]}`}>
            {currentStep || STATUS_LABELS[status]}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_BG_COLORS[status]} ${STATUS_TEXT_COLORS[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-300 ${STATUS_COLORS[status]} ${
            isActive ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {progressPercent}%
        </span>
        {status === 'completed' && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Processing complete
          </span>
        )}
      </div>
    </div>
  );
}
