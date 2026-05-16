import type { AxiosResponse } from 'axios';

import type { ApiError, ApiErrorEnvelope, ApiSuccessEnvelope } from '@/types/api';

export function toApiError(message: string, status?: number, code?: string, details?: unknown): ApiError {
  return { message, status, code, details };
}

export function unwrapResponse<T>(response: AxiosResponse<ApiSuccessEnvelope<T> | ApiErrorEnvelope>): T {
  const body = response.data;
  if (body && typeof body === 'object' && 'success' in body && body.success === false) {
    const err = body as ApiErrorEnvelope;
    throw toApiError(err.error || 'Request failed', response.status, err.code, err.details);
  }
  if (body && typeof body === 'object' && 'success' in body && body.success === true) {
    return (body as ApiSuccessEnvelope<T>).data;
  }
  throw toApiError('Invalid API response', response.status);
}

function messageFromDetails(details: unknown): string | null {
  if (!Array.isArray(details) || details.length === 0) {
    return null;
  }
  const parts = details
    .map((d) => {
      if (d && typeof d === 'object' && 'message' in d && typeof (d as { message: string }).message === 'string') {
        return (d as { message: string }).message;
      }
      return null;
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as ApiError).message === 'string') {
    const apiErr = error as ApiError;
    const fromDetails = messageFromDetails(apiErr.details);
    if (fromDetails) {
      return fromDetails;
    }
    return apiErr.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
