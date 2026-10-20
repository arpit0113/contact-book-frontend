import { Component, OnDestroy, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { apiError } from '../../utils/api-error';

type Step = 'details' | 'otp' | 'done';
const PENDING_KEY = 'pendingOrgReuqest';
const CoolDown_Seconds = 60;

@Component({
  selector: 'app-register-organization',
  imports: [FormsModule, RouterLink],
  templateUrl: './register-organization.component.html',
  styleUrl: './register-organization.component.scss',
})
export class RegisterOrganizationComponent implements OnDestroy {

  step = signal<Step>('details');
  loading = signal(false);
  error = signal('');
  info = signal('');
  resendCooldown = signal(0);

  adminName = '';
  adminEmail = '';
  password = '';
  orgName = '';
  otp = '';
  showPassword = false;

  private requestId: number | null = null;
  private timer?: ReturnType<typeof setInterval>;

  constructor(private auth: AuthService) {}

  ngOnInit(){
    try{
      const saved = JSON.parse(localStorage.getItem(PENDING_KEY)??'null');
      if(saved?.requestId && saved?.adminEmail){
        this.requestId = saved.requestId;
        this.adminEmail = saved.adminEmail;
        const elapsed = Math.floor((Date.now()-(saved.sentAt ?? 0))/1000)
        if(elapsed < CoolDown_Seconds) this.startCooldown(CoolDown_Seconds - elapsed)
        this.info.set(elapsed > 180 ? 'your code is expired press resend to get a new code'
             :`Enter the otp sent to ${saved.adminEmail}`);
        this.step.set('otp');
      }
    }catch{
      localStorage.removeItem(PENDING_KEY);
    }
  }

  startOver(){
    localStorage.removeItem(PENDING_KEY);
    clearInterval(this.timer);
    this.requestId = null;
    this.otp = '';
    this.info.set('');
    this.error.set('');
    this.resendCooldown.set(0);
    this.step.set('details');
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  submitDetails(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.auth
      .requestOrganization({
        adminName: this.adminName,
        adminEmail: this.adminEmail,
        password: this.password,
        orgName: this.orgName.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.requestId = res.requestId;
          this.saveProgress();
          this.info.set(res.message);
          this.step.set('otp');
          this.loading.set(false);
          this.startCooldown(60);
        },
        error: (err) => {
          this.error.set(apiError(err, 'Could not submit the request'));
          this.loading.set(false);
        },
      });
  }

  verify(form: NgForm) {
    if(this.requestId == null){
      this.startOver();
      this.error.set('your session expired please submit your details again.');
      return;
    }
    const code = this.otp.trim();
    if(!code){
      this.error.set('please enter the otp sent to your email');
      return;
    }
    if(!/^\d{6}$/.test(code)){
      this.error.set('the otp must be exactly 6 digits.');
      return;
    }
    if (form.invalid ) {
      form.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.auth.verifyOtp({ requestedId: String(this.requestId), otp: this.otp.trim() }).subscribe({
      next: (res) => {
        localStorage.removeItem(PENDING_KEY);
        this.info.set(res.message);
        this.step.set('done');
        this.loading.set(false);
      },
      error: (err) => {
       this.handleOtpError(err,"could not verify the code");
       this.loading.set(false);
      },
    });
  }
 onOtpInput(event : Event){
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g,'').slice(0,6);
    input.value = clean
    this.error.set('');
  }
  get otpValid() : boolean{
    return /^\d{6}$/.test(this.otp);
  }
  resend() {
    if (this.requestId == null || this.resendCooldown() > 0) return;
    this.error.set('');
    this.auth.resendOtp({ requestId: String(this.requestId), adminEmail: this.adminEmail }).subscribe({
      next: (res) => {
        this.info.set(res.message);
        this.saveProgress();
        this.startCooldown(60); // backend rejects resends within 60s
      },
      error: (err) => this.error.set(apiError(err, 'Could not resend the code')),
    });
  }
 

  private saveProgress(){
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({requestId : this.requestId , adminEmail : this.adminEmail, sentAt : Date.now()})
    );
  }
  private handleOtpError(err: any, fallback: string){
    const msg = apiError(err, fallback);
    if(err?.status === 404 || msg.includes('not waiting')){
      this.startOver();
      this.error.set('this request no longer exists');
      return;
    }
    this.error.set(msg);
  }
  private startCooldown(seconds: number) {
    clearInterval(this.timer);
    this.resendCooldown.set(seconds);
    this.timer = setInterval(() => {
      this.resendCooldown.update((v) => Math.max(0, v - 1));
      if (this.resendCooldown() === 0) clearInterval(this.timer);
    }, 1000);
  }
}
