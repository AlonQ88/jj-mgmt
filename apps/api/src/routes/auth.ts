import { Router } from 'express';
import { z } from 'zod';

export const authRouter = Router();

const socialAuthSchema = z.object({
  idToken: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
}).refine((value) => value.idToken || value.accessToken, {
  message: 'Either idToken or accessToken is required',
});

authRouter.post('/social/google', (req, res) => {
  const parsed = socialAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  // TODO: Verify Google token server-side and issue app session/JWT.
  return res.status(501).json({
    message: 'Google social auth endpoint scaffolded. Implement token verification next.',
    tokenTypeReceived: parsed.data.idToken ? 'idToken' : 'accessToken',
  });
});

authRouter.post('/social/apple', (req, res) => {
  const parsed = socialAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  // TODO: Verify Apple identity token server-side and issue app session/JWT.
  return res.status(501).json({
    message: 'Apple social auth endpoint scaffolded. Implement token verification next.',
    tokenTypeReceived: parsed.data.idToken ? 'idToken' : 'accessToken',
  });
});
