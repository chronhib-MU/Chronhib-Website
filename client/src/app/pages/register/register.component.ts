import { AuthService } from './../../services/auth.service';
import { Component, OnChanges, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnChanges {
  registerForm: FormGroup;
  

  blocked = (attempts: number) => attempts === 3;

  constructor(private fb: FormBuilder, public authService: AuthService) {}
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
