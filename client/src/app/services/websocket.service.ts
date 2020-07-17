import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket; // socket that connects to our socket.io server
  constructor () { }
  connect (): Subject<MessageEvent> {
    this.socket = io(environment.ws_url);

    let observable = new Observable(observer => {
      this.socket.on('message', data => {
        console.log('Received a message from websocket server!');
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    });
    let observer = {
      next: (data: Object) => {
        this.socket.emit('message', JSON.stringify(data));
      }
    };

    return Subject.create(observer, observable);
  }
}
