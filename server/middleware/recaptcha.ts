import type { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const SCORE_THRESHOLD = 0.5;

let warnedOnce = false;

export function recaptchaMiddleware(req: Request, res: Response, next: NextFunction) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    if (!warnedOnce) {
      console.warn(
        'RECAPTCHA_SECRET_KEY is not set — reCAPTCHA verification is disabled in dev mode'
      );
      warnedOnce = true;
    }
    next();
    return;
  }

  const token = req.headers['x-recaptcha-token'] as string;

  if (!token) {
    res.status(403).json({
      errors: [{
        message: 'Missing reCAPTCHA token',
        extensions: { code: 'UNAUTHENTICATED' }
      }]
    });
    return;
  }

  axios
    .post(
      SITEVERIFY_URL,
      new URLSearchParams({ secret: secretKey, response: token }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    .then(({ data }) => {
      if (!data.success || data.score < SCORE_THRESHOLD) {
        const reason = !data.success
          ? `reCAPTCHA verification failed: ${(data['error-codes'] || []).join(', ')}`
          : `reCAPTCHA score too low: ${data.score}`;
        console.warn(reason);
        res.status(403).json({
          errors: [{
            message: reason,
            extensions: { code: 'UNAUTHENTICATED' }
          }]
        });
        return;
      }
      next();
    })
    .catch((error) => {
      console.error('reCAPTCHA verification request failed:', error.message);
      res.status(403).json({
        errors: [{
          message: 'reCAPTCHA verification request failed',
          extensions: { code: 'UNAUTHENTICATED' }
        }]
      });
    });
}
