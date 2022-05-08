import { Component, OnInit } from '@angular/core';
import { catchError, map, Observable, of, startWith } from 'rxjs';
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

  constructor(private serverSvc: ServerService){}

  ngOnInit(): void {
    this.appState$ = this.serverSvc.servers$
    .pipe(
      map(response => {
        return { dataState: DataState.LOADED_STATE, appData: response}
      }),
      startWith({ dataState: DataState.LOADING_STATE }),
      catchError((error: string) => {
        return of({ dataState: DataState.ERROR_STATE, error: error })
      })
    );
  }
}
