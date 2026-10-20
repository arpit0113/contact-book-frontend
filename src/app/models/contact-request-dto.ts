import{Phone, Email} from './phone-email';
import { Contact,ContactType } from './contact';


export interface ContactRequestDTO {
    name:string;
    phones:Phone[];
    emails:Email[];
    notes:string;
    type:ContactType;
}

export interface ContactWriteResultDTO{
    pendingApproval: boolean;
    contact: Contact|null;
    request : ContactChangeRequest;
}

export type ContactActionType = 'CREATE' | 'UPDATE';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ContactChangeRequest {
    id : number;
    actionType : ContactActionType;
    targetContactId : number | null;
    requestedName : string;
    requestedPhones : Phone[];
    requestedEmails : Email[];
    requestedNotes : string;
    status : RequestStatus;
    requestedByName : string;
    reviewNote : string | null ;
}