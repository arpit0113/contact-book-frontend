import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { homeFor } from '../../guards/role.gurad';

@Component({
  selector: 'app-oauth-success',
  imports: [],
  standalone: true,
  templateUrl: './oauth-success.component.html',
  styleUrl: './oauth-success.component.scss',
})
export class OauthSuccessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authservice: AuthService
  ) {}

  ngOnInit() {
    // backend redirects to /oauth-success?token=<access>&refreshToken=<refresh>
    const token = this.route.snapshot.queryParamMap.get('token');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.authservice.completeOAuthLogin(token, refreshToken).subscribe({
      // replaceUrl so the tokens in the query string don't stay in browser history
      next: (user) => this.router.navigate([homeFor(user.role)], { replaceUrl: true }),
      error: () => this.authservice.forceLogout(),
    });
  }
}
