import { TestBed } from '@angular/core/testing';

import { GespeicherteEventsService } from './gespeicherte-events.service';

describe('GespeicherteEventsService', () => {
  let service: GespeicherteEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GespeicherteEventsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
