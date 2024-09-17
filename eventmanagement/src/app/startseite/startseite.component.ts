import { Component, computed, inject, OnInit } from '@angular/core';
import { FormControl, FormsModule, NgControl } from '@angular/forms';
import { MatToolbar } from '@angular/material/toolbar'
import { MatIconButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { OverlayModule } from '@angular/cdk/overlay'
import { SearchbarHelperService } from '../searchbar-helper.service';
import { MatDivider } from '@angular/material/divider'
import { MatListModule } from '@angular/material/list'
import { NgClass, CommonModule, NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ViewChild, ElementRef } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';  // Import for Chips
import { MatIconModule } from '@angular/material/icon';    // Import for Icons
import { provideHttpClient } from '@angular/common/http'
import { EventService } from '../event.service';
import { ChangeDetectorRef } from '@angular/core';


interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({
  selector: 'app-startseite',
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
  templateUrl: './startseite.component.html',
  styleUrl: './startseite.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush
  
})
export class StartseiteComponent implements OnInit {

  constructor(private eventService: EventService, private cdr: ChangeDetectorRef) { 
    
  }

  ngOnInit() {
    console.log('Initialisiere Komponente, lade Events...');
    this.selectedFilter = 'alles';
    
    this.loadEvents();
  }
  

searchbarHelperService = inject(SearchbarHelperService);
overlayOpen = this.searchbarHelperService.overlayOpen;
recentSearches = computed(() => this.searchbarHelperService.recentSearches().slice(0, 5));
searchTerm = this.searchbarHelperService.searchTerm

deleteRecentSearch(searchTerm: string) {
  this,this.searchbarHelperService.deleteRecentSearch(searchTerm);
}

search = (searchTerm: string) => {
  if(!searchTerm) return;

  this.searchbarHelperService.search(searchTerm);
}

performSearch(searchTerm: string) {
  this.searchbarHelperService.search(searchTerm);
}

clearSearch() {
  this.searchbarHelperService.clearSearch()
}


selectedDate: string = '';
  
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
    // Optional: Feedback für ungültiges Format
    console.log('Invalid date format');
  }

  // Aktualisiere das Eingabefeld mit dem bereinigten Wert
  event.target.value = cleanedValue;
}

// Methode zum Öffnen des nativen Datepickers
openCalendar() {
  if (this.hiddenDatepicker && this.hiddenDatepicker.nativeElement) {
    console.log('Hidden Datepicker:', this.hiddenDatepicker);
    
    // Fokus auf das Input setzen, um den nativen Datepicker zu öffnen
    this.hiddenDatepicker.nativeElement.focus();
    this.hiddenDatepicker.nativeElement.click();
  } else {
    console.log('Datepicker-Element wurde nicht gefunden.');
  }
}

// Methode zur Aktualisierung des Datums aus dem nativen Datepicker
updateDate(event: any) {
  const date = new Date(event.target.value);
  const formattedDate = date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Setze das formatierte Datum in das Eingabefeld
  this.selectedDate = formattedDate;
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

  // Event-Ladefunktion nach Auswahl eines Chips aufrufen
  this.loadEvents();
}

// Events abrufen mit API und EventService
selectedFilter = 'alles'
events: any[] = []; // Array zur Speicherung der Events
isLoading: boolean = false;  // Ladezustand hinzufügen


loadEvents(): void {
  this.isLoading = true; // Ladezustand aktivieren

  if (this.selectedFilter === 'alles') {
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

        this.isLoading = false; // Ladezustand deaktivieren
        this.cdr.detectChanges(); // Change Detection manuell auslösen
        console.log('Sortierte Events:', this.events);
      },
      error: (error) => {
        console.error('Fehler beim Abrufen der Events:', error);
        this.isLoading = false; // Ladezustand auch bei Fehler deaktivieren
      }
    });
  }
  console.log('Loaded events:', this.events);
}
  


// Funktion, um den Filter zu setzen, wenn ein Chip ausgewählt wird
onFilterChange(filter: string): void {
  this.selectedFilter = filter;
  this.loadEvents();
}

reloadEvents(): void {
  this.isLoading = true; // Ladezustand setzen, wenn neu geladen wird
  this.eventService.scrapeEvents().subscribe({
    next: (response) => {
      console.log('Events successfully scraped:', response);
      this.loadEvents(); // Events neu laden
    },
    error: (error) => {
      console.error('Error scraping events:', error);
      this.isLoading = false; // Ladezustand deaktivieren, falls Fehler
    }
  });
}
  
  navigateToEvent(link: string): void {
    window.open(link, '_blank');  // Öffnet den Link in einem neuen Tab
  }
  
}