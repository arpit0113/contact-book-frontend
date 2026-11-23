export const ACCESS_CODES = [
  'pending_approval',
  'no_organization_for_domain',
  'org_request_pending',
  'org_request_unverified',
  'org_request_rejected',
  'email_not_verified',
  'email_unavailable',
  'account_conflict',
] as const;

export function accessReason(err: any): string | null {
  const code = err?.error?.error;
  return err?.status === 403 && ACCESS_CODES.includes(code) ? code : null;
}