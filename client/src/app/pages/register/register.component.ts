import { Observable } from 'rxjs';
import { Component, OnChanges, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnChanges {
  registerForm: FormGroup;
  attempts = 0;
  timeout = 1;
  timeLeftString = '59s';

  blocked = (attempts: number) => attempts === 3;
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
  constructor(private fb: FormBuilder, private http: HttpClient, private notifyService: NotificationService) {}
  ngOnInit() {
    this.registerForm = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required],
        accessCode: ['', Validators.required]
      },
      {
        validator: this.mustMatch('password', 'confirmPassword')
      }
    );
  }
  ngOnChanges() {
    this.registerForm = this.fb.group(
      {
        firstName: [this.registerForm.value.firstName, Validators.required],
        lastName: [this.registerForm.value.lastName, Validators.required],
        email: [this.registerForm.value.email, [Validators.required, Validators.email]],
        password: [this.registerForm.value.password, Validators.required],
        confirmPassword: [this.registerForm.value.confirmPassword, Validators.required]
      },
      {
        validator: this.mustMatch('password', 'confirmPassword')
      }
    );
  }
  get rF() {
    return this.registerForm.controls;
  }

  async createAccount() {
    console.table(this.registerForm.value);
    const { firstName, lastName, email, password, confirmPassword, accessCode } = this.registerForm.value;
    console.log(this.registerForm.value);
    if (accessCode !== '100') {
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
        `${environment.wsUrl}register/`,
        newUserData
      ) as Observable<string>;
      const res: string = await registeredForm.toPromise();
      console.log(JSON.parse(res));
      const { message, title, type } = JSON.parse(res);
      this.showToaster(message, title, type);
      this.registerForm.reset();
    }
  }

  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];
      if (matchingControl.errors && !matchingControl.errors.mustMatch) {
        // return if another validator has already found an error on the matchingControl
        return;
      }

      // set error on matchingControl if validation fails
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }
}
