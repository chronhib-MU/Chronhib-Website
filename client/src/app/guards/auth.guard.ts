import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (localStorage.getItem(`${window.location.origin}token`)) {
      const token = localStorage[`${window.location.origin}token`];
      this.authService.isLoggedIn(token).then(_ => {
        if (!this.authService.authenticated) {
          console.log('access denied');
          return this.router.navigate(['/login']);
        }
        return true;
      });
    } else if (!this.authService.authenticated) {
      console.log('access denied');
      return this.router.navigate(['/login']);
    }
    return true;
  }
}
