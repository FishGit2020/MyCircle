import axios from 'axios';

const SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const SCORE_THRESHOLD = 0.5;

interface VerifyResult {
  valid: boolean;
  score?: number;
  reason?: string;
}

export async function verifyRecaptchaToken(
  token: string,
  secretKey: string
): Promise<VerifyResult> {
  if (!token) {
    return { valid: false, reason: 'Missing reCAPTCHA token' };
  }

  try {
    const { data } = await axios.post(
      SITEVERIFY_URL,
      new URLSearchParams({ secret: secretKey, response: token }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (!data.success) {
      return {
        valid: false,
        score: data.score,
        reason: `reCAPTCHA verification failed: ${(data['error-codes'] || []).join(', ')}`
      };
    }

    if (data.score < SCORE_THRESHOLD) {
      return {
        valid: false,
        score: data.score,
        reason: `reCAPTCHA score too low: ${data.score}`
      };
    }

    return { valid: true, score: data.score };
  } catch (error: any) {
    return {
      valid: false,
      reason: `reCAPTCHA verification request failed: ${error.message}`
    };
  }
}
