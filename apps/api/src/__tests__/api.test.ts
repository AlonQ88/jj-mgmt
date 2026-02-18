import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';

describe('API routes', () => {
  const app = createApp();

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

  it('POST /auth/social/apple rejects invalid payload', async () => {
    const response = await request(app).post('/auth/social/apple').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid payload');
  });

  it('POST /auth/social/google accepts payload but returns scaffold placeholder', async () => {
    const response = await request(app)
      .post('/auth/social/google')
      .send({ idToken: 'sample-id-token' });

    expect(response.status).toBe(501);
    expect(response.body.message).toContain('Google social auth endpoint scaffolded');
  });

  it('POST /auth/social/google also accepts accessToken payload', async () => {
    const response = await request(app)
      .post('/auth/social/google')
      .send({ accessToken: 'sample-access-token' });

    expect(response.status).toBe(501);
    expect(response.body.tokenTypeReceived).toBe('accessToken');
  });

  it('POST /auth/social/apple accepts payload but returns scaffold placeholder', async () => {
    const response = await request(app)
      .post('/auth/social/apple')
      .send({ idToken: 'sample-id-token' });

    expect(response.status).toBe(501);
    expect(response.body.message).toContain('Apple social auth endpoint scaffolded');
  });
});
