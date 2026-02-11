const RECAPTCHA_SITE_KEY = '6Lcvm2ksAAAAAPQ63bPl94XAfS2gTn2Fu4zMmT4f';
const LOAD_TIMEOUT_MS = 5000;

declare global {
  interface Window {
    grecaptcha?: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

/**
 * Waits for the reCAPTCHA script to load (polls for window.grecaptcha).
 * Resolves false if the script doesn't load within the timeout (ad blocker, etc.).
 */
function waitForRecaptcha(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.grecaptcha) {
      resolve(true);
      return;
    }

    const interval = 100;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      if (window.grecaptcha) {
        clearInterval(timer);
        resolve(true);
      } else if (elapsed >= LOAD_TIMEOUT_MS) {
        clearInterval(timer);
        resolve(false);
      }
    }, interval);
  });
}

/**
 * Generates a fresh reCAPTCHA v3 token for the given action.
 * Waits up to 5 seconds for the script to load (async defer).
 * Returns an empty string if the script is unavailable (ad blocker, SSR, timeout).
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  const loaded = await waitForRecaptcha();
  if (!loaded) return '';

  return new Promise((resolve) => {
    window.grecaptcha!.ready(() => {
      window.grecaptcha!
        .execute(RECAPTCHA_SITE_KEY, { action })
        .then(resolve)
        .catch(() => resolve(''));
    });
  });
}
