import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, catchError, map, Observable, of, startWith } from 'rxjs';
import { DataState } from './enum/data.state.enum';
import { Status } from './enum/status.enum';
import { AppState } from './interface/app-state.interface';
import { CustomResponse } from './interface/custom-response.interface';
import { Server } from './interface/server.interface';
import { ServerService } from './service/server.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  appState$: Observable<AppState<CustomResponse>>;
  readonly DataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  filterStatus$ = this.filterSubject.asObservable();
  private isSavingServer = new BehaviorSubject<boolean>(false);
  isSavingServerStatus$ = this.isSavingServer.asObservable();

  constructor(private serverSvc: ServerService){}

  ngOnInit(): void {
    this.appState$ = this.serverSvc.servers$
    .pipe(
      map(response => {
        this.dataSubject.next(response);
        return { dataState: DataState.LOADED_STATE, appData: { ...response, data: {servers: response.data.servers.reverse()} }}
      }),
      startWith({ dataState: DataState.LOADING_STATE }),
      catchError((error: string) => {
        return of({ dataState: DataState.ERROR_STATE, error: error })
      })
    );
  }

  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverSvc.ping$(ipAddress)
    .pipe(
      map(response => {
        const index = this.dataSubject.value.data.servers
                        .findIndex(server => server.id === response.data.server.id)
      
        this.dataSubject.value.data.servers[index] = response.data.server;
        this.filterSubject.next('');

        return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
      }),

      startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),

      catchError((error: string) => {
        this.filterSubject.next('');
        return of({ dataState: DataState.ERROR_STATE, error: error })
      })
    );
  }

  filterServers(status: Status): void {
    this.appState$ = this.serverSvc.filter$(status, this.dataSubject.value)
    .pipe(
      map(response => {
        return { dataState: DataState.LOADED_STATE, appData: response }
      }),

      startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),

      catchError((error: string) => {
        return of({ dataState: DataState.ERROR_STATE, error: error })
      })
    );
  }

  saveServer(serverForm: NgForm): void {
    this.isSavingServer.next(true);
    this.appState$ = this.serverSvc.save$(<Server>serverForm.value)
    .pipe(
      map(response => {
        const allServers: CustomResponse = {
          ...response,
          data: {servers: [response.data.server, ...this.dataSubject.value.data.servers]}
        }
        this.dataSubject.next(allServers);
        document.getElementById('closeModal').click();
        this.isSavingServer.next(false);
        serverForm.resetForm({ status: this.Status.SERVER_DOWN });
        return { dataState: DataState.LOADED_STATE, appData: allServers }
      }),

      startWith({ dataState: DataState.LOADING_STATE }),

      catchError((error: string) => {
        this.isSavingServer.next(false);
        return of({ dataState: DataState.ERROR_STATE, error: error })
      })
    );
  }
}
