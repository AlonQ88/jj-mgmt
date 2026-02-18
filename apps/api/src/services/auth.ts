import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';

export type Provider = 'google' | 'apple';

export type SocialPayload = {
  idToken?: string;
  accessToken?: string;
};

export type AuthenticatedUser = {
  provider: Provider;
  providerUserId: string;
  email?: string;
  name?: string;
  emailVerified?: boolean;
};

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigError';
  }
}

export class AuthValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthValidationError';
  }
}

const googleClient = new OAuth2Client();
const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }
  }

  return undefined;
};

export const verifyGoogleToken = async (payload: SocialPayload): Promise<AuthenticatedUser> => {
  if (payload.idToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new AuthConfigError('GOOGLE_CLIENT_ID is required to verify Google idToken.');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: clientId,
    });

    const claims = ticket.getPayload();
    if (!claims?.sub) {
      throw new AuthValidationError('Google idToken is missing subject.');
    }

    return {
      provider: 'google',
      providerUserId: claims.sub,
      email: claims.email ?? undefined,
      name: claims.name ?? undefined,
      emailVerified: claims.email_verified ?? undefined,
    };
  }

  if (payload.accessToken) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${payload.accessToken}` },
    });

    if (!response.ok) {
      throw new AuthValidationError(`Google accessToken rejected with status ${response.status}.`);
    }

    const profile = (await response.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      email_verified?: boolean;
    };

    if (!profile.sub) {
      throw new AuthValidationError('Google userinfo response missing subject.');
    }

    return {
      provider: 'google',
      providerUserId: profile.sub,
      email: profile.email,
      name: profile.name,
      emailVerified: profile.email_verified,
    };
  }

  throw new AuthValidationError('Google token is required.');
};

export const verifyAppleIdToken = async (payload: SocialPayload): Promise<AuthenticatedUser> => {
  if (!payload.idToken) {
    throw new AuthValidationError('Apple idToken is required.');
  }

  const appleAudience = [process.env.APPLE_SERVICE_ID, process.env.APPLE_BUNDLE_ID].filter(
    Boolean
  ) as string[];

  if (!appleAudience.length) {
    throw new AuthConfigError(
      'Set APPLE_SERVICE_ID or APPLE_BUNDLE_ID to verify Apple identity tokens.'
    );
  }

  const verified = await jwtVerify(payload.idToken, appleJwks, {
    issuer: 'https://appleid.apple.com',
    audience: appleAudience,
  });

  const claims = verified.payload;
  const sub = typeof claims.sub === 'string' ? claims.sub : undefined;
  if (!sub) {
    throw new AuthValidationError('Apple idToken is missing subject.');
  }

  return {
    provider: 'apple',
    providerUserId: sub,
    email: typeof claims.email === 'string' ? claims.email : undefined,
    emailVerified: parseBoolean(claims.email_verified),
  };
};

export const issueAppSessionToken = async (user: AuthenticatedUser): Promise<string> => {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret) {
    throw new AuthConfigError('APP_JWT_SECRET is required to issue app sessions.');
  }

  const jwtSecret = new TextEncoder().encode(secret);

  return new SignJWT({
    provider: user.provider,
    providerUserId: user.providerUserId,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    role: 'student',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.providerUserId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(jwtSecret);
};
