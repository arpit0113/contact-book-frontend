import {Phone, Email} from './phone-email'

export type ContactType = 'PERSONAL' | 'COMMON';

export interface Contact {
    id:number;
    name:string;
    phones:Phone[];
    emails:Email[];
    notes:string;
    userId:number;
    type: ContactType;
}

export interface ContactPage{
    content : Contact[];
    page: number;
    size: number;
    hasMore:boolean;
}
