import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { createAuthRouter } from '../routes/auth.js';
import { AuthValidationError } from '../services/auth.js';

describe('API routes', () => {
  const mockVerifyGoogle = vi.fn();
  const mockVerifyApple = vi.fn();
  const mockIssueSession = vi.fn();
  const mockVerifySession = vi.fn();

  const app = createApp({
    authRoutes: createAuthRouter({
      verifyGoogle: mockVerifyGoogle,
      verifyApple: mockVerifyApple,
      issueSession: mockIssueSession,
      verifySession: mockVerifySession,
    }),
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('GET / returns service status', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      service: 'jj-mgmt-api',
      status: 'running',
    });
  });

  it('GET /health returns ok response', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.service).toBe('jj-mgmt-api');
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('POST /auth/social/google rejects invalid payload', async () => {
    const response = await request(app).post('/auth/social/google').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid payload');
  });

  it('GET /auth/me rejects when bearer token is missing', async () => {
    const response = await request(app).get('/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Missing bearer token');
  });

  it('GET /auth/me returns current user when session token is valid', async () => {
    mockVerifySession.mockResolvedValueOnce({
      provider: 'google',
      providerUserId: 'google-sub-123',
      email: 'student@example.com',
      role: 'student',
    });

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer valid-session-token');

    expect(response.status).toBe(200);
    expect(response.body.user.provider).toBe('google');
    expect(response.body.user.role).toBe('student');
  });

  it('POST /auth/social/apple rejects invalid payload', async () => {
    const response = await request(app).post('/auth/social/apple').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid payload');
  });

  it('POST /auth/social/google returns app session when verification succeeds', async () => {
    mockVerifyGoogle.mockResolvedValueOnce({
      provider: 'google',
      providerUserId: 'google-sub-123',
      email: 'student@example.com',
      name: 'Student One',
      emailVerified: true,
    });
    mockIssueSession.mockResolvedValueOnce('app-jwt-token');

    const response = await request(app)
      .post('/auth/social/google')
      .send({ idToken: 'sample-id-token' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe('app-jwt-token');
    expect(response.body.user.provider).toBe('google');
  });

  it('POST /auth/social/google also accepts accessToken payload', async () => {
    mockVerifyGoogle.mockResolvedValueOnce({
      provider: 'google',
      providerUserId: 'google-sub-456',
    });
    mockIssueSession.mockResolvedValueOnce('app-jwt-token-2');

    const response = await request(app)
      .post('/auth/social/google')
      .send({ accessToken: 'sample-access-token' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe('app-jwt-token-2');
  });

  it('POST /auth/social/apple returns app session when verification succeeds', async () => {
    mockVerifyApple.mockResolvedValueOnce({
      provider: 'apple',
      providerUserId: 'apple-sub-123',
      email: 'student@example.com',
    });
    mockIssueSession.mockResolvedValueOnce('apple-session-token');

    const response = await request(app)
      .post('/auth/social/apple')
      .send({ idToken: 'sample-id-token' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe('apple-session-token');
    expect(response.body.user.provider).toBe('apple');
  });

  it('POST /auth/social/google returns 401 when token verification fails', async () => {
    mockVerifyGoogle.mockRejectedValueOnce(new AuthValidationError('invalid token'));

    const response = await request(app)
      .post('/auth/social/google')
      .send({ idToken: 'bad-token' });

    expect(response.status).toBe(401);
  });
});
