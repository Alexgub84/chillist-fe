import { ApiError } from './api-client';

export interface UserFriendlyError {
  title: string;
  message: string;
  canRetry: boolean;
}

interface ErrorWithStatus extends Error {
  status?: number;
}

export function getApiErrorMessage(error: Error): UserFriendlyError {
  // Check for ApiError or any error with a status property (from api.ts)
  const errorWithStatus = error as ErrorWithStatus;
  if (error instanceof ApiError || typeof errorWithStatus.status === 'number') {
    return getApiErrorByStatus(errorWithStatus.status!, error.message);
  }

  if (
    error.message.includes('Network error') ||
    error.message.includes('fetch')
  ) {
    return {
      title: 'Connection Problem',
      message:
        'Unable to connect to the server. Please check your internet connection and try again.',
      canRetry: true,
    };
  }

  if (error.message.includes('Expected JSON')) {
    return {
      title: 'Server Configuration Error',
      message:
        'The server returned an unexpected response. Please try again later or contact support.',
      canRetry: true,
    };
  }

  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    canRetry: true,
  };
}

function getApiErrorByStatus(
  status: number,
  originalMessage: string
): UserFriendlyError {
  switch (status) {
    case 400:
      return {
        title: 'Invalid Request',
        message:
          originalMessage && originalMessage !== 'API request failed'
            ? originalMessage
            : 'The request was invalid. Please check your input and try again.',
        canRetry: false,
      };

    case 401:
      return {
        title: 'Authentication Required',
        message:
          'You need to be logged in to access this. Please sign in and try again.',
        canRetry: false,
      };

    case 403:
      return {
        title: 'Access Denied',
        message: "You don't have permission to access this resource.",
        canRetry: false,
      };

    case 404:
      return {
        title: 'Not Found',
        message: 'The requested resource could not be found.',
        canRetry: false,
      };

    case 408:
    case 504:
      return {
        title: 'Request Timeout',
        message: 'The server took too long to respond. Please try again.',
        canRetry: true,
      };

    case 429:
      return {
        title: 'Too Many Requests',
        message:
          'You have made too many requests. Please wait a moment and try again.',
        canRetry: true,
      };

    case 500:
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        canRetry: true,
      };

    case 502:
    case 503:
      return {
        title: 'Service Unavailable',
        message:
          'The service is temporarily unavailable. Please try again in a few minutes.',
        canRetry: true,
      };

    default:
      return {
        title: 'Error',
        message: originalMessage || 'An unexpected error occurred.',
        canRetry: true,
      };
  }
}
