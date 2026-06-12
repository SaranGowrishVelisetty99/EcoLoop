export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Not found') {
    return new ApiError(message, 404, 'NOT_FOUND');
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new ApiError(message, 400, 'BAD_REQUEST', details);
  }

  static internal(message = 'Internal server error', details?: unknown) {
    return new ApiError(message, 500, 'INTERNAL_ERROR', details);
  }

  toResponse() {
    return {
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(error.toResponse(), { status: error.statusCode });
  }

  if (error instanceof Error) {
    console.error('Unhandled error:', error);
    return Response.json(
      ApiError.internal(error.message).toResponse(),
      { status: 500 }
    );
  }

  console.error('Unknown error:', error);
  return Response.json(
    ApiError.internal('An unknown error occurred').toResponse(),
    { status: 500 }
  );
}

export function withErrorHandling<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}