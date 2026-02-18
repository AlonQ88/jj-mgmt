import { type Response, Router } from 'express';
import { z } from 'zod';
import {
  AuthConfigError,
  AuthValidationError,
  issueAppSessionToken,
  verifyAppSessionToken,
  verifyAppleIdToken,
  verifyGoogleToken,
  type AuthenticatedUser,
  type SocialPayload,
} from '../services/auth.js';

const socialAuthSchema = z.object({
  idToken: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
}).refine((value) => value.idToken || value.accessToken, {
  message: 'Either idToken or accessToken is required',
});

type AuthRouterDeps = {
  verifyGoogle: (payload: SocialPayload) => Promise<AuthenticatedUser>;
  verifyApple: (payload: SocialPayload) => Promise<AuthenticatedUser>;
  issueSession: (user: AuthenticatedUser) => Promise<string>;
  verifySession: (token: string) => Promise<AuthenticatedUser>;
};

const defaultDeps: AuthRouterDeps = {
  verifyGoogle: verifyGoogleToken,
  verifyApple: verifyAppleIdToken,
  issueSession: issueAppSessionToken,
  verifySession: verifyAppSessionToken,
};

const parsePayload = (rawBody: unknown) => {
  const parsed = socialAuthSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { error: parsed.error.flatten() } as const;
  }

  return { data: parsed.data } as const;
};

const handleAuthError = (error: unknown, res: Response) => {
  if (error instanceof AuthValidationError) {
    return res.status(401).json({ error: 'Token validation failed', message: error.message });
  }

  if (error instanceof AuthConfigError) {
    return res.status(500).json({ error: 'Auth configuration error', message: error.message });
  }

  console.error('Unexpected auth error', error);
  return res.status(500).json({ error: 'Unexpected auth error' });
};

export const createAuthRouter = (deps: AuthRouterDeps = defaultDeps) => {
  const router = Router();

  router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    try {
      const user = await deps.verifySession(token);
      return res.status(200).json({ user });
    } catch (error) {
      return handleAuthError(error, res);
    }
  });

  router.post('/social/google', async (req, res) => {
    const parsed = parsePayload(req.body);
    if ('error' in parsed) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error });
    }

    try {
      const user = await deps.verifyGoogle(parsed.data);
      const token = await deps.issueSession(user);

      return res.status(200).json({
        token,
        user,
      });
    } catch (error) {
      return handleAuthError(error, res);
    }
  });

  router.post('/social/apple', async (req, res) => {
    const parsed = parsePayload(req.body);
    if ('error' in parsed) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error });
    }

    try {
      const user = await deps.verifyApple(parsed.data);
      const token = await deps.issueSession(user);

      return res.status(200).json({
        token,
        user,
      });
    } catch (error) {
      return handleAuthError(error, res);
    }
  });

  return router;
};

export const authRouter = createAuthRouter();
