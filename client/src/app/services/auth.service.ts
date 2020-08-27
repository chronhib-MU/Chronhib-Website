import { User } from './../interfaces/user';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Observable } from 'rxjs';
import { Component, OnChanges, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NotificationService } from '../services/notification.service';
import jwt_decode from 'jwt-decode';

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
    // console.log(localStorage.getItem('token'));
    if (localStorage.getItem('token')) {
      const token = localStorage.token;
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
    console.log("I'm out");

    localStorage.removeItem('token');
    await this.isLoggedIn(null);
    this.router.navigate(['/login']);
  }
  async login(loginForm) {
    console.log('Authenticated: ', this.authenticated);
    if (this.authenticated) {
      this.logOut();
    }
    try {
      console.table(loginForm.value);
      const { email, password } = loginForm.value;
      console.log(loginForm.value);
      const userData = { email, password };
      const signedInForm: Observable<string> = this.http.post<string>(
        `${environment.wsUrl}login/`,
        userData
      ) as Observable<string>;
      const res: string = await signedInForm.toPromise();
      console.log(JSON.parse(res));
      const { message, title, type, token } = JSON.parse(res);
      localStorage.setItem('token', token);
      this.showToaster(message, title, type);
      await this.isLoggedIn(token);
      loginForm.reset();
      this.router.navigate(['/tables']);
    } catch (error) {
      console.log(error.message);
      const res: string = error.error;
      console.log(JSON.parse(res));
      const { message, title, type } = JSON.parse(res);
      this.showToaster(message, title, type);
    }
  }

  async register(registerForm) {
    console.table(registerForm.value);
    const { firstName, lastName, email, password, confirmPassword, accessCode } = registerForm.value;
    console.log(registerForm.value);
    if (accessCode !== '100' || registerForm.invalid) {
      this.attempts++;
      console.log('Attempts: ', this.attempts);
      if (this.attempts === 3) {
        // Start Timeout countdown
        console.log('Starting now: ', Date.now());
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
      const newUserData = { firstName, lastName, email, password };
      const registeredForm: Observable<string> = this.http.post<string>(
        `${environment.wsUrl}register`,
        newUserData
      ) as Observable<string>;
      const res: string = await registeredForm.toPromise();
      console.log(JSON.parse(res));
      const { message, title, type } = JSON.parse(res);
      this.showToaster(message, title, type);
      registerForm.reset();
    }
  }
  async isLoggedIn(token) {
    try {
      const userDataString: string = await (this.http.post<string>(`${environment.wsUrl}isLoggedIn`, {
        token
      }) as Observable<string>).toPromise();
      const userData = JSON.parse(userDataString);
      const { First_Name, Last_Name, Email } = userData;
      this.user = { firstName: First_Name, lastName: Last_Name, email: Email };
      this.authenticated = true;
    } catch (error) {
      this.user = {
        firstName: '',
        lastName: '',
        email: ''
      };
      this.authenticated = false;
    }
  }
}
