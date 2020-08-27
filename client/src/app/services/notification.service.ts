import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private toastr: ToastrService) {}
  showSuccess(message, title, option?) {
    this.toastr.success(message, title);
  }
  showError(message, title, option?) {
    this.toastr.error(message, title);
  }
  showWarning(message, title, option?) {
    this.toastr.warning(message, title);
  }
  showInfo(message, title, option?) {
    this.toastr.info(message, title);
  }
}
