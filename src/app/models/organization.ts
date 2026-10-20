// Matches PendingUserDTO { userId, name, email }
export interface PendingUser {
  userId: number;
  name: string;
  email: string;
}
export interface OrgRole{
  id:number;
  name:string;
  systemRole: boolean;
  permissions: string[];
  userCount: number;
}

export interface ApproveUserRequest{
  roleId : number;
}

export interface PermissionInfo{
  code : string ;
  description : string;
}

export interface RoleRequest{
  name : string;
  permissions : string[];
}