import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventUebersichtComponent } from './event-uebersicht.component';

describe('EventUebersichtComponent', () => {
  let component: EventUebersichtComponent;
  let fixture: ComponentFixture<EventUebersichtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventUebersichtComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventUebersichtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
