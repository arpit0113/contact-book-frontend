import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ShellComponent } from './layout/shell/shell.component';
import { ContactsListComponent } from './pages/contacts-list/contacts-list.component';
import { ContactFormComponent } from './pages/contact-form/contact-form.component';
import { ContactDetailsComponent } from './pages/contact-details/contact-details.component';
import { authGuard } from './guards/auth.guard';
import { homeGuard, roleGuard, contactGuard, permissionGuard, myRequestsGuard } from './guards/role.gurad';
import { OauthSuccessComponent } from './pages/oauth-success/oauth-success.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ContactImportComponent } from './pages/contact-import/contact-import.component';
import { MyRequestsComponent } from './pages/my-requests/my-requests.component';
import { PendingRequestsComponent } from './pages/pending-requests/pending-requests.component';
import { PendingUsersComponent } from './pages/pending-users/pending-users.component';
import { RegisterOrganizationComponent } from './pages/register-organization/register-organization.component';
import { OrgRequestsComponent } from './pages/org-requests/org-requests.component';
import { OrgRequestDetailsComponent } from './pages/org-request-details/org-request-details.component';
import { RolesComponent } from './pages/roles/roles.component';
import { WorkflowsComponent } from './pages/workflows/workflows.component';



export const routes: Routes = [
 
  { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] },

 
  { path: 'login', component: LoginComponent },
  { path: 'register-organization', component: RegisterOrganizationComponent },
  { path: 'oauth-success', component: OauthSuccessComponent },

 
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'profile', component: ProfileComponent },

      // contacts
      { path: 'contacts', component: ContactsListComponent, canActivate: [contactGuard] },
      { path: 'contacts/add', component: ContactFormComponent, canActivate: [contactGuard] },
      { path: 'contacts/import', component: ContactImportComponent, canActivate: [contactGuard] },
      { path: 'contacts/:id', component: ContactDetailsComponent, canActivate: [contactGuard] },
      { path: 'contacts/:id/edit', component: ContactFormComponent, canActivate: [contactGuard] },
      
      // change requests
      { path: 'my-requests', component: MyRequestsComponent, canActivate: [myRequestsGuard] },
      { path: 'requests/pending', component: PendingRequestsComponent, canActivate: [permissionGuard('REQUEST_APPROVE')] },

      // org admin
      { path: 'team/pending', component: PendingUsersComponent, canActivate: [permissionGuard('USER_APPROVE')] },

      {path: 'roles', component : RolesComponent , canActivate: [permissionGuard('ROLE_MANAGE')]},

      {path : 'workflows', component : WorkflowsComponent, canActivate: [permissionGuard('WORKFLOW_MANAGE')]},
      // super admin
      { path: 'super-admin/organization-requests', component: OrgRequestsComponent, canActivate: [roleGuard(['SUPER_ADMIN'])] },
      {path: 'super-admin/organization-requests/:id', component: OrgRequestDetailsComponent, canActivate : [roleGuard(['SUPER_ADMIN'])]},
    ],
  },

  { path: '**', redirectTo: '' },
];
