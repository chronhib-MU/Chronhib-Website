import { AuthService } from './../../services/auth.service';
import { Component, OnInit, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnChanges {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService
  ) {}
  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  ngOnChanges() {
    this.loginForm = this.fb.group({
      email: [this.loginForm.value.email, [Validators.required, Validators.email]],
      password: [this.loginForm.value.password, Validators.required]
    });
  }

  get lF() {
    return this.loginForm.controls;
  }
}
