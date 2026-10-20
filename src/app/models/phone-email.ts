export type PhoneLable = 'MOBILE' | 'WORK' | 'HOME' | 'OTHER';
export type EmailLable = 'WORK' | 'HOME' | 'OTHER';

export interface Phone {
  phone: string;
  lable: PhoneLable;
  primary: boolean;
}

export interface Email {
  email: string;
  lable: EmailLable;
  primary: boolean;
}
