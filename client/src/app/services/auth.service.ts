import { User } from './../interfaces/user';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NotificationService } from '../services/notification.service';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: User = {
    firstName: '',
    lastName: '',
    email: ''
  };
  attempts = 0;
  timeout = 1;
  timeLeftString = '59s';
  authenticated = false;
  constructor(private http: HttpClient, private notifyService: NotificationService, private router: Router) {
    // console.log(localStorage.getItem(`${window.location.origin}token`));
    if (localStorage.getItem(`${window.location.origin}token`)) {
      const token = localStorage[`${window.location.origin}token`];
      this.isLoggedIn(token);
    }
  }
  showToaster = (message, title, type, options?) => {
    switch (type) {
      case 'success':
        this.notifyService.showSuccess(message, title, options);
        break;
      case 'error':
        this.notifyService.showError(message, title, options);
        break;
      case 'warning':
        this.notifyService.showWarning(message, title, options);
        break;
      case 'info':
        this.notifyService.showInfo(message, title, options);
        break;
      default:
        break;
    }
  };
  async logOut() {
    console.log('Logged out');
    this.showToaster('You have successfully logged out.', 'Logout successful!', 'success');
    localStorage.removeItem(`${window.location.origin}token`);
    await this.isLoggedIn(null);
    this.router.navigate(['/login']);
  }
  async login(loginForm) {
    if (this.authenticated) {
      this.logOut();
    }
    try {
      // console.table(loginForm.value);
      const { email, password } = loginForm.value;
      // console.log(loginForm.value);
      const userData = { email, password };
      userData.password = CryptoJS.SHA512(userData.password).toString(CryptoJS.enc.Base64);
      // console.log(userData);
      const signedInForm: Observable<string> = this.http.post<string>(
        `${environment.wsUrl}login/`,
        userData
      ) as Observable<string>;
      const res: any = await signedInForm.toPromise();
      // console.log(res);
      const { message, title, type, token } = res;
      localStorage.setItem(`${window.location.origin}token`, token);
      this.showToaster(message, title, type);
      await this.isLoggedIn(token);
      loginForm.reset();
      this.router.navigate(['/tables']);
    } catch (error) {
      // console.error(error.message);
      const res: any = error.error;
      // console.log(res);
      const { message, title, type } = res;
      this.showToaster(message, title, type);
    }
  }

  async register(registerForm) {
    // console.table(registerForm.value);
    const { firstName, lastName, email, password, confirmPassword, accessCode } = registerForm.value;
    // console.log(registerForm.value);
    if (accessCode !== '100' || registerForm.invalid) {
      this.attempts++;
      // console.log('Attempts: ', this.attempts);
      if (this.attempts === 3) {
        // Start Timeout countdown
        // console.log('Starting now: ', Date.now());
        const t: Date = new Date(Date.now());
        t.setMinutes(t.getMinutes() + this.timeout);
        const countDownDate = t.getTime();
        const timer = setInterval(() => {
          const now = new Date().getTime();

          // Find the distance between now and the count down date
          const timeLeft = countDownDate - now;

          // Time calculations for days, hours, minutes and seconds
          const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

          // Store the result in "timeLeft"
          this.timeLeftString =
            (days ? days + 'd ' : '') + (hours ? hours + 'h ' : '') + (minutes ? minutes + 'm ' : '') + (seconds + 's');

          // If the count down is finished, write some text
          if (timeLeft < 0) {
            this.attempts = 0;
            console.log('Now you can try again!');
            clearInterval(timer);
          }
        }, 1000);
      }
    } else {
      try {
        const newUserData = { firstName, lastName, email, password };
        newUserData.password = CryptoJS.SHA512(newUserData.password).toString(CryptoJS.enc.Base64);
        const registeredForm: Observable<string> = this.http.post<string>(
          `${environment.wsUrl}register`,
          newUserData
        ) as Observable<string>;
        const res: any = await registeredForm.toPromise();
        // console.log(res);
        const { message, title, type } = res;
        this.showToaster(message, title, type);
        registerForm.reset();
      } catch (error) {
        // console.error(error);
        const { message, title, type } = error.error;
        this.showToaster(message, title, type);
      }
    }
  }
  async isLoggedIn(token) {
    try {
      const userData: { First_Name; Last_Name; Email } = await (this.http.post<string>(
        `${environment.wsUrl}isLoggedIn`,
        {
          token
        }
      ) as Observable<any>).toPromise();
      const { First_Name, Last_Name, Email } = userData;
      // console.log(userData);
      this.user = { firstName: First_Name, lastName: Last_Name, email: Email };
      this.authenticated = true;
      console.log('Authenticated Status: ', this.authenticated);
    } catch (error) {
      // console.error(error);
      // const { message, title, type } = error.error;
      // this.showToaster(message, title, type);
      this.user = {
        firstName: '',
        lastName: '',
        email: ''
      };
      console.log('Authenticated Status: ', this.authenticated);
      this.authenticated = false;
      console.log('Authenticated Status: ', this.authenticated);
    }
  }
}
