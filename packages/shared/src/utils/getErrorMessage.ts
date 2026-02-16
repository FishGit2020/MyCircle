/**
 * Safely extract an error message from an unknown caught value.
 *
 * Usage:
 *   try { ... } catch (err) { console.error(getErrorMessage(err)); }
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return 'An unknown error occurred';
}
