import { TestBed } from '@angular/core/testing';

import { SearchbarHelperService } from './searchbar-helper.service';

describe('SearchbarHelperService', () => {
  let service: SearchbarHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchbarHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
