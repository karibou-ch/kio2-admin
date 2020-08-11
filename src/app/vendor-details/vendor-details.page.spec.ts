import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { VendorDetailsPage } from './vendor-details.page';

describe('VendorDetailsPage', () => {
  let component: VendorDetailsPage;
  let fixture: ComponentFixture<VendorDetailsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorDetailsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(VendorDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
