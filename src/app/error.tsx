'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

/**
 * Global error boundary for the application.
 * Catches and displays unhandled errors with recovery options.
 * Logs errors to console in development for debugging.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error details for debugging
    console.error('[App Error Boundary]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900">
      <div className="max-w-md w-full mx-4 p-8 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        
        <h1 className="text-lg font-semibold text-white text-center mb-2">
          Something went wrong
        </h1>
        
        <p className="text-sm text-zinc-400 text-center mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        {process.env.NODE_ENV === 'development' && error.digest && (
          <div className="mb-4 p-3 bg-zinc-700/50 rounded text-xs text-zinc-300 font-mono overflow-auto max-h-20">
            <strong>Error ID:</strong> {error.digest}
          </div>
        )}

        <button
          onClick={() => reset()}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCcw size={16} />
          Try again
        </button>
      </div>
    </div>
  );
}
