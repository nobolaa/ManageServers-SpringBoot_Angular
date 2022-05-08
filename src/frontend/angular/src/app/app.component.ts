import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, startWith } from 'rxjs';
import { DataState } from './enum/data.state.enum';
import { Status } from './enum/status.enum';
import { AppState } from './interface/app-state.interface';
import { CustomResponse } from './interface/custom-response.interface';
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
  filterStatus2$ = this.filterSubject.asObservable();

  constructor(private serverSvc: ServerService){}

  ngOnInit(): void {
    this.appState$ = this.serverSvc.servers$
    .pipe(
      map(response => {
        this.dataSubject.next(response);
        return { dataState: DataState.LOADED_STATE, appData: response}
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

      startWith({ dataState: DataState.LOADING_STATE }),

      catchError((error: string) => {
        return of({ dataState: DataState.ERROR_STATE, error: error })
      })
    );
  }
}
