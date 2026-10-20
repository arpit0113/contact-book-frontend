export type Role = string;
export type UserStatus = 'ACTIVE' | 'PENDING';

export interface User {
  id: number;
  name: string;
  email: string;
  organizationName: string | null;
  role: Role | null;
  permissions: string[];
  status: UserStatus;
}
