export type Role = string;
export type UserStatus = 'ACTIVE' | 'PENDING';
export type AccountType = 'SUPER_ADMIN' | 'PERSONAL' | 'ORG_MEMBER';

export interface User {
  id: number;
  name: string;
  email: string;
  organizationName: string | null;
  role: Role | null;
  permissions: string[];
  status: UserStatus;
  needsApproval: boolean;
  accountType: AccountType;
}
