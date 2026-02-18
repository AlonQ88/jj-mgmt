import { Router } from 'express';
import { z } from 'zod';

export const authRouter = Router();

const socialAuthSchema = z.object({
  idToken: z.string().min(1),
});

authRouter.post('/social/google', (req, res) => {
  const parsed = socialAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  // TODO: Verify Google token server-side and issue app session/JWT.
  return res.status(501).json({
    message: 'Google social auth endpoint scaffolded. Implement token verification next.',
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
  });
});
