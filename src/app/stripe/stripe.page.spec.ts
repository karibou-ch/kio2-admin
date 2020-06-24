import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StripePage } from './stripe.page';

describe('StripePage', () => {
  let component: StripePage;
  let fixture: ComponentFixture<StripePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StripePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(StripePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
