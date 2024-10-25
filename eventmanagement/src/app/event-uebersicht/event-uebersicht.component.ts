import { Component, computed, inject, OnInit } from '@angular/core';
import { FormControl, FormsModule, NgControl } from '@angular/forms';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { SearchbarHelperService } from '../searchbar-helper.service';
import { MatDivider } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { NgClass, CommonModule, NgComponentOutlet, formatDate } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ViewChild, ElementRef } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';  // Import for Chips
import { MatIconModule } from '@angular/material/icon';    // Import for Icons
import { provideHttpClient } from '@angular/common/http';
import { EventService } from '../event.service';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { GespeicherteEventsService } from '../gespeicherte-events.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-event-uebersicht',
  standalone: true,
  imports: [
    MatToolbar,
    FormsModule,
    MatIcon,
    MatIconButton,
    OverlayModule,
    MatDivider,
    MatListModule,
    NgClass,
    CommonModule,
    MatFormFieldModule, 
    MatDatepickerModule,
    MatChipsModule,
    MatIconModule, 
    NgComponentOutlet,
    NgClass,
  ],
  templateUrl: './event-uebersicht.component.html',
  styleUrl: './event-uebersicht.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventUebersichtComponent implements OnInit{

  currentUser: string = '';
  gespeicherteEvents: any[] = [];
  displayedEvents: any[] = [];
  isLoading: boolean = false;

  searchbarHelperService = inject(SearchbarHelperService); // Für die Suchleiste
  overlayOpen = this.searchbarHelperService.overlayOpen;
  recentSearches = computed(() => this.searchbarHelperService.recentSearches().slice(0, 5));
  searchTerm = this.searchbarHelperService.searchTerm;

  selectedDate: string = '2024-09-01'; // Default date
  selectedChips: string[] = ['alles']; // Für die Filterchips

  constructor(
    private gespeicherteEventsService: GespeicherteEventsService,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
  ) {}

  isDropdownVisible: boolean = false;  // Variable zur Steuerung der Sichtbarkeit des Dropdowns
  hideDropdownTimeout: any;

  navigateToStartseite(): void {
    this.router.navigate(['']);  // Navigiert zur Seite event-uebersicht
  }

  
  showDropdown() {
    // Entfernt das Timeout, falls der Benutzer wieder in das Dropdown fährt
    if ( this.isDropdownVisible)
    {
      this.isDropdownVisible = false;
    }
    else {
      this.isDropdownVisible = true;
    }

    
  }

  hideDropdown() {
    // Setzt eine Verzögerung, um das Dropdown langsam verschwinden zu lassen
    
      this.isDropdownVisible = false;
   
  }


  logout() {
    this.authService.logout();  // Führt den Logout im AuthService aus
    
    // Zeige die Snackbar mit der Meldung "Sie haben sich ausgeloggt."
    this.snackBar.open('Sie haben sich ausgeloggt.', 'Schließen', {
      duration: 3000,  // Die Snackbar wird 3 Sekunden lang angezeigt
    });
    this.router.navigate(['']);
    this.isDropdownVisible = false;  // Dropdown schließen
    this.cdr.detectChanges();  // UI neu rendern
  }
  

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser = this.authService.getUsername();
    this.loadGespeicherteEvents();
  }

  removeEvent(savedEventId: number) {
    this.gespeicherteEventsService.deleteSavedEvent(savedEventId).subscribe(() => {
      this.loadGespeicherteEvents();  // Aktualisiert die Liste der gespeicherten Events
      this.snackBar.open('Event wurde aus den gespeicherten Events entfernt.', 'Schließen', {
        duration: 3000,  // Zeige die SnackBar für 3 Sekunden
      });
    });
  }
  
  

  // Gespeicherte Events laden
  loadGespeicherteEvents(): void {
    this.isLoading = true;
    this.gespeicherteEventsService.getGespeicherteEvents(this.currentUser).subscribe({
      next: (events) => {
        this.gespeicherteEvents = events;

        // Events nach Datum sortieren
        this.gespeicherteEvents.sort((a, b) => {
          const dateA = a.datum ? new Date(a.datum).getTime() : Infinity;
          const dateB = b.datum ? new Date(b.datum).getTime() : Infinity;
          return dateA - dateB;
        });

        this.applyFilter();  // Filter anwenden nach dem Laden der Events
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Fehler beim Laden der gespeicherten Events:', error);
        this.isLoading = false;
      }
    });
  }

  getEventDateClass(eventDatum: string | null): string {
    if (!eventDatum) {
      return ''; // Gib eine leere Klasse zurück, falls kein Datum vorhanden ist
    }
  
    const today = new Date();
    const eventDate = new Date(eventDatum);
  
    if (eventDate < today) {
      return 'past-event'; // Klasse für vergangene Events
    } else {
      return 'future-event'; // Klasse für zukünftige Events
    }
  }

  getEventDateText(eventDatum: string | null): string {
    if (!eventDatum) {
      return 'Kein Datum';
    }
  
    const eventDate = new Date(eventDatum);
    const currentDate = new Date();
  
    if (eventDate < currentDate) {
      return 'Event ist vorbei';
    } else {
      return `Event findet am ${eventDate.toLocaleDateString()} statt`;
    }
  }
  

  // Filterlogik
  applyFilter(): void {
    const currentDate = this.selectedDate ? new Date(this.selectedDate) : new Date();

    // Zuerst die Suche durchführen
    const searchTerm = this.searchbarHelperService.searchTerm();
    if (searchTerm) {
      this.displayedEvents = this.gespeicherteEvents.filter(event => {
        return this.searchbarHelperService.matchesSearchTerm(event.titel);
      });
      return;
    }

    // Standardmäßige Filterlogik basierend auf Chips und Datum
    if (this.selectedChips.includes('alles')) {
      this.displayedEvents = this.gespeicherteEvents.filter(event => {
        const eventDate = event.datum ? new Date(event.datum) : null;
        return !eventDate || eventDate >= currentDate;
      });
      return;
    }

    this.displayedEvents = this.gespeicherteEvents.filter(event => {
      const eventDate = event.datum ? new Date(event.datum) : null;

      if (this.selectedChips.includes('Events') && event.typ === 'Event') {
        return !eventDate || eventDate >= currentDate;
      }
      if (this.selectedChips.includes('Webinare') && (event.typ === 'Webinar' || event.typ === 'On-Demand Webinar')) {
        return !eventDate || eventDate >= currentDate;
      }
      if (this.selectedChips.includes('Demo') && event.typ === 'Demo') {
        return !eventDate || eventDate >= currentDate;
      }

      return false;
    });
  }

  // Suchleiste
  search(searchTerm: string) {
    if (!searchTerm) return;

    // Setze das Datum auf das aktuelle zurück
    const today = new Date();
    this.selectedDate = today.toISOString().substring(0, 10);

    // Setze die Chips auf 'alles' zurück
    this.selectedChips = ['alles'];

    // Starte die Suche
    this.searchbarHelperService.search(searchTerm);

    // Wende den Filter auf die Events an
    this.applyFilter();
  }

  // Chips Logik
  toggleChip(chip: string) {
    if (chip === 'alles') {
      this.selectedChips = ['alles'];
    } else {
      const allesIndex = this.selectedChips.indexOf('alles');
      if (allesIndex > -1) {
        this.selectedChips.splice(allesIndex, 1);
      }
      const index = this.selectedChips.indexOf(chip);
      if (index > -1) {
        this.selectedChips.splice(index, 1);
      } else {
        this.selectedChips.push(chip);
      }
    }

    // Filter anwenden
    this.applyFilter();
  }


  // Zugriff auf das versteckte Datepicker-Input
  @ViewChild('hiddenDatepicker')
  hiddenDatepicker!: ElementRef<HTMLInputElement>;
  myControl = new FormControl('');

  // Methode zur Validierung der manuellen Datumseingabe
  validateDateInput(event: any) {
    const value = event.target.value;
    const regex = /^(0?[1-9]|[12][0-9]|3[01])\.(0?[1-9]|1[012])\.(\d{4})$/;

    // Entferne alle nicht-zulässigen Zeichen (nur Zahlen und Punkte)
    const cleanedValue = value.replace(/[^0-9.]/g, '');

    // Formatierte Eingabe nur zulassen, wenn sie dem regulären Ausdruck entspricht
    if (cleanedValue.length === 10 && regex.test(cleanedValue)) {
      this.selectedDate = cleanedValue;
    } else {
      console.log('Invalid date format');
    }

    event.target.value = cleanedValue;
  }

  // Datum aktualisieren
  openCalendar() {
    if (this.hiddenDatepicker && this.hiddenDatepicker.nativeElement) {
      console.log('Hidden Datepicker:', this.hiddenDatepicker);

      this.hiddenDatepicker.nativeElement.focus();
      this.hiddenDatepicker.nativeElement.click();
    } else {
      console.log('Datepicker-Element wurde nicht gefunden.');
    }
  }

  // Methode zur Aktualisierung des Datums aus dem nativen Datepicker
 // Methode zur Aktualisierung des Datums aus dem nativen Datepicker
 updateDate(event: any) {
  const date = new Date(event.target.value);
  if (!isNaN(date.getTime())) {
    this.selectedDate = date.toISOString().split('T')[0]; // Formatierung in yyyy-MM-dd
    this.applyFilter(); // Filter anwenden nach der Auswahl
  } else {
    console.log('Ungültiges Datum gewählt');
  }
}
  // Methoden für die Suchleiste
  deleteRecentSearch(searchTerm: string) {
    this.searchbarHelperService.deleteRecentSearch(searchTerm);
  }

  clearSearch() {
    this.searchbarHelperService.clearSearch();
    this.applyFilter();
  }

  navigateToEvent(link: string): void {
    window.open(link, '_blank');
  }

 
}
