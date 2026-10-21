export type ApprovalMode = 'SEQUENTIAL' | 'ANY_ONE';

export type PolicyAction = 'CREATE' | 'UPDATE';

export  interface WorkflowStep {
    order: number;
    roleId: number;
    roleName: string;
}

export interface Workflow{
    id: number;
    name: string;
    mode: ApprovalMode;
    steps: WorkflowStep[];
    pendingCount: number;
}

export interface WorkflowRequest{
    name: string;
    mode: ApprovalMode;
    roleIds: number[];
}

export interface ApprovalPolicy{
    id: number;
    actionType: PolicyAction;
    requesterRoleId: number;
    requesterRoleName: string;
    workflowId: number;
    workflowName: string;
}

export interface PolicyRequest{
    actionType : PolicyAction;
    requesterRoleId : number;
    workflowId : number;
}