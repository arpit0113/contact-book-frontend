
export function apiError(err: any, fallback: string): string {
  if (err?.status === 0) return 'Cannot reach the server';
  const body = err?.error;
  if (body?.fieldErrors?.length) {
    return body.fieldErrors.map((f: { message: string }) => f.message).join(', ');
  }
  return body?.message ?? body?.error ?? fallback;
}
