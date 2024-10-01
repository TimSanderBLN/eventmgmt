import { effect, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchbarHelperService {

  overlayOpen = signal(false);
  recentSearches = signal<string[]>(JSON.parse(window.localStorage.getItem('recentSearches') ?? '[]'));
  searchTerm = signal('');

  constructor() { }

  search(searchTerm: string) {
    // Set the search term and trigger the search process
    this.searchTerm.set(searchTerm.trim().toLowerCase());
    this.overlayOpen.set(false);
    this.addtoRecentSearches(searchTerm);
  }

  addtoRecentSearches(searchTerm: string) {
    const lowerCaseTerm = searchTerm.toLowerCase();
    this.recentSearches.set([lowerCaseTerm, ...this.recentSearches().filter((s) => s !== lowerCaseTerm)])
  }

  deleteRecentSearch(searchTerm: string) {
    this.recentSearches.set(this.recentSearches().filter(s => s !== searchTerm));
    window.localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches()));

    if (this.recentSearches.length === 0) {
      this.overlayOpen.set(false);
    }
  }

  saveLocalStorage = effect(() => {
    window.localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches())
  );
  });

  clearSearch() {
    this.searchTerm.set('');
    this.overlayOpen.set(true);
  }

  // New method: Check if a title matches the search term
  matchesSearchTerm(title: string): boolean {
    const term = this.searchTerm().toLowerCase();
    return title.toLowerCase().includes(term);
  }
}

