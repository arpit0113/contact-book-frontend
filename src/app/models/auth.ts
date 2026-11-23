

export interface OrgCreationRequest {
    adminName: string;
    adminEmail: string;
    orgName?: string;
}
export interface OrgCreationResponse {
    requestId: number;
    message: string;
}
export interface OtpVerifyRequest {
    requestedId: string;
    otp: string;
}
export interface ResendOtpRequest {
    requestId: string;
    adminEmail: string;
}
export type OrgRequestStatus =
    "PENDING_OTP" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
    
export interface OrgCreationRequestSummary {
    id: number;
    orgName: string;
    orgDomain: string;
    adminName: string;
    adminEmail: string;
    status: OrgRequestStatus;
    createdAt: string;
    reviewNote: string | null;
}
