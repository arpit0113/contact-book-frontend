import { User } from "./user";

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignUpRequest {
    name: string;
    email: string;
    password: string;
}
export interface AuthResponse {
    status: "ACTIVE" | "PENDING";
    // backend field is spelled `accesstoken` (lowercase t) in AuthResponseDTO
    accesstoken: string | null;
    refreshToken: string | null;
    message: string;
    user: User;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface OrgCreationRequest {
    adminName: string;
    adminEmail: string;
    password: string;
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
