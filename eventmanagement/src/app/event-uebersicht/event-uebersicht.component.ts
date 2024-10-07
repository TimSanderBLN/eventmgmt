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

  currentUser = 'Max Mustermann'; // Beispiel-Benutzername
  
  constructor(private authService: AuthService,  private router: Router, private eventService: EventService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);  // Falls der Benutzer nicht eingeloggt ist
    } else {
      this.currentUser = this.authService.getUsername();  // Benutzernamen setzen
    }

    // Ende Authentifizierung
  
    console.log('Initialisiere Komponente, lade Events...');
    this.selectedFilter = 'alles';
  
    // Aktuelles Datum setzen
    const today = new Date();
    this.selectedDate = today.toISOString().substring(0, 10); // Setzt das Datum im Format yyyy-mm-dd
  
    // Events laden und sicherstellen, dass der Filter direkt angewendet wird
    this.loadEvents();
  }
  
  searchbarHelperService = inject(SearchbarHelperService);
  overlayOpen = this.searchbarHelperService.overlayOpen;
  recentSearches = computed(() => this.searchbarHelperService.recentSearches().slice(0, 5));
  searchTerm = this.searchbarHelperService.searchTerm;

  deleteRecentSearch(searchTerm: string) {
    this.searchbarHelperService.deleteRecentSearch(searchTerm);
  }

  search(searchTerm: string) {
    if (!searchTerm) return;

    // Reset datepicker to current date
    const today = new Date();
    this.selectedDate = today.toISOString().substring(0, 10);

    // Reset chips to default 'alles'
    this.selectedChips = ['alles'];

    // Trigger the search in the SearchbarHelperService
    this.searchbarHelperService.search(searchTerm);

    // Apply the search filter to the events
    this.applyFilter();
  }

  performSearch(searchTerm: string) {
    this.searchbarHelperService.search(searchTerm);
  }

  clearSearch() {
    this.searchbarHelperService.clearSearch();
  }

  selectedDate: Date | string = '';

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

  // Methode zum Öffnen des nativen Datepickers
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
  updateDate(event: any) {
    const date = new Date(event.target.value);
    if (!isNaN(date.getTime())) {
      this.selectedDate = date.toISOString().split('T')[0]; // Formatierung in yyyy-MM-dd
      this.applyFilter(); // Filter anwenden nach der Auswahl
    } else {
      console.log('Ungültiges Datum gewählt');
    }
  }

  // Chips logik
  selectedChips: string[] = ['alles']; // Array zum Speichern der ausgewählten Chips

  // Methode zum Umschalten eines Chips
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
  
    // Filter auf die Events anwenden, wenn der Chip gewechselt wird
    this.applyFilter();
  }

  // Events abrufen mit API und EventService
  selectedFilter = 'alles';
  events: any[] = [];
  displayedEvents: any[] = [];  // Für die gefilterten Events
  isLoading: boolean = false;

  loadEvents(): void {
    this.isLoading = true;

    this.eventService.getEvents().subscribe({
      next: (data) => {
        console.log('Daten von API empfangen:', data);
        this.events = data;

        // Events nach Datum sortieren
        this.events.sort((a, b) => {
          const dateA = a.datum ? new Date(a.datum).getTime() : Infinity;
          const dateB = b.datum ? new Date(b.datum).getTime() : Infinity;
          return dateA - dateB;
        });

        this.isLoading = false;
        this.applyFilter();  // Filter anwenden nach dem Laden der Events
        this.cdr.detectChanges();
        console.log('Sortierte Events:', this.events);
      },
      error: (error) => {
        console.error('Fehler beim Abrufen der Events:', error);
        this.isLoading = false;
      }
    });
  }

  // Filterlogik nach Datum und Chips
  applyFilter(): void {
    const currentDate = this.selectedDate ? new Date(this.selectedDate) : new Date();
  
    // Perform search term check first
    const searchTerm = this.searchbarHelperService.searchTerm();
    if (searchTerm) {
      this.displayedEvents = this.events.filter(event => {
        // Filter only by title if search term exists
        return this.searchbarHelperService.matchesSearchTerm(event.titel);
      });
      return;
    }

    // Default filtering logic based on chips and datepicker
    if (this.selectedChips.includes('alles')) {
      this.displayedEvents = this.events.filter(event => {
        const eventDate = event.datum ? new Date(event.datum) : null;
        return !eventDate || eventDate >= currentDate;
      });
      return;
    }

    this.displayedEvents = this.events.filter(event => {
      const eventDate = event.datum ? new Date(event.datum) : null;

      if (this.selectedChips.includes('Events') && event.typ === 'Event') {
        return !eventDate || eventDate >= currentDate;
      }
      if (this.selectedChips.includes('Webinare') && 
          (event.typ === 'Webinar' || event.typ === 'On-Demand Webinar')) {
        return !eventDate || eventDate >= currentDate;
      }
      if (this.selectedChips.includes('Demo') && event.typ === 'Demo') {
        return !eventDate || eventDate >= currentDate;
      }

      return false;
    });
  }

  // Textlogik für vergangene oder zukünftige Events
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
  
  
  getEventDateClass(eventDatum: string | null): string {
    if (!eventDatum) {
      console.log('Kein Datum für das Event vorhanden:', eventDatum);
      return ''; // Gib eine leere Klasse zurück, falls kein Datum vorhanden ist
    }
  
    const today = new Date();
    const eventDate = new Date(eventDatum);
  
    if (eventDate < today) {
      console.log('Event ist vorbei:', eventDatum);
      return 'past-event'; // Klasse für vergangene Events
    } else {
      console.log('Event in der Zukunft:', eventDatum);
      return 'future-event'; // Klasse für zukünftige Events
    }
  }
  
  

  reloadEvents(): void {
    this.isLoading = true;
    this.eventService.scrapeEvents().subscribe({
      next: (response) => {
        console.log('Events successfully scraped:', response);
        this.loadEvents();
      },
      error: (error) => {
        console.error('Error scraping events:', error);
        this.isLoading = false;
      }
    });
  }

  navigateToEvent(link: string): void {
    window.open(link, '_blank');  // Öffnet den Link in einem neuen Tab
  }
}
