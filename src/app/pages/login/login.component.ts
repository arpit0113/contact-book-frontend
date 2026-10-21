import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { homeFor } from '../../guards/role.guard';
import { apiError } from '../../utils/api-error';

// ?error=... values set by OauthSuccessHandler on the backend
const OAUTH_ERRORS: Record<string, string> = {
  use_company_email: 'Please sign in with your company email, not a personal one.',
  no_organization_for_domain: 'No organization exists for this email domain yet- register organization first and then login',
  pending_approval: 'Your account is waiting for your organization admin to approve it.',
  email_unavailable: 'Google did not share an email address with us',
  email_not_verified:'Your google email address is not verified'
};

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  mode: 'login' | 'signup' = 'login';
  name = '';
  email = '';
  password = '';
  showpassword = false;
  error = '';
  success = '';
  loading = false;

  constructor(
    private authservice: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('error');
    if (code) this.error = OAUTH_ERRORS[code] ?? 'Sign-in failed. Please try again.';
  }

  setMode(mode: 'login' | 'signup') {
    this.mode = mode;
    this.error = '';
    this.success = '';
  }

  submit(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    this.error = '';
    this.success = '';
    this.loading = true;

    if (this.mode === 'login') {
      this.authservice.login({ email: this.email, password: this.password }).subscribe({
        next: (user) => this.router.navigate([homeFor(user.accountType)]),
        error: (err) => {
          this.error = apiError(err, 'Email or password is invalid');
          this.loading = false;
        },
      });
    } else {
      this.authservice
        .signup({ name: this.name, email: this.email, password: this.password })
        .subscribe({
          next: (res) => {
            this.loading = false;
            if (res.status === 'ACTIVE') {
              this.router.navigate(['/contacts']);
            } else {
              this.success = res.message;
              this.mode = 'login';
              this.password = '';
              form.resetForm({ email: this.email });
            }
          },
          error: (err) => {
            this.error = apiError(err, 'Failed to register');
            this.loading = false;
          },
        });
    }
  }

  continueWithGoogle() {
    this.authservice.loginWithGoogle();
  }
}
