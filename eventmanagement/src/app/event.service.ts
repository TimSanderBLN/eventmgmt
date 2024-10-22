import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';  // Importiere 'of' hier
import { catchError } from 'rxjs/operators';  // Importiere 'catchError' hier

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private apiUrl = 'http://localhost:8000/events'; // API-Endpunkt
  private saveEventUrl = 'http://localhost:8000/save-event/'; // API zum Speichern

  constructor(private http: HttpClient) { }

  getEvents(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      catchError(this.handleError<any>('getEvents', []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  scrapeEvents(): Observable<any> {
    return this.http.post<any>('http://localhost:8000/scrape-events', {});
  }

  saveEvent(eventData: { event_id: number, email: string }): Observable<any> {
    return this.http.post<any>(this.saveEventUrl, eventData);
  }
  
  
}