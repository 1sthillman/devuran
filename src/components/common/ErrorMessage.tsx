/**
 * Error Message Component
 */

import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Bir Hata Oluştu</h3>
          <p className="text-sm text-gray-600">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Tekrar Dene →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
