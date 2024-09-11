import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatToolbar } from '@angular/material/toolbar'
import { MatIconButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { OverlayModule } from '@angular/cdk/overlay'
import { SearchbarHelperService } from '../searchbar-helper.service';
import { MatDivider } from '@angular/material/divider'
import { MatListModule } from '@angular/material/list'
import { NgClass, CommonModule } from '@angular/common';

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
    CommonModule
  ],
  templateUrl: './startseite.component.html',
  styleUrl: './startseite.component.scss'
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

}
