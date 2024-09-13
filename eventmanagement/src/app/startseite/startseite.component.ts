import { Component, computed, inject } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { MatToolbar } from '@angular/material/toolbar'
import { MatIconButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { OverlayModule } from '@angular/cdk/overlay'
import { SearchbarHelperService } from '../searchbar-helper.service';
import { MatDivider } from '@angular/material/divider'
import { MatListModule } from '@angular/material/list'
import { NgClass, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ViewChild, ElementRef } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';  // Import for Chips
import { MatIconModule } from '@angular/material/icon';    // Import for Icons
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';  // For animations in Material

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
    
  ],
  templateUrl: './startseite.component.html',
  styleUrl: './startseite.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush
  
})
export class StartseiteComponent {

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
selectedChips: string[] = []; // Array zum Speichern der ausgewählten Chips

// Methode zum Umschalten eines Chips
toggleChip(chip: string) {
  if (chip === 'alles') {
    // Wenn "alles" gewählt wurde, alle anderen Chips zurücksetzen
    this.selectedChips = ['alles'];
  } else {
    // Entferne "alles" aus den ausgewählten Chips, wenn ein anderer Chip gewählt wird
    const allesIndex = this.selectedChips.indexOf('alles');
    if (allesIndex > -1) {
      this.selectedChips.splice(allesIndex, 1);
    }

    // Wenn der Chip bereits ausgewählt ist, entferne ihn
    const index = this.selectedChips.indexOf(chip);
    if (index > -1) {
      this.selectedChips.splice(index, 1);
    } else {
      // Füge den Chip zu den ausgewählten Chips hinzu
      this.selectedChips.push(chip);
    }
  }
}
}