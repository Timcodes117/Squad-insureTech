export type ApiError = {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
};

export type ApiSuccessEnvelope<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiErrorEnvelope = {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
};
