import { ApiError, handleApiError, withErrorHandling } from '../api-error';

describe('ApiError', () => {
  describe('constructor', () => {
    it('creates error with message', () => {
      const error = new ApiError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ApiError');
    });

    it('creates error with custom statusCode', () => {
      const error = new ApiError('Test error', 404);
      expect(error.statusCode).toBe(404);
    });

    it('creates error with code and details', () => {
      const error = new ApiError('Test error', 400, 'BAD_REQUEST', { field: 'email' });
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('static factory methods', () => {
    it('unauthorized creates 401 error', () => {
      const error = ApiError.unauthorized('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('forbidden creates 403 error', () => {
      const error = ApiError.forbidden('Forbidden');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('notFound creates 404 error', () => {
      const error = ApiError.notFound('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('badRequest creates 400 error with details', () => {
      const error = ApiError.badRequest('Bad request', { field: 'email' });
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.details).toEqual({ field: 'email' });
    });

    it('internal creates 500 error with details', () => {
      const error = ApiError.internal('Internal error', { stack: '...' });
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.details).toEqual({ stack: '...' });
    });
  });

  describe('toResponse', () => {
    it('returns response object', () => {
      const error = new ApiError('Test error', 400, 'BAD_REQUEST', { field: 'email' });
      const response = error.toResponse();

      expect(response).toEqual({
        error: 'Test error',
        code: 'BAD_REQUEST',
        details: { field: 'email' },
      });
    });
  });
});

describe('handleApiError', () => {
  it('handles ApiError instance', async () => {
    const error = ApiError.badRequest('Bad request');
    const response = await handleApiError(error);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Bad request');
    expect(data.code).toBe('BAD_REQUEST');
  });

  it('handles generic Error', async () => {
    const error = new Error('Generic error');
    const response = await handleApiError(error);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Generic error');
    expect(data.code).toBe('INTERNAL_ERROR');
  });

  it('handles unknown error', async () => {
    const response = await handleApiError('string error');

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('An unknown error occurred');
    expect(data.code).toBe('INTERNAL_ERROR');
  });

  it('handles null error', async () => {
    const response = await handleApiError(null);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.code).toBe('INTERNAL_ERROR');
  });
});

describe('withErrorHandling', () => {
  it('returns handler result on success', async () => {
    const handler = jest.fn().mockResolvedValue(new Response('success', { status: 200 }));
    const wrapped = withErrorHandling(handler);

    const result = await wrapped('arg1', 'arg2');

    expect(result).toBeInstanceOf(Response);
    expect(await result.text()).toBe('success');
    expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('handles error from handler', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
    const wrapped = withErrorHandling(handler);

    const result = await wrapped();

    expect(result.status).toBe(500);
    const data = await result.json();
    expect(data.error).toBe('Handler error');
  });

  it('handles ApiError from handler', async () => {
    const handler = jest.fn().mockRejectedValue(ApiError.unauthorized());
    const wrapped = withErrorHandling(handler);

    const result = await wrapped();

    expect(result.status).toBe(401);
    const data = await result.json();
    expect(data.code).toBe('UNAUTHORIZED');
  });
});