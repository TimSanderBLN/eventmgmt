import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GespeicherteEventsService {

  private apiUrl = 'http://localhost:8000/gespeicherte-events'; // API-Endpunkt

  constructor(private http: HttpClient) { }

  getGespeicherteEvents(email: string): Observable<any> {
    const url = `${this.apiUrl}?email=${email}`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError<any>('getGespeicherteEvents', []))
    );
  }

  // In event.service.ts
  deleteSavedEvent(savedEventId: number) {
    return this.http.delete(`http://localhost:8000/delete-event/${savedEventId}`);
  }
  


  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
