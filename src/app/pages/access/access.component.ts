import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { KeycloakService } from '../../services/keycloak.service';

interface Message { title: string; text: string; registerOrg?: boolean; }


const MESSAGES: Record<string, Message> = {
  pending_approval: {
    title: 'Waiting for approval',
    text: 'Your account was created. Your organization admin has to approve it before you can use the app.',
  },
  no_organization_for_domain: {
    title: 'No organization for your email',
    text: 'No organization exists for your email domain yet. Register your organization first, then sign in again once it is approved.',
    registerOrg: true,
  },
  email_not_verified: {
    title: 'Verify your email',
    text: 'Your email address is not verified yet. Open the verification email from Keycloak, then try again.',
  },
  email_unavailable: {
    title: 'No email address',
    text: 'Your sign-in did not include an email address, so the app cannot match you to an account.',
  },
  account_conflict: {
    title: 'Account conflict',
    text: 'This email is already linked to a different login. Please contact your administrator.',
  },
  unauthorized: {
    title: 'Sign-in was not accepted',
    text: 'The server did not accept your sign-in. Please sign out and try again.',
  },
  error: {
    title: 'Something went wrong',
    text: 'We could not load your account. Please try again.',
  },
    org_request_pending: {
    title: 'Organization request pending',
    text: 'Your organization registration is waiting for approval by the platform admin. You can sign in once it is approved.',
  },
  org_request_unverified: {
    title: 'Finish your registration',
    text: 'You started registering an organization but have not entered the verification code yet. Continue where you left off.',
    registerOrg: true,
  },
  org_request_rejected: {
    title: 'Registration rejected',
    text: 'Your organization registration was rejected. You can apply again.',
    registerOrg: true,
  },
};

@Component({
  selector: 'app-access',
  imports: [RouterLink],
  standalone: true,
  templateUrl: './access.component.html',
  styleUrl: './access.component.scss',
})
export class AccessComponent {
  private keycloak = inject(KeycloakService);

  message: Message;

  constructor() {
    const reason = inject(ActivatedRoute).snapshot.queryParamMap.get('reason') ?? 'error';
    this.message = MESSAGES[reason] ?? MESSAGES['error'];
  }

  tryAgain() {
    window.location.href = '/';
  }

  signOut() {
    this.keycloak.logout();
  }
}
